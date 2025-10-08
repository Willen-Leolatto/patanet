import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

// compatível com Context ou Zustand
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

import { loadPets, mediaGetUrl } from "@/features/pets/services/petsStorage";
import AvatarCircle from "@/components/AvatarCircle";

const SIDEBAR_W = 280;

export default function Sidebar() {
  const { pathname } = useLocation();

  // não renderiza em rotas de auth
  if (/^\/(login|signup|auth)\b/.test(pathname)) return null;

  // pega o slice de auth (funciona com Context e com Zustand)
  const authSlice =
    typeof useAuth === "function" && useAuth.length > 0
      ? useAuth((s) => s)
      : useAuth();

  // ——— usuario “defensivo” (cobre diferentes formatos)
  const rawUser =
    authSlice?.user ?? authSlice?.currentUser ?? authSlice?.me ?? null;

  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);

  const theme = useTheme((s) => s.theme);
  const toggleTheme = useTheme((s) => s.toggle);

  const [open, setOpen] = useState(true);
  const [isMdUp, setIsMdUp] = useState(false);

  const [myPets, setMyPets] = useState([]);
  // urls resolvidas para os avatares de pets (via IDB)
  const [petThumbs, setPetThumbs] = useState({}); // { [petId]: { avatarUrl, coverUrl } }

  const [overflow, setOverflow] = useState(false);
  const railRef = useRef(null);

  const currentUserId =
    user?.id || user?.uid || user?.email || user?.username || null;

  function applyContentSpacing(nextOpen, mdUp) {
    const ml = nextOpen && mdUp ? `${SIDEBAR_W}px` : "0px";
    document.documentElement.style.setProperty("--sidebar-ml", ml);
  }

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const handle = () => {
      setIsMdUp(mq.matches);
      setOpen(mq.matches);
      applyContentSpacing(mq.matches, mq.matches);
    };
    handle();
    mq.addEventListener("change", handle);
    return () => mq.removeEventListener("change", handle);
  }, []);

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

  useEffect(() => {
    if (!isMdUp) {
      setOpen(true);
      applyContentSpacing(true, true);
    }
  }, [pathname, isMdUp]);

  // carregar pets do usuário logado
  useEffect(() => {
    const refresh = () => {
      const all = loadPets();
      const mine = currentUserId
        ? all.filter((p) => (p.ownerId || p.userId || p.createdBy) === currentUserId)
        : [];
      setMyPets(mine);
    };
    refresh();
    window.addEventListener("patanet:pets-updated", refresh);
    return () => window.removeEventListener("patanet:pets-updated", refresh);
  }, [currentUserId]);

  // resolver avatar/cover dos pets via IndexedDB (avatarId / coverId)
  useEffect(() => {
    let cancelled = false;

    async function resolveThumbs() {
      const pairs = await Promise.all(
        (myPets || []).map(async (p) => {
          // COVER
          let coverUrl = p.cover || "";
          if (!coverUrl && p.coverId) {
            try {
              coverUrl = await mediaGetUrl(p.coverId);
            } catch {
              coverUrl = "";
            }
          }
          // AVATAR
          let avatarUrl = p.avatar || "";
          if (!avatarUrl && p.avatarId) {
            try {
              avatarUrl = await mediaGetUrl(p.avatarId);
            } catch {
              avatarUrl = "";
            }
          }
          // fallback para cover quando não houver avatar
          if (!avatarUrl) avatarUrl = coverUrl;

          return [p.id, { coverUrl, avatarUrl }];
        })
      );

      if (!cancelled) {
        const map = {};
        for (const [id, urls] of pairs) map[id] = urls;
        setPetThumbs(map);
      }
    }

    resolveThumbs();
    return () => {
      cancelled = true;
      // revoga objectURLs
      Object.values(petThumbs).forEach(({ avatarUrl, coverUrl }) => {
        [avatarUrl, coverUrl].forEach((u) => {
          if (u && typeof u === "string" && u.startsWith("blob:")) {
            try {
              URL.revokeObjectURL(u);
            } catch {}
          }
        });
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myPets.length]);

  const NavItem = ({ to, icon: Ico, label }) => {
    const active =
      to === "/"
        ? pathname === "/"
        : pathname === to || pathname.startsWith(to + "/");
    return (
      <Link
        to={to}
        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
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

  useLayoutEffect(() => {
    const el = railRef.current;
    if (!el) return;
    const check = () => setOverflow(el.scrollWidth > el.clientWidth);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    window.addEventListener("resize", check);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", check);
    };
  }, [myPets.length]);

  // avatar do usuário logado
  const userAvatar = user?.image || user?.photoURL || user?.avatar || "";

  const userName =
    user?.username ||
    user?.displayName ||
    user?.name ||
    user?.email ||
    "Usuário";

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
        style={{ transform: open ? "translateX(0)" : "translateX(-280px)" }}
      >
        <div className="flex h-full flex-col gap-6 p-4">
          {/* Logo / título */}
          <div className="px-1 text-lg font-semibold text-white">PataNet</div>

          {/* ===== Seus pets ===== */}
          {user && (
            <section className="mt-4">
              <div className="mb-2 text-xs font-semibold tracking-wide text-[var(--sidebar-fg)]/70">
                Seus pets
              </div>

              <div className="flex items-center gap-3">
                {/* Botão Novo Pet */}
                <Link
                  to="/pets/novo"
                  className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#f77904] text-white hover:opacity-90"
                  title="Adicionar pet"
                >
                  <Plus size={18} />
                </Link>

                {/* Trilho de avatares — HORIZONTAL */}
                <div className="flex-1 overflow-hidden">
                  <div
                    ref={railRef}
                    className="flex gap-3 overflow-x-auto overflow-y-hidden snap-x snap-mandatory scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-white/20"
                    data-overflow={overflow ? "true" : "false"}
                  >
                    {myPets.map((p) => {
                      const avatarUrl =
                        petThumbs[p.id]?.avatarUrl ||
                        p.avatar ||
                        p.cover ||
                        undefined;

                      return (
                        <Link
                          key={p.id}
                          to={`/pets/${p.id}`}
                          className="group relative shrink-0 snap-start"
                          title={p.name}
                        >
                          <AvatarCircle
                            src={avatarUrl || undefined}
                            alt={p.name}
                            size={48}
                            className="ring-1 ring-white/10 group-hover:ring-[#f77904]/60 transition"
                          />
                          <span className="pointer-events-none absolute -bottom-5 left-1/2 -translate-x-1/2 rounded bg-black/60 px-1.5 py-[2px] text-[10px] text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100">
                            {p.name}
                          </span>
                        </Link>
                      );
                    })}
                    {myPets.length === 0 && (
                      <span className="text-[11px] text-[var(--sidebar-fg)]/60">
                        Nenhum pet ainda
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Navegação principal */}
          <nav className="flex flex-col gap-1">
            <NavItem to="/" icon={HomeIcon} label="Página inicial" />
            <NavItem to="/pets" icon={PawPrint} label="Meus Pets" />
          </nav>

          <hr className="border-white/10" />

          {/* Navegação secundária */}
          <nav className="flex flex-col gap-1">
            <NavItem to="/perfil" icon={User} label="Perfil" />
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
              {/* Avatar do usuário (ou placeholder) */}
              <AvatarCircle
                src={user ? userAvatar || undefined : undefined}
                alt={userName}
                size={36}
                className="ring-1 ring-white/10"
              />

              <div className="flex-1">
                <div className="text-xs opacity-80">Olá</div>
                <div className="text-sm font-medium">
                  {user ? userName : "Visitante"}
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
