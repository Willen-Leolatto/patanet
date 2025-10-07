import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import SideBar from "@/components/nav/SideBar";

export default function AppShell() {
  const { pathname } = useLocation();

  // Detecta se estamos em páginas de autenticação
  const isAuth = pathname === "/auth" || pathname.startsWith("/auth/");

  // Em telas de auth, garante que nenhuma margem herdada do sidebar permaneça
  useEffect(() => {
    if (isAuth) {
      document.documentElement.style.setProperty("--sidebar-ml", "0px");
    }
  }, [isAuth]);

  if (isAuth) {
    // Layout exclusivo para Login / Cadastro (sem sidebar)
    return (
      <div className="min-h-dvh w-full">
        <main className="min-h-dvh w-full grid place-items-center px-4 md:px-6">
          <Outlet />
        </main>
      </div>
    );
  }

  // Layout padrão com Sidebar
  function toggleSidebar() {
    window.dispatchEvent(new CustomEvent("patanet:sidebar-toggle"));
  }

  return (
    <div className="min-h-dvh w-full">
      {/* Botão hambúrguer – visível só em telas pequenas */}
      <button
        type="button"
        onClick={toggleSidebar}
        className="fixed left-3 top-3 z-50 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[var(--sidebar-bg)] text-[var(--sidebar-fg)] md:hidden"
        aria-label="Abrir menu"
        title="Menu"
      >
        ≡
      </button>

      {/* Sidebar fixa à esquerda */}
      <SideBar />

      {/* Área de conteúdo (recebe deslocamento do sidebar via CSS var) */}
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
