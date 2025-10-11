// src/components/SideBar.jsx
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useTheme } from "@/store/theme";
import {
  Home as HomeIcon,
  PawPrint,
  User,
  LogIn,
  LogOut,
  Plus,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

import Logo from "@/assets/logo.png"; // <- coloque sua logo em src/assets/logo.png
import { getMyProfile } from "@/api/user.api.js";
import { clearTokens } from "@/api/auth.api.js";
import { http } from "@/api/axios.js";
import AvatarCircle from "@/components/AvatarCircle";
import { fetchAnimalsByOwner } from "@/api/owner.api.js";

const SIDEBAR_W = 280;
const LS_KEY_SIDEBAR_OPEN = "patanet:sidebar-open";

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
        if (!cancelled) {
          try {
            clearTokens();
          } catch {}
          navigate("/auth", { replace: true });
        }
      } finally {
        if (!cancelled) setLoadingUser(false);
      }
    }
    fetchMe();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  // ==== PETS pela API ====
  const [myPets, setMyPets] = useState([]);
  const [petThumbs, setPetThumbs] = useState({}); // { [petId]: { avatarUrl, coverUrl } }
  const railRef = useRef(null);
  const [overflow, setOverflow] = useState(false);

  useEffect(() => {
    let cancel = false;
    async function loadPetsFromApi() {
      if (!user?.id) {
        setMyPets([]);
        return;
      }
      try {
        const resp = await fetchAnimalsByOwner({
          userId: user.id,
          page: 1,
          perPage: 100,
        });
        const list = Array.isArray(resp?.data)
          ? resp.data
          : Array.isArray(resp)
          ? resp
          : [];
        if (!cancel) setMyPets(list);
      } catch {
        if (!cancel) setMyPets([]);
      }
    }
    loadPetsFromApi();

    const onExternalUpdate = () => loadPetsFromApi();
    window.addEventListener("patanet:pets-updated", onExternalUpdate);
    return () => {
      cancel = true;
      window.removeEventListener("patanet:pets-updated", onExternalUpdate);
    };
  }, [user?.id]);

  useEffect(() => {
    const map = {};
    for (const p of myPets) {
      const avatarUrl =
        p?.image?.url ||
        p?.image ||
        p?.imageAvatar ||
        p?.avatar ||
        p?.imageCover ||
        "";
      const coverUrl = p?.imageCover?.url || p?.imageCover || p?.cover || "";
      map[p.id] = { avatarUrl, coverUrl };
    }
    setPetThumbs(map);
  }, [myPets]);

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

  // estado inicial e reação ao breakpoint (desktop: aberto e permanece até o usuário clicar)
  useLayoutEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const handle = () => {
      const md = mq.matches;
      setIsMdUp(md);
      if (md) {
        // ← lê o estado persistido; default = aberto
        const persisted = localStorage.getItem(LS_KEY_SIDEBAR_OPEN);
        const nextOpen = persisted == null ? true : persisted === "1";
        setOpen(nextOpen);
        applyContentSpacing(nextOpen, true);
      } else {
        setOpen(false);
        applyContentSpacing(false, false);
      }
    };
    handle();
    mq.addEventListener("change", handle);
    return () => mq.removeEventListener("change", handle);
  }, []);

  // evento global para abrir/fechar via botão externo (hambúrguer)
  useEffect(() => {
    const onToggle = () => {
      setOpen((v) => {
        const next = !v;
        applyContentSpacing(next, isMdUp);
        if (isMdUp) {
          localStorage.setItem(LS_KEY_SIDEBAR_OPEN, next ? "1" : "0");
        }
        return next;
      });
    };
    window.addEventListener("patanet:sidebar-toggle", onToggle);
    return () => window.removeEventListener("patanet:sidebar-toggle", onToggle);
  }, [isMdUp]);

  // FECHA ao mudar de rota no mobile; no desktop permanece como está
  useEffect(() => {
    const md = window.matchMedia("(min-width: 768px)").matches;
    if (!md) {
      setOpen(false);
      applyContentSpacing(false, false);
    }
  }, [pathname]);

  // Logout via API
  function logout() {
    try {
      clearTokens();
    } catch {}
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
              top: "calc(env(safe-area-inset-top, 0px) + 14px)",
            }}
            aria-label="Fechar menu"
            title="Fechar"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Logo (desktop) / título (mobile) */}
          <div className="px-1 mt-8 md:mt-0">
            <img
              src={Logo}
              alt="PataNet"
              className="hidden md:block mx-auto h-12 w-auto max-w-[200px]" // centralizada + maior
              draggable={false}
            />
            <div className="md:hidden text-lg font-semibold text-white">
              PataNet
            </div>
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
                        p?.image?.url ||
                        p?.image ||
                        p?.imageCover ||
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
                    ? user.username ||
                      user.displayName ||
                      user.name ||
                      user.email
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
              localStorage.setItem(LS_KEY_SIDEBAR_OPEN, next ? "1" : "0");
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
