// src/components/layout/AppShell.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import SideBar from "@/components/nav/SideBar";

// Capacitor (mantido)
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";

// API: probe de sessão
import { getMyProfile } from "@/api/user.api.js";

// ===== Back handlers globais (mantido) =====
const _backHandlers = new Set();
/** Registre uma função que retorna true se tratou o back (ex.: fechar modal) */
export function registerBackHandler(fn) {
  _backHandlers.add(fn);
  return () => _backHandlers.delete(fn);
}

export default function AppShell() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // ===== Sessão via API (sem Zustand/localStorage) =====
  const [me, setMe] = useState(null);
  const [probing, setProbing] = useState(true);  // carregando estado de sessão
  const [bootWait, setBootWait] = useState(true); // janelinha anti-flicker

  // Pequeno atraso para evitar “piscar” ao montar
  useEffect(() => {
    const t = setTimeout(() => setBootWait(false), 250);
    return () => clearTimeout(t);
  }, []);

  // Probe inicial da sessão + re-probe on demand
  useEffect(() => {
    let cancelled = false;

    async function probe() {
      try {
        setProbing(true);
        const u = await getMyProfile(); // /users/me
        if (!cancelled) setMe(u || null);
      } catch {
        if (!cancelled) setMe(null);
      } finally {
        if (!cancelled) setProbing(false);
      }
    }

    probe();

    // Caso o login/logout emita este evento, revalidamos
    const onAuthChange = () => probe();
    window.addEventListener("patanet:auth-updated", onAuthChange);

    return () => {
      cancelled = true;
      window.removeEventListener("patanet:auth-updated", onAuthChange);
    };
  }, []);

  const isAuthRoute = useMemo(
    () => /^\/(login|signup|auth)(\/|$)/i.test(pathname),
    [pathname]
  );

  // Regras de navegação (somente após probe concluído)
  useEffect(() => {
    if (probing) return; // não decide enquanto carrega sessão

    // Sem sessão e fora das rotas públicas -> vai para /login
    if (!me && !isAuthRoute) {
      navigate("/login", { replace: true, state: { from: pathname } });
      return;
    }

    // Com sessão e em rota de auth -> manda para /feed
    if (me && isAuthRoute) {
      navigate("/feed", { replace: true });
    }
  }, [probing, me, isAuthRoute, pathname, navigate]);

  // Ajuste do deslocamento quando a sidebar não deve aparecer
  useEffect(() => {
    if (isAuthRoute || !me) {
      document.documentElement.style.setProperty("--sidebar-ml", "0px");
    }
  }, [isAuthRoute, me]);

  // ===== Botão voltar (Capacitor) — mantido =====
  const exitArmedRef = useRef(false);
  useEffect(() => {
    if (!Capacitor.isNativePlatform?.()) return;

    const sub = CapApp.addListener("backButton", ({ canGoBack }) => {
      // 1) Overlays/Modais (Lightbox etc.)
      for (const fn of Array.from(_backHandlers)) {
        try {
          if (fn?.() === true) return; // tratado
        } catch {}
      }

      // 2) Navegação (evita voltar pra /login)
      const onAuth = /^\/(login|signup|auth)(\/|$)/i.test(pathname);
      if (canGoBack && !onAuth) {
        navigate(-1);
        return;
      }

      // 3) Raiz → duplo toque para sair
      if (!exitArmedRef.current) {
        exitArmedRef.current = true;
        console.log("Pressione voltar novamente para sair.");
        setTimeout(() => (exitArmedRef.current = false), 1500);
      } else {
        CapApp.exitApp();
      }
    });

    return () => {
      sub.remove();
    };
  }, [pathname, navigate]);

  // ===== Loaders =====
  const isHydrating = bootWait || probing;

  if (isHydrating) {
    return (
      <div className="min-h-dvh w-full grid place-items-center">
        <div className="animate-pulse text-sm text-zinc-500 dark:text-zinc-400">
          Carregando…
        </div>
      </div>
    );
  }

  // ===== Layout sem sidebar (rotas de auth ou sem sessão) =====
  if (isAuthRoute || !me) {
    return (
      <div className="min-h-dvh w-full">
        <main className="min-h-dvh w-full grid place-items-center px-4 md:px-6">
          <Outlet />
        </main>
      </div>
    );
  }

  // ===== Layout autenticado com Sidebar (mantido) =====
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
