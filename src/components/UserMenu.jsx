import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function UserMenu({ className = "" }) {
  const nav = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  async function onLogout() {
    await logout();
    nav("/feed");
  }

  if (!isAuthenticated) {
    return (
      <Link
        to="/login"
        className={`rounded-md border px-3 py-1.5 text-sm
                    border-slate-300 hover:bg-slate-100
                    dark:border-slate-700 dark:hover:bg-slate-800 ${className}`}
      >
        Entrar
      </Link>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm opacity-80 max-w-[160px] truncate">
        {user?.name || "Você"}
      </span>
      <button
        type="button"
        onClick={() => nav("/dashboard")}
        className="rounded-md border px-3 py-1.5 text-sm
                   border-slate-300 hover:bg-slate-100
                   dark:border-slate-700 dark:hover:bg-slate-800"
      >
        Dashboard
      </button>
      <button
        type="button"
        onClick={onLogout}
        className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:opacity-90
                   dark:bg-slate-200 dark:text-slate-900"
      >
        Sair
      </button>
    </div>
  );
}
