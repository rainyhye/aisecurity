import { NavLink, Outlet } from "react-router-dom";
import Topbar from "../components/Topbar.jsx";

const item =
  "block px-3 py-2 rounded-lg text-sm font-medium transition " +
  "text-zinc-700 dark:text-zinc-300 " +
  "hover:bg-zinc-100 hover:text-zinc-900 " +
  "dark:hover:bg-zinc-800 dark:hover:text-white";

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 hidden md:block min-h-screen bg-zinc-50/70 dark:bg-zinc-950 border-r border-zinc-200 dark:border-white/10">
          <div className="p-4">
            <div className="text-xl font-extrabold">Forti</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              Securecoding solution
            </div>
          </div>
          <nav className="px-3 space-y-1">
            <NavLink
              to="/app"
              end
              className={({ isActive }) =>
                `${item} ${
                  isActive
                    ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white"
                    : ""
                }`
              }
            >
              Dashboard
            </NavLink>

            <NavLink
              to="/app/introduction"
              className={({ isActive }) =>
                `${item} ${
                  isActive
                    ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white"
                    : ""
                }`
              }
            >
              Introduction
            </NavLink>

            <NavLink
              to="/app/method"
              className={({ isActive }) =>
                `${item} ${
                  isActive
                    ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white"
                    : ""
                }`
              }
            >
              How to use
            </NavLink>
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1">
          <Topbar title="Dashboard" />
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
