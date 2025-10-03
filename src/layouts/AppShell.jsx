import React from "react";
import { Outlet } from "react-router-dom";
import SideBar from "@/components/nav/SideBar";

const SIDEBAR_W = 280;

export default function AppShell() {
  // botão hambúrguer fica FORA do <aside> para não “sumir” quando o aside está
  // em transform/translate. Ele apenas dispara um evento para o SideBar alternar.
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

      {/* Área de conteúdo.
          A margem à esquerda no desktop é controlada por uma CSS var
          que o SideBar atualiza conforme abre/fecha. */}
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
