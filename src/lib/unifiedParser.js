// src/lib/unifiedParser.js
// 목표: 다양한 JSON 스키마를 "표준 Finding" 배열로 변환 (툴별 어댑터 + 휴리스틱 fallback)

const adapters = [];

/* =========================
 *  Public API
 * ========================= */
export function registerAdapter(fn) {
  adapters.push(fn);
}

/** URL에서 읽어 파싱 */
export async function parseUnifiedFromUrl(url, options) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const raw = await res.json();
  return parseUnifiedReport(raw, options);
}

/** <input type="file"> 파일에서 파싱 */
export async function parseUnifiedFromFile(file, options) {
  const text = await file.text();
  const raw = JSON.parse(text);
  return parseUnifiedReport(raw, options);
}

/** 메인 파싱  */
export function parseUnifiedReport(
  raw,
  { mergeStatic = true, correlateDynamic = true } = {}
) {
  if (!raw) return emptyResult("no-input");

  // 1) 등록된 어댑터들 시도 (Semgrep/Bandit/Pytest 등)
  let findings = [];
  let used = [];
  for (const adapt of adapters) {
    try {
      const { ok, items, usedPaths } = adapt(raw);
      if (ok && Array.isArray(items) && items.length) {
        findings.push(...items);
        if (usedPaths?.length) used.push(...usedPaths);
      }
    } catch (e) {
      // 어댑터 실패는 무시(다음으로)
      console.warn("[adapter error]", e);
    }
  }

  // 2) 아무것도 못 얻었으면
  if (!findings.length) {
    const { items, coverage } = heuristicParse(raw);
    findings = items;
    used = coverage;
  }

  // 3) 정적 합치기 + 동적 증거 연관
  const statics = findings.filter((f) => f.type === "STATIC");
  const dynamics = findings.filter((f) => f.type === "DYNAMIC");

  const mergedStatic = mergeStatic ? coalesceFindings(statics) : statics;
  const { attachedStatic, dynamicOrphans } = correlateDynamic
    ? correlateDynamicEvidence(mergedStatic, dynamics)
    : { attachedStatic: mergedStatic, dynamicOrphans: dynamics };

  const finalFindings = [...attachedStatic, ...dynamicOrphans];
  const counts = computeCounts(finalFindings);

  return {
    runId: deriveRunId(raw),
    counts,
    findings: finalFindings,
    meta: {
      sourceHint: used, // 어떤 경로/필드를 사용했는지 기록(디버깅용)
      generatedAt:
        pick(raw, ["meta.generated_at", "generated_at", "timestamp"]) || null,
      project: pick(raw, ["meta.project", "project", "repo"]) || null,
    },
    warnings: finalFindings.length
      ? []
      : ["No findings were recognized by adapters or heuristics."],
  };
}

/* =========================
 *  Built-in adapters (Semgrep / Bandit / Pytest)
 * ========================= */
registerAdapter(function semgrepAdapter(raw) {
  const items =
    get(raw, "static.semgrep.items") ||
    get(raw, "semgrep.items") ||
    get(raw, "semgrep");
  if (!Array.isArray(items) || !items.length) return { ok: false, items: [] };

  const out = items.map((it, idx) => ({
    id: `semgrep:${it.rule_id || idx}:${it.file || it.path || ""}:${
      it.line ?? it.start_line ?? ""
    }`,
    title: it.title || it.message || it.rule_id || "Semgrep finding",
    severity: mapSeverity(it.severity),
    type: "STATIC",
    file: it.file || it.path || "",
    lineStart: num(it.line) ?? num(it.start_line) ?? 0,
    lineEnd: num(it.end_line) ?? num(it.line) ?? 0,
    cwe: normalizeCwe(get(it, "cwe.id") || it.cwe),
    cvss: 0,
    recommendation:
      get(it, 'metadata["source-rule-url"]') ||
      first(get(it, "metadata.references")) ||
      get(it, "metadata.shortlink") ||
      "",
    tools: ["semgrep"],
    ruleIds: [it.rule_id || ""].filter(Boolean),
    extra: {
      owasp: get(it, "metadata.owasp") || [],
      message: it.message || "",
    },
  }));

  return { ok: true, items: out, usedPaths: ["static.semgrep.items"] };
});

registerAdapter(function banditAdapter(raw) {
  const items =
    get(raw, "static.bandit.items") ||
    get(raw, "bandit.items") ||
    get(raw, "bandit");
  if (!Array.isArray(items) || !items.length) return { ok: false, items: [] };

  const out = items.map((it, idx) => ({
    id: `bandit:${it.rule_id || it.test_id || idx}:${
      it.file || it.path || ""
    }:${it.line ?? ""}`,
    title:
      it.title || it.text || it.test_name || it.rule_id || "Bandit finding",
    severity: mapSeverity(it.severity || it.issue_severity),
    type: "STATIC",
    file: it.file || it.filename || it.path || "",
    lineStart: num(it.line) ?? num(get(it, "line_number")) ?? 0,
    lineEnd: num(it.line) ?? num(get(it, "line_number")) ?? 0,
    cwe: normalizeCwe(get(it, "cwe.id") || it.cwe),
    cvss: 0,
    recommendation: it.more_info || it.remediation || "",
    tools: ["bandit"],
    ruleIds: [it.rule_id || it.test_id || ""].filter(Boolean),
    extra: { code: it.code || "", message: it.message || it.issue_text || "" },
  }));

  return { ok: true, items: out, usedPaths: ["static.bandit.items"] };
});

registerAdapter(function pytestAdapter(raw) {
  const fails =
    get(raw, "dynamic.pytest.failures") ||
    get(raw, "pytest.failures") ||
    get(raw, "failures");
  if (!Array.isArray(fails) || !fails.length) return { ok: false, items: [] };

  const out = fails.map((f, idx) => {
    const tb =
      Array.isArray(f.traceback) && f.traceback.length ? f.traceback[0] : {};
    return {
      id: `pytest:${f.nodeid || idx}`,
      title: `PyTest Failure: ${last((f.nodeid || "test").split("::"))}`,
      severity: inferDynamicSeverity(f),
      type: "DYNAMIC",
      file: tb.path || f.path || "",
      lineStart: num(tb.lineno) ?? num(f.lineno) ?? 0,
      lineEnd: num(tb.lineno) ?? num(f.lineno) ?? 0,
      cwe: "",
      cvss: 0,
      recommendation: "런타임 재현: 입력 검증/에러 처리 보강",
      tools: ["pytest"],
      ruleIds: [f.nodeid || ""].filter(Boolean),
      extra: {
        message: f.message || "",
        traceback: f.traceback || [],
        stdout_tail: f.stdout_tail || "",
      },
    };
  });

  return { ok: true, items: out, usedPaths: ["dynamic.pytest.failures"] };
});

/* =========================
 *  Heuristic fallback
 * ========================= */
function heuristicParse(raw) {
  const coverage = [];
  const items = [];

  // 1) 최상위가 배열이면 거기서 시도
  if (Array.isArray(raw)) {
    coverage.push("$");
    items.push(...raw.flatMap((obj) => mapGenericItem(obj)));
  }

  // 2) 깊이 탐색: 객체 내에서 "객체 배열"들을 찾아 후보로 파싱
  const arrays = findObjectArrays(raw);
  for (const { path, arr } of arrays) {
    const mapped = arr.flatMap((obj) => mapGenericItem(obj));
    if (mapped.length) {
      coverage.push(path);
      items.push(...mapped);
    }
  }

  // 중복 제거(같은 id 방지)
  const byId = new Map();
  for (const it of items) {
    const id = it.id || `${it.file}:${it.lineStart}:${it.title}`;
    if (!byId.has(id)) byId.set(id, it);
  }

  return { items: [...byId.values()], coverage };
}

function findObjectArrays(obj, path = "$", acc = []) {
  if (!obj || typeof obj !== "object") return acc;
  if (Array.isArray(obj)) {
    // 배열 내 원소가 객체인 경우만 후보
    if (obj.some((v) => v && typeof v === "object" && !Array.isArray(v))) {
      acc.push({ path, arr: obj });
    }
    obj.forEach((v, i) => findObjectArrays(v, `${path}[${i}]`, acc));
  } else {
    Object.entries(obj).forEach(([k, v]) => {
      const p = `${path}.${k}`;
      if (
        Array.isArray(v) &&
        v.some((x) => x && typeof x === "object" && !Array.isArray(x))
      ) {
        acc.push({ path: p, arr: v });
      }
      findObjectArrays(v, p, acc);
    });
  }
  return acc;
}

/** 스키마를 모르는 개별 객체를 "가능한 한" 표준 Finding으로 매핑 */
function mapGenericItem(it) {
  if (!it || typeof it !== "object") return [];

  const file = firstNonNull(
    it.file,
    it.path,
    get(it, "location.file"),
    get(it, "location.path"),
    it.filename
  );
  const ls = firstNonNull(
    it.line,
    it.start_line,
    get(it, "location.start.line"),
    it.lineno,
    it.lineStart
  );
  const le = firstNonNull(
    it.end_line,
    get(it, "location.end.line"),
    it.lineEnd,
    ls
  );

  const sevRaw = firstNonNull(
    it.severity,
    it.level,
    it.priority,
    it.risk,
    it.impact,
    it.cvss,
    it.cvss_score,
    it.score
  );
  const title = firstNonNull(
    it.title,
    it.message,
    it.rule,
    it.name,
    it.issue_text,
    it.test_name,
    "Finding"
  );
  const ruleId = firstNonNull(it.rule_id, it.ruleId, it.test_id, it.code, "");
  const cwe = normalizeCwe(
    firstNonNull(get(it, "cwe.id"), it.cwe, get(it, "taxonomies.cwe"), "")
  );

  // 동적 흔적?
  const looksDynamic = !!(
    it.nodeid ||
    it.traceback ||
    it.stack ||
    it.exception ||
    /pytest|test/i.test(String(ruleId || title))
  );

  const out = {
    id: `${looksDynamic ? "dyn" : "gen"}:${file || "no-file"}:${ls ?? "0"}:${
      ruleId || baseOf(title)
    }`,
    title: String(title),
    severity: mapSeverity(sevRaw),
    type: looksDynamic ? "DYNAMIC" : "STATIC",
    file: String(file || ""),
    lineStart: num(ls) ?? 0,
    lineEnd: num(le) ?? num(ls) ?? 0,
    cwe,
    cvss: Number(it.cvss || it.cvss_score || 0) || 0,
    recommendation: firstNonNull(
      it.recommendation,
      it.remediation,
      it.more_info,
      ""
    ),
    tools: uniq([
      String(
        it.tool ||
          it.source ||
          it.engine ||
          (looksDynamic ? "runtime" : "static")
      ),
    ]),
    ruleIds: [String(ruleId || "")].filter(Boolean),
    extra: {
      message: String(firstNonNull(it.message, it.description, "") || ""),
      traceback: get(it, "traceback") || [],
    },
  };

  return [out];
}

/* =========================
 *  Merge & Correlate
 * ========================= */

function coalesceFindings(items) {
  const rank = { Critical: 3, High: 2, Medium: 1, Low: 0 };
  const buckets = new Map(); // key = file|CWE|titleBase

  const keyOf = (f) => {
    const file = normPath(f.file);
    const sig = (
      f.cwe ||
      f.ruleIds?.[0] ||
      baseOf(f.title) ||
      ""
    ).toUpperCase();
    return `${file}|${sig}`;
  };

  for (const f of items) {
    const key = keyOf(f);
    if (!buckets.has(key)) buckets.set(key, []);
    const arr = buckets.get(key);

    const mate = arr.find((g) => isCloseLine(f.lineStart, g.lineStart, 2));
    if (!mate) {
      arr.push({ ...f, tools: uniq(f.tools), ruleIds: uniq(f.ruleIds) });
      continue;
    }
    // merge
    mate.severity =
      rank[f.severity] > rank[mate.severity] ? f.severity : mate.severity;
    mate.cvss = Math.max(num(mate.cvss) ?? 0, num(f.cvss) ?? 0);
    mate.tools = uniq([...(mate.tools || []), ...(f.tools || [])]);
    mate.ruleIds = uniq([...(mate.ruleIds || []), ...(f.ruleIds || [])]);
    mate.recommendation = joinUnique([mate.recommendation, f.recommendation]);
    mate.lineStart = Math.min(num(mate.lineStart) ?? 0, num(f.lineStart) ?? 0);
    mate.lineEnd = Math.max(num(mate.lineEnd) ?? 0, num(f.lineEnd) ?? 0);
  }

  return [...buckets.values()].flat();
}

function correlateDynamicEvidence(staticItems, dynItems) {
  const byFile = new Map();
  for (const s of staticItems) {
    const k = normPath(s.file);
    if (!byFile.has(k)) byFile.set(k, []);
    byFile.get(k).push(s);
  }
  for (const arr of byFile.values())
    arr.sort((a, b) => (a.lineStart || 0) - (b.lineStart || 0));

  const attached = new Set();

  for (const d of dynItems) {
    const dynCwe = inferCweFromText(`${d.title} ${d.extra?.message || ""}`);
    const tbPath = pickAppPath(d.extra?.traceback);

    let best = null,
      bestScore = 0;

    // (a) 파일/라인 근접 우선
    if (tbPath && byFile.has(tbPath)) {
      for (const s of byFile.get(tbPath)) {
        const score =
          lineProximityScore(s.lineStart, d.lineStart) +
          cweScore(s.cwe, dynCwe);
        if (score > bestScore) {
          best = s;
          bestScore = score;
        }
      }
    }
    // (b) CWE 백업 매칭
    if (!best && dynCwe) {
      for (const s of staticItems) {
        const score = cweScore(s.cwe, dynCwe);
        if (score > bestScore) {
          best = s;
          bestScore = score;
        }
      }
    }

    if (best && bestScore >= 1) {
      best.evidence = best.evidence || {};
      best.evidence.dynamic = best.evidence.dynamic || [];
      best.evidence.dynamic.push({
        test: d.ruleIds?.[0] || d.title,
        message: d.extra?.message || "",
        traceback: d.extra?.traceback || [],
      });
      attached.add(d.id);
      best.severity = bumpSeverity(best.severity);
    }
  }

  const dynamicOrphans = dynItems.filter((d) => !attached.has(d.id));
  return { attachedStatic: staticItems, dynamicOrphans };
}

/* =========================
 *  Utilities
 * ========================= */

function deriveRunId(raw) {
  const p = pick(raw, ["meta.project", "project", "repo"]) || "project";
  const t =
    pick(raw, ["meta.generated_at", "generated_at", "timestamp"]) || Date.now();
  return `${p}@${t}`;
}

function computeCounts(list) {
  const bySeverity = {};
  const byType = {};
  for (const f of list) {
    bySeverity[f.severity] = (bySeverity[f.severity] || 0) + 1;
    byType[f.type] = (byType[f.type] || 0) + 1;
  }
  return { total: list.length, bySeverity, byType };
}

function mapSeverity(s) {
  const v = String(s ?? "")
    .toLowerCase()
    .trim();
  if (["critical", "cri"].includes(v)) return "Critical";
  if (["high", "hi"].includes(v)) return "High";
  if (["medium", "med", "mid", "moderate", "warning", "warn"].includes(v))
    return "Medium";
  if (["info", "informational", "low", "lo"].includes(v)) return "Low";
  const n = Number(s);
  if (!isNaN(n)) {
    if (n >= 9) return "Critical";
    if (n >= 7) return "High";
    if (n >= 4) return "Medium";
    return "Low";
  }
  return "Low";
}

function normalizeCwe(cwe) {
  if (!cwe) return "";
  const str = String(cwe);
  const m = str.match(/CWE-\d+/i);
  if (m) return m[0].toUpperCase();
  if (/^\d+$/.test(str)) return `CWE-${str}`;
  return str;
}

function inferDynamicSeverity(f) {
  const msg = `${f?.message || ""}`.toLowerCase();
  const node = `${f?.nodeid || ""}`.toLowerCase();
  const text = msg + " " + node;
  if (/sql.?inj|sqli/.test(text)) return "High";
  if (/command.?inj|os.?command/.test(text)) return "High";
  if (/xxe|deserialization|rce/.test(text)) return "High";
  if (/race.?condition|overflow|dos|assert|leak/.test(text)) return "Medium";
  return "Low";
}

function inferCweFromText(t) {
  t = (t || "").toLowerCase();
  if (/sql.?inj|sqli/.test(t)) return "CWE-89";
  if (/command.?inj|os.?command/.test(t)) return "CWE-78";
  if (/path.?traversal/.test(t)) return "CWE-22";
  if (/\bxxe\b/.test(t)) return "CWE-611";
  if (/\bxss\b|cross.?site/.test(t)) return "CWE-79";
  if (/csrf/.test(t)) return "CWE-352";
  return "";
}

function pick(obj, paths) {
  for (const p of paths) {
    const v = get(obj, p);
    if (v != null) return v;
  }
  return null;
}
function get(obj, dotted) {
  if (!obj) return undefined;
  return dotted
    .split(".")
    .reduce((o, k) => (o == null ? undefined : o[k]), obj);
}
const firstNonNull = (...vals) => {
  for (const v of vals) if (v !== undefined && v !== null && v !== "") return v;
  return null;
};
const normPath = (p) => String(p || "").replace(/\\/g, "/");
const baseOf = (s) => (s || "").toString().slice(0, 48);
const first = (arr) => (Array.isArray(arr) && arr.length ? arr[0] : "");
const last = (arr) =>
  Array.isArray(arr) && arr.length ? arr[arr.length - 1] : "";
const num = (v) => (v == null ? null : Number(v));
const uniq = (arr) => Array.from(new Set((arr || []).filter(Boolean)));
const joinUnique = (parts) =>
  uniq(
    (parts || [])
      .flatMap((p) => String(p || "").split(/\n+/))
      .map((s) => s.trim())
      .filter(Boolean)
  ).join("\n");
const isCloseLine = (a, b, tol = 2) =>
  Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tol;
const lineProximityScore = (a, b) =>
  isCloseLine(a, b, 2) ? 2 : isCloseLine(a, b, 5) ? 1 : 0;
const cweScore = (a, b) =>
  a && b && String(a).toUpperCase() === String(b).toUpperCase() ? 1 : 0;
const bumpSeverity = (s) => {
  const order = ["Low", "Medium", "High", "Critical"];
  const i = Math.max(0, order.indexOf(s));
  return order[Math.min(i + 1, order.length - 1)];
};

function pickAppPath(traceback = []) {
  if (!Array.isArray(traceback)) return "";
  const cand = traceback
    .map((t) => normPath(t.path))
    .filter((p) => p && !/\/site-packages\/|^\/usr\/|tests\//.test(p));
  return cand[0] || "";
}

function emptyResult(reason) {
  return {
    runId: `unknown@${Date.now()}`,
    counts: { total: 0, bySeverity: {}, byType: {} },
    findings: [],
    meta: { reason },
  };
}
