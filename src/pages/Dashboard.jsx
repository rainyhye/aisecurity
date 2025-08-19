// npm i recharts
import { useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

// 샘플 데이터 (API 붙기 전까지 임시)
const SAMPLE = {
  runId: "sample-001",
  counts: {
    total: 17,
    bySeverity: { Critical: 2, High: 5, Medium: 6, Low: 4 },
    byType: {
      "SQL Injection": 4,
      XSS: 3,
      SSRF: 2,
      "Hardcoded Secret": 5,
      "Insecure Deserialization": 3,
    },
  },
  findings: [
    {
      id: "F-001",
      title: "SQL Injection via concatenated query",
      severity: "High",
      type: "SQL Injection",
      file: "src/api/user.js",
      lineStart: 42,
      lineEnd: 58,
      cwe: "CWE-89",
      cvss: 8.0,
      recommendation: "Use parameterized queries / prepared statements.",
      tool: "semgrep",
    },
    {
      id: "F-002",
      title: "Hardcoded API key detected",
      severity: "Critical",
      type: "Hardcoded Secret",
      file: "src/config.js",
      lineStart: 10,
      lineEnd: 10,
      cwe: "CWE-798",
      cvss: 9.1,
      recommendation: "Load from secret manager or env var.",
      tool: "trufflehog",
    },
    {
      id: "F-003",
      title: "Reflected XSS in error message",
      severity: "High",
      type: "XSS",
      file: "src/components/Error.jsx",
      lineStart: 25,
      lineEnd: 33,
      cwe: "CWE-79",
      cvss: 7.5,
      recommendation: "Escape output; use safe DOM APIs.",
      tool: "zap",
    },
    {
      id: "F-004",
      title: "SSRF via open URL",
      severity: "Medium",
      type: "SSRF",
      file: "src/lib/fetch.js",
      lineStart: 61,
      lineEnd: 80,
      cwe: "CWE-918",
      cvss: 6.5,
      recommendation: "Allowlist and metadata IP block.",
      tool: "custom-dyn",
    },
    {
      id: "F-005",
      title: "Insecure deserialization of user cookie",
      severity: "High",
      type: "Insecure Deserialization",
      file: "src/auth/session.js",
      lineStart: 12,
      lineEnd: 40,
      cwe: "CWE-502",
      cvss: 8.1,
      recommendation: "Use signed/validated tokens.",
      tool: "semgrep",
    },
    {
      id: "F-006",
      title: "Hardcoded secret in test",
      severity: "Medium",
      type: "Hardcoded Secret",
      file: "tests/helpers.js",
      lineStart: 3,
      lineEnd: 3,
      cwe: "CWE-798",
      cvss: 5.0,
      recommendation: "Use env and CI secret mask.",
      tool: "trufflehog",
    },
  ],
};

const SEVERITY_ORDER = { Critical: 4, High: 3, Medium: 2, Low: 1 };

// 간단 가이드 맵(데모용): 유형별 핵심 수정 가이드
const FIX_TIPS = {
  "SQL Injection":
    "문자열 연결 대신 Prepared Statement/파라미터 바인딩 사용. ORM의 쿼리 바인딩 기능 활용.",
  XSS: "출력 인코딩/escape 적용, 위험한 innerHTML 지양, React에서는 JSX에 사용자 입력 직접 삽입 금지.",
  SSRF: "아웃바운드 요청 대상 allowlist, 메타데이터 IP(169.254.169.254) 차단, DNS rebinding 방어.",
  "Hardcoded Secret":
    "비밀값은 코드에 저장하지 말고 Secret Manager/환경변수 사용. 저장소 스캔/회전 자동화.",
  "Insecure Deserialization":
    "신뢰할 수 없는 데이터 역직렬화 금지. 서명/무결성 검증 사용, 안전한 포맷(JSON/JWT) 채택.",
};

export default function Dashboard() {
  const [fileName, setFileName] = useState("선택된 파일 없음");
  const [fileObj, setFileObj] = useState(null);
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null); // 탐지 결과
  const [pieMode, setPieMode] = useState("severity"); // 'severity' | 'type'
  const [guides, setGuides] = useState(null); // 가이드라인 응답
  const [isGuiding, setIsGuiding] = useState(false);

  const totalFindings = result?.counts?.total ?? 0;

  const pieData = useMemo(() => {
    if (!result) return [];
    const src =
      pieMode === "severity" ? result.counts.bySeverity : result.counts.byType;
    return Object.entries(src).map(([name, value]) => ({ name, value }));
  }, [result, pieMode]);

  const COLORS = [
    "#EF4444",
    "#F59E0B",
    "#10B981",
    "#3B82F6",
    "#8B5CF6",
    "#14B8A6",
  ];

  const highSeverity = useMemo(() => {
    if (!result) return [];
    return [...result.findings]
      .sort(
        (a, b) =>
          SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity] ||
          b.cvss - a.cvss
      )
      .filter((f) => ["Critical", "High"].includes(f.severity))
      .slice(0, 4);
  }, [result]);

  function handleFile(e) {
    const f = e.target.files?.[0];
    setFileObj(f || null);
    setFileName(f?.name || "선택된 파일 없음");
  }

  async function handleAnalyze() {
    // TODO: 실제 API 붙이면 FormData 전송
    // const form = new FormData();
    // if (fileObj) form.append("file", fileObj);
    // if (code.trim()) form.append("code", new Blob([code], { type: "text/plain" }), "paste.txt");
    // const res = await fetch("/api/detect-vulns", { method: "POST", body: form });
    // const json = await res.json();
    // setResult(json);

    // 데모용
    setResult(SAMPLE);
    localStorage.setItem("forti:last-run", JSON.stringify(SAMPLE));
    setGuides(null); // 새 분석 시 가이드 초기화
  }

  function loadSample() {
    setResult(SAMPLE);
    localStorage.setItem("forti:last-run", JSON.stringify(SAMPLE));
    setGuides(null);
  }

  function openFindingsNewTab() {
    window.open("/app/findings", "_blank");
  }

  async function handleDownload(format) {
    if (!result) return;
    const runId = result.runId || "sample-001";

    // 현재는 pdf 미구현 → json/csv만 정상 동작
    const blob = new Blob(
      [
        format === "csv"
          ? jsonToCsv(result.findings)
          : JSON.stringify(result, null, 2),
      ],
      { type: format === "csv" ? "text/csv" : "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `forti-${runId}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ----- Secure Coding Guide -----

  async function handleGenerateGuides() {
    if (!result) return;
    setIsGuiding(true);
    try {
      const selection = [...result.findings]
        .sort(
          (a, b) =>
            SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity] ||
            b.cvss - a.cvss
        )
        .slice(0, 4)
        .map((f) => f.id);

      // 실제 API 붙일 때:
      // const res = await fetch("/api/guidelines", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ runId: result.runId, selection }),
      // });
      // const json = await res.json();
      // setGuides(json); // { runId, pdfUrl, guidelines: [...] }

      // 데모 가이드 생성
      const demo = buildSampleGuides(result, selection);
      setGuides(demo);
    } finally {
      setIsGuiding(false);
    }
  }

  function openGuidePdf() {
    if (guides?.pdfUrl) {
      window.open(guides.pdfUrl, "_blank");
    }
  }

  function downloadGuides(format) {
    if (!guides) return;
    const runId = guides.runId || result?.runId || "run";
    if (format === "json") {
      const blob = new Blob([JSON.stringify(guides, null, 2)], {
        type: "application/json",
      });
      downloadBlob(blob, `forti-guides-${runId}.json`);
      return;
    }
    if (format === "md") {
      const md = toMarkdown(guides, result);
      const blob = new Blob([md], { type: "text/markdown" });
      downloadBlob(blob, `forti-guides-${runId}.md`);
      return;
    }
    if (format === "pdf") {
      // 백엔드에서 pdfUrl 내려주면 그 링크로 이동
      if (guides.pdfUrl) openGuidePdf();
    }
  }

  // ----- UI -----
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Dashboard</h2>
      <p className="text-zinc-600 dark:text-zinc-300">
        코드 파일 업로드/코드 입력 → 백엔드 취약점 분석 API & RAG 가이드라인 API
        호출 흐름을 붙이기
      </p>

      {/* 메인 그리드: 좌 2, 우 1 */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Left 2 cols */}
        <div className="md:col-span-2 space-y-6">
          {/* 파일 업로드 */}
          <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-4">
            <h3 className="font-semibold mb-2 text-zinc-900 dark:text-white">
              파일 업로드
            </h3>
            <input
              type="file"
              className="block w-full text-sm text-zinc-700 dark:text-zinc-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-zinc-100 dark:file:bg-zinc-800 file:text-zinc-900 dark:file:text-zinc-200"
              onChange={handleFile}
            />
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {fileName}
            </p>
          </div>

          {/* 코드 입력 */}
          <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-zinc-900 dark:text-white">
                코드 입력
              </h3>
              <div className="text-xs text-zinc-500">
                선택: 파일 또는 텍스트
              </div>
            </div>
            <textarea
              rows={14}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full rounded-xl p-3 outline-none bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
              placeholder="코드를 붙여넣으세요..."
            />
            <div className="mt-3 flex gap-3">
              <button
                onClick={handleAnalyze}
                className="px-5 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black"
              >
                분석 실행
              </button>
              <button
                onClick={loadSample}
                className="px-5 py-2 rounded-xl border border-zinc-300 dark:border-white/30"
              >
                샘플 데이터로 보기
              </button>
            </div>
          </div>
        </div>

        {/* Right 1 col */}
        <div className="space-y-6">
          {/* 요약 + 차트 */}
          <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-zinc-900 dark:text-white">
                탐지된 취약점 수
              </h3>
              <span className="text-sm text-zinc-500">
                {pieMode === "severity" ? "중요도 기준" : "종류 기준"}
              </span>
            </div>
            <div className="text-2xl font-extrabold mb-3">
              {totalFindings} 개
            </div>

            <div className="mb-3 flex gap-2">
              <button
                onClick={() => setPieMode("severity")}
                className={`px-3 py-1 rounded-lg text-sm border ${
                  pieMode === "severity" ? "bg-zinc-100 dark:bg-zinc-800" : ""
                }`}
              >
                중요도
              </button>
              <button
                onClick={() => setPieMode("type")}
                className={`px-3 py-1 rounded-lg text-sm border ${
                  pieMode === "type" ? "bg-zinc-100 dark:bg-zinc-800" : ""
                }`}
              >
                종류
              </button>
            </div>

            <div className="h-56">
              {pieData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={90}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-sm text-zinc-500">
                  분석 실행 후 차트가 표시됩니다.
                </div>
              )}
            </div>
          </div>

          {/* 중요도 높은 항목 */}
          <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-zinc-900 dark:text-white">
                중요도 높은 항목
              </h3>
              <button
                onClick={openFindingsNewTab}
                className="text-sm px-3 py-1 rounded-lg border"
              >
                더보기
              </button>
            </div>
            <ul className="space-y-3">
              {(highSeverity.length ? highSeverity : []).map((f) => (
                <li
                  key={f.id}
                  className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{f.title}</div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border ${badgeColor(
                        f.severity
                      )}`}
                    >
                      {f.severity}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    {f.type} • {f.file}:{f.lineStart}-{f.lineEnd}
                  </div>
                </li>
              ))}
              {!result && (
                <li className="text-sm text-zinc-500">
                  분석 실행 후 상위 항목이 표시됩니다.
                </li>
              )}
            </ul>
          </div>

          {/* 다운로드(결과 원본) */}
          <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-4">
            <h3 className="font-semibold mb-3 text-zinc-900 dark:text-white">
              다운로드
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => handleDownload("json")}
                disabled={!result}
                className="px-4 py-2 rounded-xl border disabled:opacity-50"
              >
                JSON
              </button>
              <button
                onClick={() => handleDownload("csv")}
                disabled={!result}
                className="px-4 py-2 rounded-xl border disabled:opacity-50"
              >
                CSV
              </button>
              <button
                onClick={() => handleDownload("pdf")}
                disabled={!result}
                className="px-4 py-2 rounded-xl border disabled:opacity-50"
              >
                PDF
              </button>
            </div>
            {!result && (
              <p className="text-xs text-zinc-500 mt-2">
                분석 후 활성화됩니다.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ----- Secure Coding Guide 섹션 (전체 폭) ----- */}
      <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <h3 className="font-semibold text-zinc-900 dark:text-white">
            Secure Coding Guide
          </h3>
          <div className="flex gap-2">
            <button
              onClick={handleGenerateGuides}
              disabled={!result || isGuiding}
              className="px-4 py-2 rounded-xl border disabled:opacity-50"
            >
              {isGuiding ? "생성 중..." : guides ? "다시 생성" : "가이드 생성"}
            </button>
            <button
              onClick={() => downloadGuides("md")}
              disabled={!guides}
              className="px-3 py-2 rounded-xl border disabled:opacity-50"
            >
              MD
            </button>
            <button
              onClick={() => downloadGuides("json")}
              disabled={!guides}
              className="px-3 py-2 rounded-xl border disabled:opacity-50"
            >
              JSON
            </button>
            <button
              onClick={() => downloadGuides("pdf")}
              disabled={!guides || !guides.pdfUrl}
              className="px-3 py-2 rounded-xl border disabled:opacity-50"
              title={guides?.pdfUrl ? "" : "PDF는 API 연결 시 활성화"}
            >
              PDF
            </button>
          </div>
        </div>

        {/* 요약 리스트 */}
        {guides?.guidelines?.length ? (
          <ul className="space-y-3">
            {guides.guidelines.slice(0, 4).map((g) => {
              const f = result?.findings?.find((x) => x.id === g.findingId);
              return (
                <li
                  key={g.findingId}
                  className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium">
                      {f?.title || g.title || g.findingId}
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border ${badgeColor(
                        f?.severity || "Low"
                      )}`}
                    >
                      {f?.severity || "—"}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    {f?.type} • {f?.cwe}
                  </div>
                  <p className="text-sm mt-2">
                    {shorten(g.howToFix || "", 160)}
                  </p>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">
            분석을 실행하고 “가이드 생성”을 눌러 요약 가이드를 받아보세요.
          </p>
        )}

        {/* 더보기 → PDF 링크 */}
        <div className="mt-3 flex justify-end">
          <button
            onClick={openGuidePdf}
            disabled={!guides || !guides.pdfUrl}
            className="text-sm px-3 py-1 rounded-lg border disabled:opacity-50"
            title={guides?.pdfUrl ? "" : "PDF는 API 연결 시 활성화"}
          >
            더보기
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- helpers ----
function badgeColor(severity) {
  switch (severity) {
    case "Critical":
      return "border-red-500 text-red-600";
    case "High":
      return "border-orange-500 text-orange-600";
    case "Medium":
      return "border-yellow-500 text-yellow-600";
    default:
      return "border-zinc-400 text-zinc-600";
  }
}

function jsonToCsv(rows) {
  if (!rows?.length) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`; // replaceAll → replace
  const body = rows
    .map((r) => headers.map((h) => esc(r[h])).join(","))
    .join("\n");
  return [headers.join(","), body].join("\n");
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function shorten(s, n) {
  if (!s) return "";
  return s.length > n ? s.slice(0, n) + "…" : s;
}

function buildSampleGuides(result, selection) {
  const items = result.findings.filter((f) => selection.includes(f.id));
  return {
    runId: result.runId,
    pdfUrl: null, // ← 실제 API에서 내려주면 채워짐
    guidelines: items.map((f) => ({
      findingId: f.id,
      title: f.title,
      cwe: f.cwe,
      howToFix: FIX_TIPS[f.type] || "문제 패턴을 제거하고 안전한 대안 적용.",
      codeExample:
        f.type === "SQL Injection"
          ? `// ❌ 나쁜 예
const q = "SELECT * FROM users WHERE name = '" + user + "'";
db.query(q);

// ✅ 좋은 예
db.query("SELECT * FROM users WHERE name = ?", [user]);`
          : f.type === "XSS"
          ? `// React JSX에서 사용자 입력 직접 렌더링 금지
// <div dangerouslySetInnerHTML={{ __html: userHtml }} />  ❌
// 출력 인코딩을 적용하거나 안전한 컴포넌트 사용 ✅`
          : "",
      references: [
        "https://owasp.org/www-project-top-ten/",
        "https://cheatsheetseries.owasp.org/",
      ],
    })),
  };
}

function toMarkdown(guides, result) {
  const lines = [];
  lines.push(`# Secure Coding Guide`);
  if (result?.runId || guides?.runId) {
    lines.push(`- Run ID: ${result?.runId || guides?.runId}`);
  }
  lines.push("");
  (guides.guidelines || []).forEach((g, idx) => {
    const f = result?.findings?.find((x) => x.id === g.findingId);
    lines.push(`## ${idx + 1}. ${f?.title || g.title || g.findingId}`);
    lines.push(
      `- Severity: ${f?.severity || "—"}  |  Type: ${f?.type || "—"}  |  CWE: ${
        g.cwe || "—"
      }`
    );
    lines.push("");
    lines.push(`**How to fix**`);
    lines.push("");
    lines.push(g.howToFix || "");
    lines.push("");
    if (g.codeExample) {
      lines.push("```");
      lines.push(g.codeExample);
      lines.push("```");
      lines.push("");
    }
    if (g.references?.length) {
      lines.push("**References**");
      g.references.forEach((r) => lines.push(`- ${r}`));
      lines.push("");
    }
  });
  return lines.join("\n");
}
