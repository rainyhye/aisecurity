import { useTheme } from "./ThemeProvider";

export const ThemeToggle = () => {
  const { setTheme, theme } = useTheme();
  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 dark:border-white/10 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-white/5"
      title="테마 전환"
    >
      {theme === "dark" ? (
        <IconSun className="h-4 w-4" />
      ) : (
        <IconMoon className="h-4 w-4" />
      )}
      <span className="hidden sm:inline">
        {theme === "dark" ? "Dark" : "Light"}
      </span>
    </button>
  );
};

function IconSun({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      {/* Heroicons Sun (outline) */}
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3.75v3m0 10.5v3m6.364-13.364l-2.121 2.121M7.757 16.243l-2.121 2.121M20.25 12h-3m-10.5 0H3.75m13.364 6.364l-2.121-2.121M7.757 7.757l-2.121-2.121M12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z"
      />
    </svg>
  );
}

function IconMoon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      {/* Heroicons Moon (solid-style path) */}
      <path d="M21.752 15.002A9.718 9.718 0 0112 21.75 9.75 9.75 0 1112.748 2.25 7.5 7.5 0 0021.752 15.002z" />
    </svg>
  );
}
