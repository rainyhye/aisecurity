import { useState } from "react";

export default function Dashboard() {
  const [fileName, setFileName] = useState("선택된 파일 없음");

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Dashboard</h2>

      {/* 설명 텍스트: 라이트/다크 각각 색 지정 */}
      <p className="text-zinc-600 dark:text-zinc-300">
        코드 파일 업로드/코드 입력 → 백엔드 취약점 분석 API &amp; RAG 가이드라인
        API 호출 흐름을 붙이기
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        {/* 파일 업로드 카드 */}
        <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-4">
          <h3 className="font-semibold mb-2 text-zinc-900 dark:text-white">
            파일 업로드
          </h3>
          <input
            type="file"
            className="block w-full text-sm text-zinc-700 dark:text-zinc-300
                       file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0
                       file:bg-zinc-100 dark:file:bg-zinc-800
                       file:text-zinc-900 dark:file:text-zinc-200"
            onChange={(e) =>
              setFileName(e.target.files?.[0]?.name || "선택된 파일 없음")
            }
          />
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {fileName}
          </p>
        </div>

        {/* 코드 입력 카드 */}
        <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-4">
          <h3 className="font-semibold mb-2 text-zinc-900 dark:text-white">
            코드 입력
          </h3>
          <textarea
            rows={10}
            className="w-full rounded-xl p-3 outline-none
                       bg-zinc-50 dark:bg-zinc-900
                       text-zinc-900 dark:text-zinc-100
                       placeholder:text-zinc-400"
            placeholder="코드를 붙여넣으세요..."
          />
        </div>
      </div>

      <div className="flex gap-3">
        {/* 라이트/다크 모두 대비가 좋은 버튼 */}
        <button className="px-5 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black">
          분석 실행
        </button>
        <button className="px-5 py-2 rounded-xl border border-zinc-300 dark:border-white/30">
          샘플 데이터로 보기
        </button>
      </div>
    </div>
  );
}
