// src/features/dashboard/components/TopNav.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../store/auth.jsx";
import { useTheme } from "../../../store/theme";
import { Moon, Sun } from "lucide-react";
import InstallPWAButton from "../../../components/InstallPWAButton.jsx";
import UserMenu from "@features/auth/components/UserMenu.jsx";

export default function TopNav({ onToggleSidebar }) {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);

  const theme = useTheme((s) => s.theme);
  const toggleTheme = useTheme((s) => s.toggle);

  return (
    <header className="fixed top-0 inset-x-0 z-40 topbar-surface border-b border-white/10">
      <div className="flex h-14 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          {/* botão de abrir/fechar sidebar (só aparece quando há sidebar) */}
          <button
            onClick={onToggleSidebar}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 hover:bg-white/5 text-[var(--chrome-fg)]"
            aria-label="Alternar menu"
            title="Menu"
          >
            ≡
          </button>

          <Link to="/" className="font-semibold text-[var(--chrome-fg)]">
            PataNet
          </Link>
        </div>

        <nav className="flex items-center gap-3">
          <InstallPWAButton />

          <Link
            className="text-sm opacity-90 hover:opacity-100 text-[var(--chrome-fg)]"
            to="/"
          >
            Feed
          </Link>
          <Link
            className="text-sm opacity-90 hover:opacity-100 text-[var(--chrome-fg)]"
            to="/dashboard"
          >
            Dashboard
          </Link>

          {/* Toggle Light/Dark (só afeta o conteúdo) */}
          <button
            onClick={toggleTheme}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 hover:bg-white/5 text-[var(--chrome-fg)]"
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
              className="rounded-md border border-white/10 px-3 py-1 text-sm hover:bg-white/5 text-[var(--chrome-fg)]"
            >
              Sair
            </button>
          ) : (
            <Link
              to="/login"
              className="rounded-md border border-white/10 px-3 py-1 text-sm hover:bg-white/5 text-[var(--chrome-fg)]"
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
