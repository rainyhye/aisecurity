// src/lib/unifiedParser.js

/** 메인 파서: 서버 unified_report.json 스키마 → 대시보드에서 쓰는 표준 구조로 변환 */
export function parseUnifiedReport(
  raw,
  { mergeStatic = true, correlateDynamic = true } = {}
) {
  if (!raw) return emptyResult();

  // 1) 원본을 finding 배열로 평탄화
  const baseFindings = [
    ...mapSemgrep(raw?.static?.semgrep?.items || []),
    ...mapBandit(raw?.static?.bandit?.items || []),
    ...mapPytest(raw?.dynamic?.pytest?.failures || []),
  ];

  // 2) 정적 중복 제거(툴합치기) → 동적 증거 연관 붙이기
  const staticOnly = baseFindings.filter((f) => f.type === "STATIC");
  const dynamicOnly = baseFindings.filter((f) => f.type === "DYNAMIC");

  const mergedStatic = mergeStatic ? coalesceFindings(staticOnly) : staticOnly;
  const { attachedStatic, dynamicOrphans } = correlateDynamic
    ? correlateDynamicEvidence(mergedStatic, dynamicOnly)
    : { attachedStatic: mergedStatic, dynamicOrphans: dynamicOnly };

  const findings = [...attachedStatic, ...dynamicOrphans];

  // 3) 집계/메타
  const counts = computeCounts(findings);
  const runId = `${raw?.meta?.project || "project"}@${
    raw?.meta?.generated_at || Date.now()
  }`;

  return {
    runId,
    counts,
    findings,
    meta: {
      project: raw?.meta?.project,
      tools: raw?.meta?.tools,
      generatedAt: raw?.meta?.generated_at,
      originals: {
        semgrep: raw?.static?.semgrep?.path,
        bandit: raw?.static?.bandit?.path,
        pytest: raw?.dynamic?.pytest?.path,
      },
    },
  };
}

/** URL에서 직접 읽어 파싱 (프론트 fetch용) */
export async function parseUnifiedFromUrl(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const raw = await res.json();
  return parseUnifiedReport(raw);
}

/** <input type="file"> 로 받은 JSON 파일에서 파싱 (로컬 JSON 업로드 테스트용) */
export async function parseUnifiedFromFile(file) {
  const text = await file.text();
  const raw = JSON.parse(text);
  return parseUnifiedReport(raw);
}

/* ---------- 매퍼들: 원본 스키마 → 공통 finding ---------- */

function mapSemgrep(items) {
  return items.map((it, idx) => ({
    id: `semgrep:${it.rule_id}:${it.file}:${it.line ?? idx}`,
    title: it.title || it.message || it.rule_id || "Semgrep finding",
    severity: mapSeverity(it.severity),
    type: "STATIC",
    file: it.file || "",
    lineStart: num(it.line) ?? num(it.start_line) ?? 0,
    lineEnd: num(it.end_line) ?? num(it.line) ?? 0,
    cwe: normalizeCwe(it?.cwe?.id),
    cvss: 0,
    recommendation:
      it?.metadata?.["source-rule-url"] ||
      first(it?.metadata?.references) ||
      it?.metadata?.shortlink ||
      "",
    tool: "semgrep",
    ruleId: it.rule_id || "",
    extra: {
      owasp: it?.metadata?.owasp || [],
      column: num(it?.column) ?? null,
      message: it?.message || "",
    },
  }));
}

function mapBandit(items) {
  return items.map((it, idx) => ({
    id: `bandit:${it.rule_id}:${it.file}:${it.line ?? idx}`,
    title: it.title || it.rule_id || "Bandit finding",
    severity: mapSeverity(it.severity),
    type: "STATIC",
    file: it.file || "",
    lineStart: num(it.line) ?? 0,
    lineEnd: num(it.line) ?? 0,
    cwe: normalizeCwe(it?.cwe?.id),
    cvss: 0,
    recommendation: it.more_info || "",
    tool: "bandit",
    ruleId: it.rule_id || "",
    extra: {
      message: it?.message || "",
      code: it?.code || "",
    },
  }));
}

function mapPytest(failures) {
  return failures.map((f, idx) => {
    const firstTb =
      Array.isArray(f.traceback) && f.traceback.length ? f.traceback[0] : null;
    return {
      id: `pytest:${f.nodeid || idx}`,
      title: `PyTest Failure: ${last((f.nodeid || "").split("::")) || "test"}`,
      severity: inferDynamicSeverity(f),
      type: "DYNAMIC",
      file: firstTb?.path || "",
      lineStart: num(firstTb?.lineno) ?? num(f.lineno) ?? 0,
      lineEnd: num(firstTb?.lineno) ?? num(f.lineno) ?? 0,
      cwe: "", // 필요 시 inferCweFromText를 사용해 붙여짐
      cvss: 0,
      recommendation: "재현 입력을 최소화하고 입력 검증/에러 처리 보강",
      tool: "pytest",
      ruleId: f.nodeid || "",
      extra: {
        message: f.message || "",
        traceback: f.traceback || [],
        stdout_tail: f.stdout_tail || "",
      },
    };
  });
}

/* ---------- 정적 합치기 & 동적 증거 연관 ---------- */

function coalesceFindings(items) {
  const rank = { Critical: 3, High: 2, Medium: 1, Low: 0 };
  const buckets = new Map(); // key = file|type|cweOrRuleOrTitleBase

  const keyOf = (f) => {
    const file = normPath(f.file);
    const cweOrRule = f.cwe || f.ruleId || baseOf(f.title);
    return `${file}|${f.type}|${(cweOrRule || "").toUpperCase()}`;
  };

  for (const f of items) {
    const key = keyOf(f);
    if (!buckets.has(key)) buckets.set(key, []);
    const arr = buckets.get(key);

    // 같은 버킷 내에서 같은 라인대(±2)면 합치기
    const mate = arr.find((g) => isCloseLine(f.lineStart, g.lineStart, 2));
    if (!mate) {
      arr.push({
        ...f,
        tools: f.tools || (f.tool ? [f.tool] : []),
        ruleIds: f.ruleIds || (f.ruleId ? [f.ruleId] : []),
        tool: undefined,
      });
      continue;
    }
    // merge mate <- f
    mate.severity =
      rank[f.severity] > rank[mate.severity] ? f.severity : mate.severity;
    mate.cvss = Math.max(num(mate.cvss) ?? 0, num(f.cvss) ?? 0);
    mate.tools = uniq([
      ...(mate.tools || []),
      ...(f.tools || (f.tool ? [f.tool] : [])),
    ]);
    mate.ruleIds = uniq([
      ...(mate.ruleIds || []),
      ...(f.ruleIds || (f.ruleId ? [f.ruleId] : [])),
    ]);
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

  const attachedIds = new Set();

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
        test: d.ruleId || d.title,
        message: d.extra?.message || "",
        traceback: d.extra?.traceback || [],
      });
      attachedIds.add(d.id);
      best.severity = bumpSeverity(best.severity); // 런타임 재현 시 한 단계 상향
    }
  }

  const dynamicOrphans = dynItems.filter((d) => !attachedIds.has(d.id));
  return { attachedStatic: staticItems, dynamicOrphans };
}

/* ---------- 유틸 ---------- */

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
  const v = String(s || "").toLowerCase();
  if (["critical", "cri"].includes(v)) return "Critical";
  if (["high", "hi"].includes(v)) return "High";
  if (["medium", "med", "mid"].includes(v)) return "Medium";
  if (["warning", "warn"].includes(v)) return "Medium"; // Semgrep WARNING은 Medium으로
  if (["info", "informational"].includes(v)) return "Low";
  if (["low", "lo"].includes(v)) return "Low";
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

const normPath = (p) => String(p || "").replace(/\\/g, "/");
const baseOf = (s) => (s || "").toString().slice(0, 48);
const first = (arr) => (Array.isArray(arr) && arr.length ? arr[0] : "");
const last = (arr) =>
  Array.isArray(arr) && arr.length ? arr[arr.length - 1] : "";

const num = (v) => (v == null ? null : Number(v));
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
const uniq = (arr) => Array.from(new Set((arr || []).filter(Boolean)));
const joinUnique = (parts) =>
  uniq(
    (parts || [])
      .flatMap((p) => String(p || "").split(/\n+/))
      .map((s) => s.trim())
      .filter(Boolean)
  ).join("\n");

function emptyResult() {
  return {
    runId: "unknown",
    counts: { total: 0, bySeverity: {}, byType: {} },
    findings: [],
  };
}
