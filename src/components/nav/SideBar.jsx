// src/components/SideBar.jsx
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useTheme } from "@/store/theme";
import {
  Home as HomeIcon,
  PawPrint,
  User,
  // Settings,
  LogIn,
  LogOut,
  Plus,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

import { getMyProfile } from "@/api/user.api.js";
import { clearTokens } from "@/api/auth.api.js";
import AvatarCircle from "@/components/AvatarCircle";
// Esses utilitários continuam opcionais — se mais tarde migrarmos pets para API, é só trocar aqui.
import { loadPets, mediaGetUrl } from "@/features/pets/services/petsStorage";

const SIDEBAR_W = 280;

export default function Sidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // não renderiza em rotas de auth
  if (/^\/(login|signup|auth)\b/.test(pathname)) return null;

  const theme = useTheme((s) => s.theme);
  const toggleTheme = useTheme((s) => s.toggle);

  const [open, setOpen] = useState(true);
  const [isMdUp, setIsMdUp] = useState(false);

  // ==== USER via API ====
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchMe() {
      try {
        setLoadingUser(true);
        const me = await getMyProfile();
        if (!cancelled) setUser(me || null);
      } catch (err) {
        // Se o token estiver inválido/expirado, limpa e vai pro auth.
        if (!cancelled) {
          try { clearTokens(); } catch {}
          navigate("/auth", { replace: true });
        }
      } finally {
        if (!cancelled) setLoadingUser(false);
      }
    }
    fetchMe();
    return () => { cancelled = true; };
  }, [navigate]);

  // ==== PETS (mantém a UI; a fonte pode ser trocada depois para a API) ====
  const [myPets, setMyPets] = useState([]);
  const [petThumbs, setPetThumbs] = useState({}); // { [petId]: { avatarUrl, coverUrl } }
  const railRef = useRef(null);
  const [overflow, setOverflow] = useState(false);

  const currentUserId = user?.id || user?.uid || user?.email || user?.username || null;

  useEffect(() => {
    const refresh = () => {
      const all = loadPets(); // se depois vier API, trocar essa linha
      const mine = currentUserId
        ? all.filter((p) => (p.ownerId || p.userId || p.createdBy) === currentUserId)
        : [];
      setMyPets(mine);
    };
    refresh();
    window.addEventListener("patanet:pets-updated", refresh);
    return () => window.removeEventListener("patanet:pets-updated", refresh);
  }, [currentUserId]);

  useEffect(() => {
    let cancelled = false;

    async function resolveThumbs() {
      const pairs = await Promise.all(
        (myPets || []).map(async (p) => {
          let coverUrl = p.cover || "";
          if (!coverUrl && p.coverId) {
            try { coverUrl = await mediaGetUrl(p.coverId); } catch { coverUrl = ""; }
          }
          let avatarUrl = p.avatar || "";
          if (!avatarUrl && p.avatarId) {
            try { avatarUrl = await mediaGetUrl(p.avatarId); } catch { avatarUrl = ""; }
          }
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
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myPets.length]);

  // ==== Layout e comportamento (inalterados visualmente) ====
  function applyContentSpacing(nextOpen, mdUp) {
    const ml = nextOpen && mdUp ? `${SIDEBAR_W}px` : "0px";
    document.documentElement.style.setProperty("--sidebar-ml", ml);
  }

  const closeIfMobile = () => {
    if (!isMdUp) {
      setOpen(false);
      applyContentSpacing(false, false);
    }
  };

  // estado inicial e reação ao breakpoint (sem persistir em localStorage)
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const handle = () => {
      const md = mq.matches;
      setIsMdUp(md);
      if (md) {
        setOpen(true); // desktop: aberto por padrão
        applyContentSpacing(true, true);
      } else {
        setOpen(false); // mobile: fechado por padrão
        applyContentSpacing(false, false);
      }
    };
    handle();
    mq.addEventListener("change", handle);
    return () => mq.removeEventListener("change", handle);
  }, []);

  // evento global para abrir/fechar via botão de hambúrguer (caso exista)
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

  // FECHA ao mudar de rota no mobile
  useEffect(() => {
    if (!isMdUp) {
      setOpen(false);
      applyContentSpacing(false, false);
    }
  }, [pathname, isMdUp]);

  // Logout via API
  function logout() {
    try { clearTokens(); } catch {}
    window.dispatchEvent(new CustomEvent("patanet:auth-updated"));
    navigate("/auth", { replace: true });
  }

  const NavItem = ({ to, icon: Ico, label }) => {
    const active =
      to === "/"
        ? pathname === "/"
        : pathname === to || pathname.startsWith(to + "/");
    return (
      <Link
        to={to}
        onClick={closeIfMobile}
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
        <div className="relative flex h-full flex-col gap-6 p-4">
          {/* Botão FECHAR no mobile (posicionado abaixo da status bar) */}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              applyContentSpacing(false, false);
            }}
            className="md:hidden absolute right-3 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm"
            style={{
              top: "calc(env(safe-area-inset-top, 0px) + 14px)", // desce o botão
            }}
            aria-label="Fechar menu"
            title="Fechar"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Logo / título */}
          <div className="px-1 text-lg font-semibold text-white mt-8 md:mt-0">
            PataNet
          </div>

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
                  onClick={closeIfMobile}
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
                          onClick={closeIfMobile}
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
            {/* <NavItem
              to="/dashboard/configuracoes"
              icon={Settings}
              label="Configurações"
            /> */}
          </nav>

          <div className="mt-auto" />

          {/* Rodapé da sidebar */}
          <div className="rounded-xl bg-[#606873] p-3 text-white">
            <div className="flex items-center gap-3">
              <AvatarCircle
                src={user ? userAvatarOrFallback(user) : undefined}
                alt={user?.username || user?.name || "Usuário"}
                size={36}
                className="ring-1 ring-white/10"
              />

              <div className="flex-1">
                <div className="text-xs opacity-80">Olá</div>
                <div className="text-sm font-medium">
                  {user
                    ? user.username || user.displayName || user.name || user.email
                    : "Visitante"}
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
                  onClick={() => {
                    logout();
                    closeIfMobile();
                  }}
                  className="inline-flex h-8 items-center gap-1 rounded-md bg-white/10 px-2 text-xs"
                  title="Sair"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sair
                </button>
              ) : (
                <Link
                  to="/auth"
                  onClick={closeIfMobile}
                  className="inline-flex h-8 items-center gap-1 rounded-md bg-white/10 px-2 text-xs"
                  title="Entrar"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Entrar
                </Link>
              )}
            </div>
          </div>

          {/* Botão retrair/expandir no DESKTOP */}
          <button
            type="button"
            onClick={() => {
              const next = !open;
              setOpen(next);
              applyContentSpacing(next, true);
              // sem persistência em localStorage
            }}
            className="hidden md:flex absolute -right-3 top-10 h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-[var(--sidebar-bg)] text-[var(--sidebar-fg)] shadow transition-opacity hover:opacity-100"
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

/* Helpers */
function userAvatarOrFallback(user) {
  return user?.image || user?.photoURL || user?.avatar || "";
}
