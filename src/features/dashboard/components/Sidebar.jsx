// src/features/dashboard/components/Sidebar.jsx
import React, { useMemo } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/store/auth.jsx";
import { useTheme } from "@/store/theme";
import {
  Home,
  Images,
  PawPrint,
  Calendar,
  Settings as SettingsIcon,
  UserCircle2,
  LogOut,
  LogIn,
  Sun,
  Moon,
  Plus,
} from "lucide-react";
import PetAvatar from "@/components/PetAvatar";

function loadPets() {
  try {
    return JSON.parse(localStorage.getItem("patanet_pets") || "[]");
  } catch {
    return [];
  }
}

export default function Sidebar({ open, onClose }) {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const theme = useTheme((s) => s.theme);
  const toggleTheme = useTheme((s) => s.toggle);
  const navigate = useNavigate();

  const pets = useMemo(() => loadPets(), []);

  // Mobile overlay (clicar fora fecha)
  const MobileOverlay = (
    <div
      onClick={onClose}
      className={`md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] transition-opacity duration-200 ${
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
    />
  );

  return (
    <>
      {MobileOverlay}

      <aside
        className={[
          "sidebar-surface z-50",
          "fixed md:sticky left-0 top-0 md:top-0",
          "h-dvh md:h-screen",
          "transition-all duration-300",
          open ? "md:w-[280px] w-[280px] translate-x-0" : "md:w-[72px] -translate-x-full md:translate-x-0",
        ].join(" ")}
      >
        {/* Conteúdo interno da barra lateral */}
        <div className="flex h-full flex-col">
          {/* Cabeçalho / Logo */}
          <div className="px-4 py-4 flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-white/10" />
              {open && <div className="font-semibold text-[var(--chrome-fg)]">PataNet</div>}
            </Link>
          </div>

          {/* ===== Seus Pets (scroll horizontal) ===== */}
          <div className="px-3">
            {open && (
              <div className="px-1 pb-1 text-[11px] uppercase tracking-wide opacity-70">
                Seus Pets
              </div>
            )}

            <div
              className={`flex items-center gap-3 overflow-x-auto pb-2 ${
                open ? "px-1" : "px-0 justify-center"
              }`}
            >
              {/* Botão Novo Pet */}
              <button
                onClick={() => navigate("/pets/novo")}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
                title="Novo pet"
              >
                <Plus size={18} />
              </button>

              {/* Avatares dos pets */}
              {pets.map((p) => (
                <PetAvatar
                  key={p.id}
                  pet={p}
                  size={44}
                  onClick={() => navigate(`/pets/${p.id}`)}
                />
              ))}
            </div>

            {/* link "novo pet" quando aberto (legenda) */}
            {open && (
              <div className="px-1 pt-1 text-xs opacity-70">
                <Link to="/pets/novo" className="underline underline-offset-4">
                  novo pet
                </Link>
              </div>
            )}
          </div>

          <div className="my-3 mx-3 h-px bg-white/10" />

          {/* ===== Navegação ===== */}
          <nav className="px-2 space-y-1">
            <Item to="/" icon={<Home size={18} />} open={open}>
              Página inicial
            </Item>

            <Item to="/dashboard/fotos" icon={<Images size={18} />} open={open}>
              Fotos
            </Item>

            <Item to="/pets" icon={<PawPrint size={18} />} open={open}>
              Meus Pets
            </Item>

            <Item to="/dashboard/vacinas" icon={<Calendar size={18} />} open={open}>
              Carteira de Vacinas
            </Item>

            <Item to="/dashboard" icon={<UserCircle2 size={18} />} open={open}>
              Perfil
            </Item>

            <Item
              to="/dashboard/configuracoes"
              icon={<SettingsIcon size={18} />}
              open={open}
            >
              Configurações
            </Item>
          </nav>

          {/* ===== Rodapé (usuário + ações) ===== */}
          <div className="mt-auto p-3">
            <div className="profile-tile flex items-center gap-3 rounded-xl px-3 py-2">
              <div className="h-9 w-9 rounded-full bg-white/20" />
              {open && (
                <div className="min-w-0">
                  <div className="text-xs opacity-80">Olá</div>
                  <div className="truncate font-medium">{user?.name || "Visitante"}</div>
                </div>
              )}

              {/* Toggle Tema */}
              <button
                onClick={toggleTheme}
                className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20"
                title={theme === "dark" ? "Modo claro" : "Modo escuro"}
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* Entrar/Sair */}
              {user ? (
                <button
                  onClick={logout}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20"
                  title="Sair"
                >
                  <LogOut size={18} />
                </button>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20"
                  title="Entrar"
                >
                  <LogIn size={18} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function Item({ to, icon, children, open }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        [
          "group flex items-center gap-3 rounded-lg px-2 py-2",
          isActive ? "bg-white/10" : "hover:bg-white/5",
          "text-[var(--chrome-fg)]",
        ].join(" ")
      }
      title={!open ? String(children) : undefined}
    >
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/5">
        {icon}
      </span>
      {open && <span className="truncate">{children}</span>}
    </NavLink>
  );
}
