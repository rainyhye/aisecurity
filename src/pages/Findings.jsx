import { useEffect, useMemo, useState } from "react";

const ORDER = { Critical: 4, High: 3, Medium: 2, Low: 1 };

export default function Findings() {
  const [data, setData] = useState(null);
  const [q, setQ] = useState("");
  const [sev, setSev] = useState("all");

  useEffect(() => {
    // 대시보드에서 저장한 최근 실행 결과 불러오기
    const last = localStorage.getItem("forti:last-run");
    if (last) setData(JSON.parse(last));
  }, []);

  const rows = useMemo(() => {
    if (!data?.findings) return [];
    return data.findings
      .filter((f) => (sev === "all" ? true : f.severity === sev))
      .filter(
        (f) =>
          !q ||
          (f.title + f.type + f.file).toLowerCase().includes(q.toLowerCase())
      )
      .sort((a, b) => ORDER[b.severity] - ORDER[a.severity] || b.cvss - a.cvss);
  }, [data, q, sev]);

  function handleDownloadAll() {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `forti-${data.runId || "run"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">탐지된 취약점 전체 보기</h2>

      <div className="flex flex-wrap gap-2 items-center mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="px-3 py-2 rounded-xl border bg-white dark:bg-zinc-900"
          placeholder="검색 (제목/유형/파일)"
        />
        <select
          value={sev}
          onChange={(e) => setSev(e.target.value)}
          className="px-3 py-2 rounded-xl border bg-white dark:bg-zinc-900"
        >
          <option value="all">전체 중요도</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <button
          onClick={handleDownloadAll}
          className="px-4 py-2 rounded-xl border"
        >
          JSON 다운로드
        </button>
      </div>
      <div className="rounded-2xl border border-zinc-200 dark:border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900/60">
            <tr>
              <th className="text-left p-3">중요도</th>
              <th className="text-left p-3">제목</th>
              <th className="text-left p-3">유형</th>
              <th className="text-left p-3">파일</th>
              <th className="text-left p-3">CWE</th>
              <th className="text-left p-3">CVSS</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((f) => (
              <tr
                key={f.id}
                className="border-t border-zinc-200 dark:border-white/10"
              >
                <td className="p-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border ${badgeColor(
                      f.severity
                    )}`}
                  >
                    {f.severity}
                  </span>
                </td>
                <td className="p-3">{f.title}</td>
                <td className="p-3">{f.type}</td>
                <td className="p-3">
                  {f.file}:{f.lineStart}-{f.lineEnd}
                </td>
                <td className="p-3">{f.cwe}</td>
                <td className="p-3">{f.cvss}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td className="p-6 text-center text-zinc-500" colSpan={6}>
                  데이터가 없습니다. 대시보드에서 분석을 실행해주세요.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
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
