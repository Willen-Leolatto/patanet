import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../store/auth.jsx";
import { useTheme } from "../../../store/theme";
import { Moon, Sun } from "lucide-react";
import InstallPWAButton from "../../../components/InstallPWAButton.jsx";
import UserMenu from "@features/auth/components/UserMenu.jsx";

export default function TopNav({ variant = "feed", onToggleSidebar }) {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);

  const theme = useTheme((s) => s.theme);
  const toggleTheme = useTheme((s) => s.toggle);

  return (
    <header className="fixed top-0 inset-x-0 z-40 border-b border-slate-800 bg-slate-900 text-slate-100 shadow-sm">
      <div className="flex h-14 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          {variant === "dashboard" && (
            <button
              onClick={onToggleSidebar}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-100"
              aria-label="Alternar menu"
              title="Menu"
            >
              ≡
            </button>
          )}
          <Link to="/" className="font-semibold text-slate-100">
            PataNet
          </Link>
        </div>

        <nav className="flex items-center gap-3">
          <Link
            className="text-sm text-slate-200 opacity-80 hover:opacity-100"
            to="/"
          >
            <InstallPWAButton />
            Baixar
          </Link>
          <Link
            className="text-sm text-slate-200 opacity-80 hover:opacity-100"
            to="/"
          >
            Feed
          </Link>
          <Link
            className="text-sm text-slate-200 opacity-80 hover:opacity-100"
            to="/dashboard"
          >
            Dashboard
          </Link>

          {/* Toggle Light/Dark (só afeta o conteúdo) */}
          <button
            onClick={toggleTheme}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-100"
            aria-label="Alternar tema"
            title={theme === "dark" ? "Modo claro" : "Modo escuro"}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          {user ? (
            <button
              onClick={logout}
              className="rounded-md border border-slate-700 px-3 py-1 text-sm hover:bg-slate-800 text-slate-100"
            >
              Sair
            </button>
          ) : (
            <Link
              to="/login"
              className="rounded-md border border-slate-700 px-3 py-1 text-sm hover:bg-slate-800 text-slate-100"
            >
              Entrar
            </Link>
          )}
        </nav>

        <UserMenu />
      </div>
    </header>
  );
}
