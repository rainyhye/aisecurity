// Dashboard.jsx
// npm i recharts
// npm i @monaco-editor/react

import { useMemo, useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import {
  PieChart,
  Pie,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  parseUnifiedFromUrl,
  parseUnifiedFromFile,
} from "../lib/unifiedParser";

// -------------------- 샘플 데이터 --------------------
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

// 간단 가이드 맵(데모용)
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

// -------------------- 컴포넌트 --------------------
export default function Dashboard() {
  // 런 히스토리
  const [runs, setRuns] = useState(() =>
    JSON.parse(localStorage.getItem("forti:runs") || "[]")
  );
  const [selectedRunId, setSelectedRunId] = useState("");

  // 입력/결과/패치 상태
  const [fileName, setFileName] = useState("선택된 파일 없음");
  const [fileObj, setFileObj] = useState(null);
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [pieMode, setPieMode] = useState("severity"); // 'severity' | 'type'
  const [guides, setGuides] = useState(null);
  const [isGuiding, setIsGuiding] = useState(false);

  const [patched, setPatched] = useState("");
  const [isPatching, setIsPatching] = useState(false);

  // 다크모드 감지 → Monaco 테마 연동
  const [isDark, setIsDark] = useState(getIsDark());
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    const onMQ = () => setIsDark(getIsDark());
    mq?.addEventListener?.("change", onMQ);
    const obs = new MutationObserver(() => setIsDark(getIsDark()));
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => {
      mq?.removeEventListener?.("change", onMQ);
      obs.disconnect();
    };
  }, []);

  const totalFindings = result?.counts?.total ?? 0;

  // 차트 데이터 (파이)
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

  // 상단 요약
  const avgCvss = useMemo(() => {
    if (!result?.findings?.length) return 0;
    const s = result.findings.reduce((acc, f) => acc + (f.cvss || 0), 0);
    return (s / result.findings.length).toFixed(1);
  }, [result]);

  const toolCount = useMemo(() => {
    if (!result?.findings?.length) return 0;
    const set = new Set();
    for (const f of result.findings) {
      const arr = f.tools?.length ? f.tools : f.tool ? [f.tool] : [];
      arr.forEach((t) => set.add(t));
    }
    return set.size;
  }, [result]);

  // 유형 × 중요도 스택 막대
  const typeBySev = useMemo(() => {
    if (!result?.findings) return [];
    const map = {};
    result.findings.forEach((f) => {
      const key = f.cwe || f.ruleIds?.[0] || f.type; // CWE > Rule > STATIC/DYNAMIC
      if (!map[key])
        map[key] = { type: key, Critical: 0, High: 0, Medium: 0, Low: 0 };
      map[key][f.severity] = (map[key][f.severity] || 0) + 1;
    });
    return Object.values(map).sort(
      (a, b) => b.Critical + b.High - (a.Critical + a.High)
    );
  }, [result]);

  // 중요도 높은 항목 리스트
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
  const AXIS = isDark ? "#e5e7eb" : "#374151";
  const GRID = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)";
  const TIP_BG = isDark ? "#0b1220" : "#ffffff";
  const TIP_TX = isDark ? "#e5e7eb" : "#111827";

  // 초기 로드시 마지막 실행 복원
  useEffect(() => {
    const last = localStorage.getItem("forti:last-run");
    if (last && !result) {
      try {
        setResult(JSON.parse(last));
      } catch {}
    }
  }, []); // eslint-disable-line

  // -------------------- 이벤트 핸들러 --------------------
  function handleFile(e) {
    const f = e.target.files?.[0];
    setFileObj(f || null);
    setFileName(f?.name || "선택된 파일 없음");
  }

  function onDrop(e) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    setFileObj(f);
    setFileName(f.name);
  }
  //fetch -> res.json() -> normalizeUnified(...) 부분 교체
  async function handleAnalyze() {
    setIsAnalyzing(true);
    try {
      const url = import.meta.env.VITE_UNIFIED_URL || "/api/unified";
      const normalized = await parseUnifiedFromUrl(url);

      setResult(normalized);
      localStorage.setItem("forti:last-run", JSON.stringify(normalized));
      setGuides(null);
      setPatched("");
      saveRun(normalized);
    } catch (e) {
      console.error(e);
      alert("분석 결과(JSON) 불러오기에 실패했어요. 콘솔을 확인해 주세요.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  function saveRun(run) {
    const entry = {
      id: run.runId || `run-${Date.now()}`,
      at: Date.now(),
      counts: run.counts,
    };
    const arr = [
      entry,
      ...JSON.parse(localStorage.getItem("forti:runs") || "[]"),
    ].slice(0, 20);
    localStorage.setItem("forti:runs", JSON.stringify(arr));
    localStorage.setItem(`forti:run:${entry.id}`, JSON.stringify(run));
    setRuns(arr);
  }

  function loadSample() {
    setResult(SAMPLE);
    localStorage.setItem("forti:last-run", JSON.stringify(SAMPLE));
    setGuides(null);
    setPatched("");
    saveRun(SAMPLE);
  }

  function openFindingsNewTab() {
    window.open("/app/findings", "_blank");
  }

  async function handleDownload(format) {
    if (!result) return;
    const runId = result.runId || "sample-001";
    const blob = new Blob(
      [
        format === "csv"
          ? jsonToCsv(result.findings)
          : JSON.stringify(result, null, 2),
      ],
      { type: format === "csv" ? "text/csv" : "application/json" }
    );
    downloadBlob(blob, `forti-${runId}.${format}`);
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

      // TODO: 실제 가이드라인 API 호출
      // const res = await fetch("/api/guidelines", { ... });
      // const json = await res.json();
      // setGuides(json);

      const demo = buildSampleGuides(result, selection);
      setGuides(demo);
    } finally {
      setIsGuiding(false);
    }
  }

  function openGuidePdf() {
    if (guides?.pdfUrl) window.open(guides.pdfUrl, "_blank");
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
    if (format === "pdf" && guides.pdfUrl) openGuidePdf();
  }

  // ----- Patched Code (휴리스틱) -----
  async function handleGeneratePatched() {
    if (!result) return;
    setIsPatching(true);
    try {
      const src = await ensureSourceText(code, fileObj);
      const patchedText = generatePatchedCode(src, result);
      setPatched(patchedText);
    } finally {
      setIsPatching(false);
    }
  }

  async function handleGeneratePatched() {
    if (!result) return;
    setIsPatching(true);
    try {
      const src = await ensureSourceText(code, fileObj);
      if (!src.trim()) {
        setPatched(
          "// 원본 코드가 없습니다. 파일 업로드 또는 코드 입력 후 다시 시도하세요."
        );
        return;
      }
      const patchedText = generatePatchedCode(src, result);
      setPatched(patchedText || "// 변경할 부분을 찾지 못했습니다. (데모)");
    } finally {
      setIsPatching(false);
    }
  }

  function downloadPatched() {
    if (!patched) return;
    const ext = (fileName.split(".").pop() || "txt").toLowerCase();
    const base =
      fileName && fileName !== "선택된 파일 없음"
        ? fileName.replace(/\.[^.]+$/, "")
        : "code";
    const blob = new Blob([patched], { type: "text/plain" });
    downloadBlob(blob, `${base}.patched.${ext}`);
  }

  // -------------------- UI --------------------
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold">Dashboard</h2>
          <p className="text-zinc-600 dark:text-zinc-300">
            코드 파일 업로드/코드 입력 → 취약점 분석 API & RAG 가이드라인 API
            연결 흐름
          </p>
        </div>

        {/* 런 히스토리: 불러오기 */}
        <div className="flex items-center gap-2">
          <select
            value={selectedRunId}
            onChange={(e) => setSelectedRunId(e.target.value)}
            className="px-3 py-2 rounded-xl border bg-white dark:bg-zinc-900"
          >
            <option value="">최근 실행 불러오기…</option>
            {runs.map((r) => (
              <option key={r.id} value={r.id}>
                {new Date(r.at).toLocaleString()} • T{r.counts?.total ?? 0} / C
                {r.counts?.bySeverity?.Critical ?? 0}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              if (!selectedRunId) return;
              const loaded = JSON.parse(
                localStorage.getItem(`forti:run:${selectedRunId}`) || "null"
              );
              if (loaded) {
                setResult(loaded);
                setGuides(null);
                setPatched("");
              }
            }}
            className="px-3 py-2 rounded-xl border"
          >
            불러오기
          </button>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="총 취약점" value={totalFindings || "—"} />
        <StatCard
          label="Critical"
          value={result?.counts?.bySeverity?.Critical ?? "—"}
        />
        <StatCard label="평균 CVSS" value={result ? avgCvss : "—"} />
        <StatCard label="사용 도구 수" value={result ? toolCount : "—"} />
      </div>

      {/* 메인 그리드: 좌 2, 우 1 */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Left 2 cols */}
        <div className="md:col-span-2 space-y-6">
          {/* 파일 업로드 */}
          <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-4">
            <h3 className="font-semibold mb-2 text-zinc-900 dark:text-white">
              파일 업로드
            </h3>

            {/* 드랍존 */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              className="mb-3 grid place-items-center rounded-xl border border-dashed p-6 text-sm text-zinc-600 dark:text-zinc-300"
            >
              여기로 파일을 드래그&드랍 해도 돼요
            </div>

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

            {/* Monaco Editor (다크 테마 연동) */}
            <Editor
              height="320px"
              theme={isDark ? "vs-dark" : "light"}
              defaultLanguage={guessLanguage(fileName)}
              value={code}
              onChange={(v) => setCode(v ?? "")}
              className="rounded-lg ring-1 ring-zinc-200 focus:ring-2 focus:ring-emerald-400 dark:ring-white/10"
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                wordWrap: "on",
                scrollBeyondLastLine: false,
                // 👇 패딩 & 좌측 여유
                padding: { top: 12, bottom: 16 },
                lineNumbersMinChars: 4,
                glyphMargin: true,
                lineDecorationsWidth: 8,
              }}
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

          {/* 패치 제안 카드 */}
          <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-zinc-900 dark:text-white">
                패치 제안 (정적+동적 결과 + RAG)
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={handleGeneratePatched}
                  disabled={!result || isPatching || (!code.trim() && !fileObj)}
                  title={
                    !result
                      ? "먼저 분석을 실행하세요"
                      : !code.trim() && !fileObj
                      ? "코드를 붙여넣거나 파일을 업로드하세요"
                      : ""
                  }
                  className="px-4 py-2 rounded-xl border disabled:opacity-50"
                >
                  {isPatching ? "생성 중..." : "패치 제안 생성"}
                </button>
                <button
                  onClick={downloadPatched}
                  disabled={!patched}
                  className="px-4 py-2 rounded-xl border disabled:opacity-50"
                >
                  파일로 저장
                </button>
              </div>
            </div>

            {patched ? (
              <Editor
                height="320px"
                theme={isDark ? "vs-dark" : "light"}
                defaultLanguage={guessLanguage(fileName)}
                value={patched}
                className="rounded-lg ring-1 ring-zinc-200 dark:ring-white/10"
                options={{
                  readOnly: true,
                  fontSize: 14,
                  minimap: { enabled: false },
                  wordWrap: "on",
                  padding: { top: 12, bottom: 16 }, // 👈 동일 적용
                  lineNumbersMinChars: 4,
                  glyphMargin: true,
                  lineDecorationsWidth: 8,
                }}
              />
            ) : (
              <p className="text-sm text-zinc-500">
                분석 실행 후, 붙여넣은 코드(또는 업로드한 파일)를 기준으로 패치
                제안을 생성합니다.
              </p>
            )}
          </div>
        </div>

        {/* Right 1 col */}
        <div className="space-y-6">
          {/* 요약 + 파이 차트 */}
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
                    <Tooltip
                      contentStyle={{
                        background: TIP_BG,
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: TIP_TX,
                      }}
                      itemStyle={{ color: TIP_TX }}
                      labelStyle={{ color: TIP_TX }}
                    />
                    <Legend wrapperStyle={{ color: AXIS }} />
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

          {/* 다운로드 */}
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
                title="PDF는 API 연결 시 활성화"
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

          {/* 유형 × 중요도 (오른쪽 열, 다운로드 아래) */}
          <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-4">
            <h3 className="font-semibold mb-2 text-zinc-900 dark:text-white">
              유형 × 중요도
            </h3>
            <div className="h-64">
              {typeBySev.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={typeBySev} margin={{ left: 8, right: 8 }}>
                    <CartesianGrid stroke={GRID} />
                    <XAxis
                      dataKey="type"
                      tick={{ fill: AXIS, fontSize: 12 }}
                      stroke={AXIS}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: AXIS }}
                      stroke={AXIS}
                    />
                    <Tooltip
                      contentStyle={{
                        background: TIP_BG,
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: TIP_TX,
                      }}
                      itemStyle={{ color: TIP_TX }}
                      labelStyle={{ color: TIP_TX }}
                    />
                    <Legend wrapperStyle={{ color: AXIS }} />
                    {/* 눈에 잘 띄는 고정 팔레트 */}
                    <Bar dataKey="Critical" stackId="a" fill="#ef4444" />
                    <Bar dataKey="High" stackId="a" fill="#f59e0b" />
                    <Bar dataKey="Medium" stackId="a" fill="#eab308" />
                    <Bar dataKey="Low" stackId="a" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-sm text-zinc-500">
                  분석 실행 후 막대 차트가 표시됩니다.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Secure Coding Guide (전체 폭) */}
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

// -------------------- 보조 컴포넌트 & 헬퍼 --------------------
function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-4">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}

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
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
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
    pdfUrl: null,
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
  if (result?.runId || guides?.runId)
    lines.push(`- Run ID: ${result?.runId || guides?.runId}`);
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

function guessLanguage(filename) {
  const ext = (filename.split(".").pop() || "").toLowerCase();
  if (!ext) return "javascript";
  const map = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    json: "json",
    py: "python",
    java: "java",
    rb: "ruby",
    go: "go",
    rs: "rust",
    php: "php",
    cs: "csharp",
    cpp: "cpp",
    c: "c",
    css: "css",
    scss: "scss",
    html: "html",
    md: "markdown",
    yml: "yaml",
    yaml: "yaml",
  };
  return map[ext] || "javascript";
}

// 다크모드 여부
function getIsDark() {
  try {
    return (
      document.documentElement.classList.contains("dark") ||
      window.matchMedia?.("(prefers-color-scheme: dark)")?.matches
    );
  } catch {
    return false;
  }
}

// 업로드 파일 텍스트 읽기 or 입력 코드 반환
function ensureSourceText(code, file) {
  if (code?.trim()) return Promise.resolve(code);
  if (file) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result || ""));
      fr.onerror = reject;
      fr.readAsText(file);
    });
  }
  return Promise.resolve("");
}

// 데모용
function generatePatchedCode(src, result) {
  if (!src) return "";

  const header = [
    "/*",
    " * Forti Patched Suggestion (데모)",
    " * - 정적/동적 탐지 + 가이드 요약을 반영한 휴리스틱 수정 예시",
    " * - 실제 프로젝트에 적용 전 반드시 테스트",
    " */",
    "",
  ].join("\n");

  const lines = src.split("\n");
  const out = [];

  for (let i = 0; i < lines.length; i++) {
    let ln = lines[i];
    let replaced = false;

    // Hardcoded Secret (간단 패턴)
    let m = ln.match(
      /(const|let|var)\s+([A-Za-z_]\w*(?:key|secret)\w*)\s*=\s*(['"`][^'"`]{6,}['"`])\s*;?/i
    );
    if (m) {
      out.push("// ❌ " + ln);
      out.push(
        `${m[1]} ${
          m[2]
        } = process.env.${m[2].toUpperCase()} ?? ""; // Secret Manager/환경변수로 이동`
      );
      replaced = true;
    }

    // XSS: dangerouslySetInnerHTML -> escape/안전렌더
    if (!replaced && /dangerouslySetInnerHTML/.test(ln)) {
      out.push("// ❌ " + ln);
      out.push(
        ln.replace(
          /dangerouslySetInnerHTML\s*=\s*{{\s*__html:\s*([^}]+)\s*}}/,
          "children={escapeHtml($1)} // 출력 인코딩 적용"
        )
      );
      replaced = true;
    }

    // SQL Injection: 문자열 연결 쿼리 → 파라미터 바인딩(예시)
    if (
      !replaced &&
      /db\.query\(/.test(ln) &&
      /\+/.test(ln) &&
      /SELECT/i.test(ln)
    ) {
      out.push("// ❌ " + ln);
      out.push(
        'db.query("SELECT * FROM users WHERE name = ?", [user]); // Prepared Statement'
      );
      replaced = true;
    }

    if (!replaced) out.push(ln);
  }

  const footer = [
    "",
    "// 참고:",
    "// - escapeHtml은 서버/클라이언트 환경에 맞는 검증된 라이브러리를 사용하세요(e.g., DOMPurify).",
    "// - 네트워크 요청은 SSRF 방지를 위해 allowlist/내부 IP 차단을 적용하세요.",
  ].join("\n");

  return header + out.join("\n") + footer;
}
