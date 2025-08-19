// src/pages/Method.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function Method() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <header className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-6 md:p-8">
        <h1 className="text-3xl md:text-4xl font-extrabold">
          How to use Forti
        </h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-300">
          이 페이지는 Forti 사용법을 간단히 안내합니다. 대시보드에서{" "}
          <b>파일 업로드 또는 코드 붙여넣기</b> → <b>분석 실행</b> →{" "}
          <b>요약/차트 확인</b> → <b>전체 목록</b> →
          <b> Secure Coding Guide 생성</b> → <b>다운로드</b> 순서로 진행하세요.
        </p>
        <div className="mt-4 flex gap-3">
          <Link
            to="/app"
            className="px-5 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black"
          >
            대시보드로 가기
          </Link>
          <Link to="/app/findings" className="px-5 py-2 rounded-xl border">
            전체 목록(Findings)
          </Link>
          <a
            href="https://github.com/rainyhye/aisecurity"
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2 rounded-xl border"
          >
            GitHub
          </a>
        </div>
      </header>

      {/* Steps */}
      <section className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-6 md:p-8">
        <h2 className="text-2xl font-semibold">사용 순서</h2>
        <ol className="mt-4 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              t: "1) 입력",
              d: "왼쪽 카드에서 파일 업로드 또는 코드 붙여넣기.",
            },
            { t: "2) 분석 실행", d: "“분석 실행” 클릭 → 정적+동적 탐지 수행." },
            {
              t: "3) 요약/차트",
              d: "오른쪽 카드에서 총 건수·원형차트·상위 항목 확인.",
            },
            {
              t: "4) 전체 보기",
              d: "“더보기”로 /app/findings 새 탭 → 필터/검색/정렬.",
            },
            {
              t: "5) 가이드 생성",
              d: "대시보드 하단 Secure Coding Guide → 생성.",
            },
            {
              t: "6) 다운로드",
              d: "결과(JSON/CSV), 가이드(MD/JSON, 추후 PDF 링크) 저장.",
            },
            {
              t: "7) 수정 반영",
              d: "가이드 코드 예시/체크리스트를 코드에 적용.",
            },
            { t: "8) 재분석", d: "남은 이슈를 줄일 때까지 반복." },
          ].map((s) => (
            <li
              key={s.t}
              className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800/50 p-4"
            >
              <div className="font-medium">{s.t}</div>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                {s.d}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* Placeholders: Video & Screenshots */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">
          예시 영상 / 스크린샷 (준비 중)
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          자료가 준비되면 아래 박스에 <code>&lt;img /&gt;</code> 또는 영상
          플레이어를 넣어주세요 (public/에 파일 두고 경로 참조).
        </p>

        {/* Video placeholder */}
        <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-900 p-4">
          <div className="aspect-video rounded-xl grid place-items-center bg-zinc-50 dark:bg-zinc-800/40 text-zinc-500 text-center px-4">
            (여기에 데모 영상 / YouTube 임베드 / mp4 플레이어를 넣을 수 있어요)
          </div>
        </div>

        {/* 3 screenshots */}
        <div className="grid md:grid-cols-3 gap-4">
          {[
            "Dashboard — 입력",
            "Dashboard — 요약/차트",
            "Findings — 전체 목록",
          ].map((label) => (
            <div
              key={label}
              className="rounded-2xl border border-dashed border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-900 p-4"
            >
              <div className="aspect-video rounded-xl grid place-items-center bg-zinc-50 dark:bg-zinc-800/40 text-zinc-500 text-center px-3">
                {label} (이미지 업로드 예정)
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* API Quickstart */}
      <section className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-6 md:p-8 space-y-6">
        <h2 className="text-2xl font-semibold">API 빠른 시작</h2>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Detect */}
          <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800/50 p-4">
            <h3 className="font-medium">1) /api/detect-vulns</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-2">
              <code>multipart/form-data</code>로 <code>file</code> 또는{" "}
              <code>code</code> 전송. 응답은{" "}
              <code>{`{ runId, counts, findings[] }`}</code>.
            </p>
            <Pre>
              {`const form = new FormData();
if (file) form.append("file", file);
if (code) form.append("code", new Blob([code], { type: "text/plain" }), "paste.txt");
const res = await fetch("/api/detect-vulns", { method: "POST", body: form });
const data = await res.json(); // => { runId, counts, findings }`}
            </Pre>
          </div>

          {/* Guide */}
          <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800/50 p-4">
            <h3 className="font-medium">2) /api/guidelines</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-2">
              중요도 상위 항목 기준으로 <code>selection</code>을 보내면 RAG
              가이드가 생성됩니다.
            </p>
            <Pre>
              {`const selection = findings.slice(0,4).map(f => f.id);
const res = await fetch("/api/guidelines", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ runId, selection }),
});
const guide = await res.json(); // => { runId, pdfUrl?, guidelines: [...] }`}
            </Pre>
          </div>

          {/* Report */}
          <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800/50 p-4">
            <h3 className="font-medium">3) /api/report</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-2">
              결과 리포트를 파일로 다운로드합니다.{" "}
              <code>format=json|csv|pdf</code>
            </p>
            <Pre>
              {`const res = await fetch(\`/api/report?runId=\${runId}&format=json\`);
const blob = await res.blob();
download(blob, \`forti-\${runId}.json\`);`}
            </Pre>
          </div>

          {/* Hints */}
          <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800/50 p-4">
            <h3 className="font-medium">Tip</h3>
            <ul className="list-disc pl-5 text-sm text-zinc-600 dark:text-zinc-300 space-y-1">
              <li>
                대시보드는 마지막 실행 결과를 <code>localStorage</code>에 저장해
                /app/findings에서 재사용.
              </li>
              <li>
                PDF는 백엔드에서 <code>pdfUrl</code>을 내려주면 버튼이
                활성화됩니다.
              </li>
              <li>대용량 프로젝트는 zip으로 업로드하면 전송이 안정적입니다.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Troubleshooting */}
      <section className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-6 md:p-8">
        <h2 className="text-2xl font-semibold">자주 묻는 질문 / 문제 해결</h2>
        <div className="mt-4 grid md:grid-cols-2 gap-4 text-sm">
          <Faq
            q="차트가 보이지 않아요."
            a="분석 실행 후 결과를 받아야 차트가 렌더링됩니다. 샘플 데이터 버튼으로도 확인 가능합니다."
          />
          <Faq
            q="PDF 다운로드가 안 됩니다."
            a="데모에선 MD/JSON만 제공합니다. 백엔드가 pdfUrl을 응답하면 버튼이 활성화됩니다."
          />
          <Faq
            q="업로드와 코드 붙여넣기를 동시에 해도 되나요?"
            a="가능합니다. 둘 다 전송하면 서버가 합쳐서 분석하도록 설계되어 있습니다."
          />
          <Faq
            q="상위 항목 기준은 무엇인가요?"
            a="Severity( Critical > High > Medium > Low )와 CVSS 점수로 정렬합니다."
          />
        </div>
      </section>
    </div>
  );
}

/* ---------- small helpers ---------- */
function Pre({ children }) {
  return (
    <pre className="whitespace-pre-wrap text-xs md:text-sm p-3 rounded-xl bg-zinc-900 text-zinc-100 overflow-x-auto border border-zinc-200 dark:border-white/10">
      <code>{children}</code>
    </pre>
  );
}

function Faq({ q, a }) {
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800/50 p-4">
      <div className="font-medium">{q}</div>
      <p className="mt-1 text-zinc-600 dark:text-zinc-300">{a}</p>
    </div>
  );
}
