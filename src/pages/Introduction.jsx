// src/pages/Introduction.jsx
import React from "react";
import { Link } from "react-router-dom";

const BANNER_IMG = "/forti-banner.png"; // 예: "/banner.png"

const PIPELINE = [
  { label: "Upload / Paste", desc: "코드/프로젝트 업로드 또는 텍스트 입력" },
  { label: "Detect", desc: "정적+동적 분석 결합으로 취약점 탐지" },
  { label: "Aggregate", desc: "중복 제거 · 증거/맥락 취합 · 심각도 산정" },
  { label: "RAG Guide", desc: "RAG 기반 시큐어 코딩 가이드라인 생성" },
  { label: "Fix", desc: "수정 예시 · 체크리스트 · 레퍼런스 제공" },
];

const DIFFERENTIATORS = [
  {
    title: "정적+동적 하이브리드",
    body: "Semgrep/CodeQL 등 정적 분석과 ZAP/커스텀 동적 탐지 결과를 하나의 러닝으로 통합. 단일 리포트에서 전체 맥락 확인.",
  },
  {
    title: "RAG 시큐어 코딩 가이드",
    body: "검출된 취약점과 관련 코드/로그를 RAG로 연결해 맞춤형 수정 가이드·코드 예시·참고 링크를 생성.",
  },
  {
    title: "우선순위와 중복 정리",
    body: "CWE·CVSS·경로·증거를 기준으로 중복을 제거하고, 팀이 바로 처리할 수 있는 우선순위를 산출.",
  },
  {
    title: "개발자 워크플로 친화",
    body: "JSON/CSV/PDF 다운로드, 라우팅된 상세 뷰, 나중에 다시 보기 위한 runId 저장까지 개발 흐름에 맞춤 설계.",
  },
];

const LANGUAGES = [
  "JavaScript / TypeScript (Node, React)",
  "Python (FastAPI, Flask)",
  "Java (Spring)",
  "Go",
  "C# (.NET)",
  "Kotlin",
  "Rust",
];

const TEAM = [
  {
    name: "김나연",
    role: "Research / RAG",
    github: "https://github.com/annoeyed",
    avatar: "https://github.com/annoeyed.png?size=240",
  },
  {
    name: "변정희",
    role: "Backend Engineer",
    github: "https://github.com/teeli1",
    avatar: "https://github.com/teeli1.png?size=240",
  },
  {
    name: "조현희",
    role: "Backend Engineer",
    github: "https://github.com/paninicho",
    avatar: "https://github.com/paninicho.png?size=240",
  },
  {
    name: "편정혜",
    role: "Frontend Engineer",
    github: "https://github.com/rainyhye",
    avatar: "https://github.com/rainyhye.png?size=240",
  },
];

export default function Introduction() {
  return (
    <div className="space-y-12 text-zinc-900 dark:text-zinc-100">
      {/* === Hero Banner === */}
      <section className="relative overflow-hidden rounded-3xl border border-zinc-200 dark:border-white/10">
        {/* 배경 라이트 */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/15 via-emerald-400/10 to-fuchsia-400/15 dark:from-indigo-500/25 dark:via-emerald-400/15 dark:to-fuchsia-400/25" />
        <div className="absolute -top-24 -left-24 h-64 w-64 bg-indigo-400/30 blur-3xl rounded-full" />
        <div className="absolute -bottom-24 -right-24 h-64 w-64 bg-emerald-400/30 blur-3xl rounded-full" />

        {/* 내용 래퍼 + 대비용 살짝 어두운 오버레이 */}
        <div className="relative p-8 md:p-12 grid lg:grid-cols-2 gap-8 items-center bg-white/60 dark:bg-zinc-900/65 backdrop-blur">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full border border-zinc-300 dark:border-white/15 bg-white/70 dark:bg-white/5">
              <span className="font-semibold">Fo(u)rti</span>
              <span className="opacity-70">·</span>
              <span>AI Security Hackathon</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight tracking-tight text-zinc-900 dark:text-white">
              <span className="bg-gradient-to-r from-emerald-300 via-cyan-200 to-indigo-300 bg-clip-text text-transparent">
                Forti
              </span>{" "}
              — 정적·동적 탐지 + RAG 가이드로
              <br className="hidden md:block" />
              보안 이슈를 빠르게 “수정”까지
            </h1>

            <p className="text-zinc-700 dark:text-zinc-300">
              코드 업로드/붙여넣기 → 통합 탐지 → 우선순위 산정 →{" "}
              <span className="font-semibold">
                RAG 기반 Secure Coding Guide
              </span>{" "}
              생성. 개발자가 바로 반영할 수 있는 수정 예시와 체크리스트를
              제공합니다.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/app"
                className="px-5 py-2 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-100"
              >
                시작하기
              </Link>
              <Link
                to="/app/method"
                className="px-5 py-2 rounded-xl border border-zinc-300 hover:bg-zinc-50 dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10"
              >
                분석 방법 보기
              </Link>
              <a
                href="https://github.com/rainyhye/aisecurity"
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2 rounded-xl border border-zinc-300 hover:bg-zinc-50 dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10"
              >
                GitHub
              </a>
            </div>
          </div>

          {/* 배너 이미지 (선택) */}
          <div className="relative">
            <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/60 aspect-video grid place-items-center overflow-hidden">
              {BANNER_IMG ? (
                <img
                  src={BANNER_IMG}
                  alt="Forti banner"
                  className="w-full h-full object-cover opacity-95"
                />
              ) : (
                <div className="text-sm text-zinc-600 dark:text-zinc-400 p-6 text-center">
                  배너 이미지를 넣으려면 <code>BANNER_IMG</code>에 경로를
                  지정하세요.
                  <br /> (예: <code>public/banner.png</code> →{" "}
                  <code>"/banner.png"</code>)
                </div>
              )}
              {/* 읽기성 향상 오버레이 */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-transparent via-black/10 to-black/20 dark:via-black/25 dark:to-black/35" />
            </div>
          </div>
        </div>
      </section>

      {/* 1) Forti 란? */}
      <section className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-6 md:p-8">
        <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white">
          Forti 란?
        </h2>
        <p className="mt-3 text-zinc-600 dark:text-zinc-300 leading-relaxed">
          <strong>Forti</strong>는 코드 보안 점검을 위한
          <span className="mx-1 font-semibold">정적 + 동적</span> 솔루션을 한
          번에 제공하고, 탐지 결과를{" "}
          <span className="mx-1 font-semibold">
            RAG 기반 시큐어 코딩 가이드
          </span>
          로 연결해 개발자가 빠르게 수정하도록 돕는 대시보드입니다.
          업로드/붙여넣기 입력 → 통합 탐지 → 중복/맥락 정리 → 가이드라인 생성 →
          다운로드까지 한 흐름으로 제공합니다.
        </p>

        {/* 파이프라인 */}
        <ol className="mt-6 grid md:grid-cols-5 gap-3">
          {PIPELINE.map((s, i) => (
            <li
              key={s.label}
              className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800/60 p-4"
            >
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                Step {i + 1}
              </div>
              <div className="mt-1 font-semibold">{s.label}</div>
              <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                {s.desc}
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-6">
          <Link
            to="/app"
            className="inline-block px-5 py-2 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-100"
          >
            시작하기
          </Link>
        </div>
      </section>

      {/* 2) 다른 시큐어코딩 솔루션과의 차이점 */}
      <section className="space-y-4">
        <h3 className="text-2xl font-semibold text-zinc-900 dark:text-white">
          다른 시큐어코딩 솔루션과의 차이점
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {DIFFERENTIATORS.map((d) => (
            <div
              key={d.title}
              className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-5"
            >
              <div className="font-medium">{d.title}</div>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                {d.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 3) 지원 언어 (미정 → 임의 리스트) */}
      <section className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-6 md:p-8">
        <h3 className="text-2xl font-semibold text-zinc-900 dark:text-white">
          지원 언어 (초안)
        </h3>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          실제 지원 범위는 탐지 엔진/샘플 규칙 세트에 따라 조정될 수 있습니다.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {LANGUAGES.map((lang) => (
            <span
              key={lang}
              className="text-sm px-3 py-1 rounded-full border border-zinc-300 dark:border-white/20 bg-zinc-50 dark:bg-zinc-800/60"
            >
              {lang}
            </span>
          ))}
        </div>
      </section>

      {/* 4) About us */}
      <section id="about" className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-2xl font-semibold text-zinc-900 dark:text-white">
            About us — <span className="font-extrabold">Fo(u)rti</span>
          </h3>
          <a
            href="https://github.com/rainyhye/aisecurity"
            target="_blank"
            rel="noreferrer"
            className="text-sm px-3 py-2 rounded-xl border border-zinc-300 hover:bg-zinc-50 dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10"
          >
            프로젝트 GitHub
          </a>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TEAM.map((m) => (
            <div
              key={m.name}
              className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-5 flex flex-col items-center text-center gap-3"
            >
              {m.avatar ? (
                <img
                  src={m.avatar}
                  alt={m.name}
                  className="h-24 w-24 rounded-full object-cover border border-zinc-200 dark:border-white/10"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-zinc-200 dark:bg-zinc-800 grid place-items-center text-2xl font-bold">
                  {m.name?.[0] || "F"}
                </div>
              )}
              <div>
                <div className="font-medium">{m.name}</div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">
                  {m.role}
                </div>
              </div>
              <a
                href={m.github}
                target="_blank"
                rel="noreferrer"
                className="text-sm px-3 py-1 rounded-lg border border-zinc-300 hover:bg-zinc-50 dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10"
              >
                GitHub
              </a>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
