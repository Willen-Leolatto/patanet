import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/store/auth";
import { useTheme } from "@/store/theme";
import {
  Home as HomeIcon,
  PawPrint,
  User,
  Settings,
  LogIn,
  LogOut,
  Plus,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const SIDEBAR_W = 280;

export default function Sidebar() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const theme = useTheme((s) => s.theme);
  const toggleTheme = useTheme((s) => s.toggle);
  const { pathname } = useLocation();

  const [open, setOpen] = useState(true);
  const [isMdUp, setIsMdUp] = useState(false);

  // aplica/atualiza a margem do conteúdo no desktop via CSS var
  function applyContentSpacing(nextOpen, mdUp) {
    const ml = nextOpen && mdUp ? `${SIDEBAR_W}px` : "0px";
    document.documentElement.style.setProperty("--sidebar-ml", ml);
  }

  // define estado inicial com base no tamanho da tela
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const handle = () => {
      setIsMdUp(mq.matches);
      setOpen(mq.matches); // aberto por padrão no desktop
      applyContentSpacing(mq.matches, mq.matches);
    };
    handle();
    mq.addEventListener("change", handle);
    return () => mq.removeEventListener("change", handle);
  }, []);

  // ouve o botão hambúrguer (fora do aside)
  useEffect(() => {
    const onToggle = () => {
      setOpen((v) => {
        const next = !v;
        applyContentSpacing(next, isMdUp);
        return next;
      });
    };
    window.addEventListener("patanet:sidebar-toggle", onToggle);
    return () => window.removeEventListener("patanet:sidebar-toggle", onToggle);
  }, [isMdUp]);

  // fecha ao trocar de rota em telas pequenas
  useEffect(() => {
    if (!isMdUp) {
      setOpen(true);
      applyContentSpacing(true, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const NavItem = ({ to, icon: Ico, label }) => {
    const active =
      to === "/"
        ? pathname === "/"
        : pathname === to || pathname.startsWith(to + "/");
    return (
      <Link
        to={to}
        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors
        ${
          active
            ? "bg-white/10 text-white"
            : "text-[var(--sidebar-fg)] hover:bg-white/10"
        }`}
      >
        <Ico className="h-4 w-4" />
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Backdrop para mobile */}
      {open && !isMdUp && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden transition-opacity duration-200"
          onClick={() => {
            setOpen(false);
            applyContentSpacing(false, false);
          }}
        />
      )}

      <aside
        className="
          sidebar-surface fixed inset-y-0 left-0 z-50 w-[280px]
          transform-gpu transition-transform duration-300 ease-out
          md:translate-x-0
        "
        style={{
          transform: open ? "translateX(0)" : "translateX(-280px)",
        }}
      >
        <div className="flex h-full flex-col gap-6 p-4">
          {/* Logo / título */}
          <div className="px-1 text-lg font-semibold text-white">PataNet</div>

          {/* “Seus Pets” – thumbnails com scroll horizontal */}
          <section>
            <div className="px-1 text-xs uppercase tracking-wide text-white/70">
              Seus Pets
            </div>
            <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-2">
              <Link
                to="/pets/novo"
                title="Novo pet"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f77904] text-white"
              >
                <Plus className="h-4 w-4" />
              </Link>
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-9 w-9 shrink-0 rounded-full bg-white/10 ring-2 ring-white/10"
                  title={`pet ${i + 1}`}
                />
              ))}
            </div>
          </section>

          {/* Navegação principal */}
          <nav className="flex flex-col gap-1">
            <NavItem to="/" icon={HomeIcon} label="Página inicial" />
            <NavItem to="/pets" icon={PawPrint} label="Meus Pets" />
          </nav>

          <hr className="border-white/10" />

          {/* Navegação secundária */}
          <nav className="flex flex-col gap-1">
            <NavItem to="/dashboard/perfil" icon={User} label="Perfil" />
            <NavItem
              to="/dashboard/configuracoes"
              icon={Settings}
              label="Configurações"
            />
          </nav>

          <div className="mt-auto" />

          {/* Rodapé da sidebar */}
          <div className="rounded-xl bg-[#606873] p-3 text-white">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-black/20" />
              <div className="flex-1">
                <div className="text-xs opacity-80">Olá</div>
                <div className="text-sm font-medium">
                  {user ? user.displayName || "Usuário" : "Visitante"}
                </div>
              </div>

              <button
                onClick={toggleTheme}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white/10"
                title="Alternar tema"
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
                  className="inline-flex h-8 items-center gap-1 rounded-md bg-white/10 px-2 text-xs"
                  title="Sair"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sair
                </button>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex h-8 items-center gap-1 rounded-md bg-white/10 px-2 text-xs"
                  title="Entrar"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Entrar
                </Link>
              )}
            </div>
          </div>

          {/* Botão retrair/expandir no desktop */}
          <button
            type="button"
            onClick={() => {
              const next = !open;
              setOpen(next);
              applyContentSpacing(next, true);
            }}
            className="hidden md:flex absolute -right-3 top-6 h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-[var(--sidebar-bg)] text-[var(--sidebar-fg)] shadow transition-opacity hover:opacity-100"
            title={open ? "Retrair menu" : "Expandir menu"}
            aria-label="Retrair menu"
            aria-expanded={open}
          >
            {open ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
