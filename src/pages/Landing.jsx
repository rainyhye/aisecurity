import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black to-zinc-900" />
      <div className="absolute inset-0 bg-black/40" />

      <section className="relative z-10 flex flex-col items-center justify-center text-center min-h-screen px-6">
        <h1 className="text-white text-5xl md:text-7xl font-extrabold leading-tight tracking-tight">
          Forti
          <br />
          Securecoding solution
        </h1>
        <p className="mt-6 text-zinc-200 max-w-xl">
          정적·동적 분석 결과를 RAG 가이드라인과 결합해 보안 취약점을 빠르게
          파악하고 수정하세요.
        </p>

        <div className="mt-10 flex items-center gap-4">
          <Link
            to="/app"
            className="px-6 py-3 rounded-xl bg-white text-black font-semibold hover:bg-zinc-200 transition"
          >
            대시보드로 이동
          </Link>
          <a
            href="https://github.com/your-org/your-repo"
            target="_blank"
            rel="noreferrer"
            className="px-6 py-3 rounded-xl border border-white/60 text-white hover:bg-white/10 transition"
          >
            GitHub 보기
          </a>
        </div>
      </section>

      <div className="absolute bottom-4 inset-x-0 text-center text-xs text-zinc-400">
        © {new Date().getFullYear()} Forti • Secure Coding Hackathon
      </div>
    </main>
  );
}
