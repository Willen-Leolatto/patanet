// src/components/layout/AppShell.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import SideBar from "@/components/nav/SideBar";
import { useAuth } from "@/store/auth";

export default function AppShell() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Pode existir (seu store novo) ou não (store antigo/sem flag)
  const hydratedFromStore = useAuth((s) => s.hydrated);
  const user = useAuth((s) => s.user);

  // Se a flag não existir (undefined), consideramos "true" por padrão.
  // Se existir e for false, aguardamos um curto período (até 300ms) para evitar flicker.
  const [bootWait, setBootWait] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setBootWait(false), 300);
    return () => clearTimeout(t);
  }, []);

  const isHydrated = useMemo(() => {
    if (typeof hydratedFromStore === "boolean") return hydratedFromStore || !bootWait;
    return true; // sem flag -> já tratamos como hidratado
  }, [hydratedFromStore, bootWait]);

  const isAuthRoute = pathname === "/auth" || pathname.startsWith("/auth/");

  // Regras de navegação (tolerantes à hidratação)
  useEffect(() => {
    if (!isHydrated) return;

    // Não autenticado em rota protegida -> /auth
    if (!user && !isAuthRoute) {
      navigate("/auth", { replace: true, state: { from: pathname } });
      return;
    }

    // Autenticado em /auth -> /feed
    if (user && isAuthRoute) {
      navigate("/feed", { replace: true });
      return;
    }
  }, [isHydrated, user, isAuthRoute, pathname, navigate]);

  // Ajuste de deslocamento quando a sidebar não deve aparecer
  useEffect(() => {
    if (isAuthRoute || !user) {
      document.documentElement.style.setProperty("--sidebar-ml", "0px");
    }
  }, [isAuthRoute, user]);

  // Enquanto esperamos curta janela de hidratação, mostra loader simples
  if (!isHydrated) {
    return (
      <div className="min-h-dvh w-full grid place-items-center">
        <div className="animate-pulse text-sm text-zinc-500 dark:text-zinc-400">
          Carregando…
        </div>
      </div>
    );
  }

  // Layout sem sidebar (auth)
  if (isAuthRoute || !user) {
    return (
      <div className="min-h-dvh w-full">
        <main className="min-h-dvh w-full grid place-items-center px-4 md:px-6">
          <Outlet />
        </main>
      </div>
    );
  }

  // Layout autenticado com Sidebar
  function toggleSidebar() {
    window.dispatchEvent(new CustomEvent("patanet:sidebar-toggle"));
  }

  return (
    <div className="min-h-dvh w-full">
      {/* Botão hambúrguer (mobile) */}
      <button
        type="button"
        onClick={toggleSidebar}
        className="fixed left-3 top-3 z-50 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[var(--sidebar-bg)] text-[var(--sidebar-fg)] md:hidden"
        aria-label="Abrir menu"
        title="Menu"
      >
        ≡
      </button>

      <SideBar />

      <main
        className="
          transition-[margin] duration-300
          px-4 md:px-6 lg:px-8 py-6 lg:py-8
          md:ml-[var(--sidebar-ml,0px)]
        "
      >
        <Outlet />
      </main>
    </div>
  );
}
