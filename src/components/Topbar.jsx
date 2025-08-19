import { useEffect, useMemo, useState } from "react";
import { ThemeToggle } from "./ThemeToggle";

const HEALTH_URL = import.meta.env.VITE_HEALTH_URL || "/api/health";

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const text = useMemo(() => {
    const d = now.toLocaleDateString(navigator.language || "ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
    });
    const t = now.toLocaleTimeString(navigator.language || "ko-KR", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    });
    return `${d} • ${t}`;
  }, [now]);
  return text;
}

function useHealthPoll(ms = 20000) {
  const [status, setStatus] = useState("loading"); // "ok" | "down" | "loading"
  const [lastChecked, setLastChecked] = useState(null);

  const check = async () => {
    setStatus("loading");
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2500);
    try {
      const res = await fetch(HEALTH_URL, { signal: ctrl.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus("ok");
    } catch {
      setStatus("down");
    } finally {
      clearTimeout(timer);
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    check();
    const id = setInterval(check, ms);
    return () => clearInterval(id);
  }, []); // eslint-disable-line

  return { status, lastChecked, check };
}

function Pill({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${className}`}
    >
      {children}
    </span>
  );
}

export default function Topbar({ title = "Dashboard" }) {
  const clock = useClock();
  const { status, lastChecked, check } = useHealthPoll();
  const env = import.meta.env.MODE?.toUpperCase?.() || "DEV";
  const version = import.meta.env.VITE_APP_VERSION || "0.1.0";

  return (
    <header className="border-b border-zinc-200 dark:border-white/10 px-4 py-3 flex items-center justify-between">
      {/* 왼쪽: 페이지 타이틀 */}
      <div className="flex items-baseline gap-3">
        <h1 className="text-lg font-semibold">{title}</h1>
        <Pill className="bg-white/5 text-zinc-300 border border-white/10">
          {env}
        </Pill>
        <Pill className="bg-white/0 text-zinc-400 border border-white/10">
          v{version}
        </Pill>
      </div>

      {/* 오른쪽: 상태/시계/액션들 */}
      <div className="flex items-center gap-2">
        {/* 백엔드 상태 */}
        <button onClick={check} className="group">
          <Pill
            className={
              status === "ok"
                ? "bg-green-500/15 text-green-400 border border-green-500/20"
                : status === "loading"
                ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20"
                : "bg-red-500/15 text-red-400 border border-red-500/20"
            }
          >
            <span
              className={`h-2 w-2 rounded-full ${
                status === "ok"
                  ? "bg-green-400"
                  : status === "loading"
                  ? "bg-yellow-400 animate-pulse"
                  : "bg-red-400"
              }`}
            />
            API{" "}
            {status === "ok"
              ? "OK"
              : status === "loading"
              ? "Checking..."
              : "Down"}
          </Pill>
        </button>

        {/* 시계 */}
        <div className="hidden md:block text-sm text-zinc-400">{clock}</div>

        {/* 깃허브 */}
        <a
          href={
            import.meta.env.VITE_GITHUB_URL ||
            "https://github.com/your-org/your-repo"
          }
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 dark:border-white/10 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-white/5"
          title="GitHub 저장소"
        >
          {/* GitHub mark */}
          <svg
            viewBox="0 0 16 16"
            className="h-4 w-4 fill-current"
            aria-hidden="true"
          >
            <path d="M8 0C3.58 0 0 3.73 0 8.33c0 3.68 2.29 6.8 5.47 7.9.4.08.55-.18.55-.4 0-.2-.01-.86-.01-1.57-2.01.38-2.53-.5-2.7-.96-.09-.25-.48-1.02-.82-1.23-.28-.15-.68-.52-.01-.53.63-.01 1.08.6 1.23.85.72 1.22 1.87.88 2.33.67.07-.53.28-.88.51-1.08-1.78-.21-3.64-.92-3.64-4.1 0-.91.31-1.65.82-2.23-.08-.2-.36-1.05.08-2.19 0 0 .67-.22 2.2.85a7.4 7.4 0 0 1 4 0c1.53-1.07 2.2-.85 2.2-.85.44 1.14.16 1.99.08 2.19.51.58.82 1.32.82 2.23 0 3.19-1.87 3.89-3.65 4.1.29.26.54.77.54 1.55 0 1.12-.01 2.02-.01 2.29 0 .22.15.48.55.4C13.71 15.13 16 12.02 16 8.33 16 3.73 12.42 0 8 0z" />
          </svg>
          <span className="hidden sm:inline">GitHub</span>
        </a>

        {/* 테마 토글 */}
        <ThemeToggle />
      </div>
    </header>
  );
}
