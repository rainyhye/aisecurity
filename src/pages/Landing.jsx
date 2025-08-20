import { Link } from "react-router-dom";

export default function Landing() {
  const year = new Date().getFullYear();

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-white">
      {/* --- decorative lights --- */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        {/* soft radial lights */}
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-indigo-500/30 blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-emerald-400/25 blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-12 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-3xl" />
        {/* thin ring */}
        <div className="absolute left-1/2 top-1/2 h-[44rem] w-[44rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
      </div>

      {/* --- hero --- */}
      <section className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 text-center">
        {/* badge */}
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs backdrop-blur">
          <span className="font-semibold">Forti</span>
          <span className="opacity-60">•</span>
          <span>Secure Coding Solution</span>
        </span>

        {/* heading */}
        <h1 className="text-5xl font-extrabold leading-tight tracking-tight md:text-7xl drop-shadow-[0_6px_24px_rgba(0,0,0,0.45)]">
          <span className="bg-gradient-to-r from-emerald-300 via-cyan-200 to-indigo-300 bg-clip-text text-transparent">
            Forti
          </span>
          <br className="hidden md:block" />
          <span className="opacity-95">Securecoding solution</span>
        </h1>

        {/* sub copy (glass card) */}
        <p className="mt-6 max-w-2xl rounded-2xl border border-white/10 bg-white/5 px-6 py-4 leading-7 text-zinc-200 backdrop-blur">
          <span className="text-white/90">정적·동적 분석 결과를</span>
          <br />
          <b className="text-white">RAG 시큐어 코딩 가이드라인</b>
          과 결합해
          <br />
          취약점을 빠르게 파악하고, 바로 수정까지 이어지도록 돕는 대시보드
        </p>

        {/* CTAs */}
        <div className="mt-8 flex items-center gap-4">
          <Link
            to="/app"
            className="rounded-xl bg-white px-6 py-3 font-semibold text-black shadow-lg ring-1 ring-black/5 transition hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            aria-label="대시보드로 이동"
          >
            대시보드로 이동
          </Link>
          <a
            href="https://github.com/rainyhye/aisecurity"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-white/30 px-6 py-3 font-semibold text-white/90 backdrop-blur transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            aria-label="GitHub 저장소 열기"
          >
            GitHub 보기
          </a>
        </div>

        {/* key points */}
        <div className="mt-8 flex flex-wrap justify-center gap-2 text-xs">
          {[
            "정적+동적 통합 탐지",
            "RAG 기반 가이드",
            "JSON/CSV/PDF 리포트",
          ].map((t) => (
            <span
              key={t}
              className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-white/80 backdrop-blur"
            >
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* footer */}
      <div className="absolute inset-x-0 bottom-4 z-10 text-center text-xs text-zinc-400">
        © {year} Forti • Secure Coding Solution
      </div>
    </main>
  );
}
