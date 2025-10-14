// src/features/users/pages/UserProfile.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Lightbox from "@/components/Lightbox";
import {
  Edit3,
  Trash2,
  CalendarDays,
  PawPrint,
  ImagePlus,
  UserPlus,
  UserCheck,
  User as UserIcon,
  X,
} from "lucide-react";

import { getMyProfile, getUserProfile } from "@/api/user.api.js";
import { fetchAnimalsByOwner } from "@/api/owner.api.js";
import { fetchAnimalsById } from "@/api/animal.api.js";
import {
  followUser,
  unfollowUser,
  summaryUserConnections,
  userFolloweds, // ← Seguindo
  userFollowers, // ← Seguidores
} from "@/api/connection.api.ts.js";

/* --------------------------------- utils UI -------------------------------- */
function Avatar({ src, alt, size = 96, className = "", onClick }) {
  if (!src) {
    return (
      <div
        className={`rounded-full bg-zinc-300 dark:bg-zinc-700 ring-4 ring-black/10 dark:ring-white/10 ${className}`}
        style={{ width: size, height: size }}
        title={alt}
      >
        <div className="grid h-full w-full place-items-center text-[var(--chip-fg)]">
          <UserIcon className="h-7 w-7 opacity-60" />
        </div>
      </div>
    );
  }
  return (
    <img
      src={src || undefined}
      alt={alt}
      className={`rounded-full object-cover ring-4 ring-white shadow-lg dark:ring-zinc-900 ${className}`}
      style={{ width: size, height: size }}
      onClick={onClick}
    />
  );
}

const genderPt = (g) => {
  const v = String(g || "").toUpperCase();
  if (v === "MALE") return "Macho";
  if (v === "FEMALE") return "Fêmea";
  return "—";
};

const speciePt = (s) => {
  const v = String(s || "").toLowerCase();
  if (["cachorro", "cão", "cao", "dog", "canino"].includes(v)) return "Cão";
  if (["gato", "felino", "cat"].includes(v)) return "Gato";
  return v ? v.charAt(0).toUpperCase() + v.slice(1) : "—";
};

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("pt-BR") : "—";
function fmtMemberSince(u) {
  const ts = u?.createdAt;
  try {
    const d = ts ? new Date(ts) : new Date();
    return d.getFullYear();
  } catch {
    return "—";
  }
}

/* ---------------------------------- página --------------------------------- */
export default function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const isTogglingFollowRef = useRef(false);

  // quem sou eu (logado)
  const [me, setMe] = useState(null);
  const [loadingMe, setLoadingMe] = useState(true);

  // perfil visualizado
  const [viewedUser, setViewedUser] = useState(null);

  // mídia resolvida para exibição
  const [coverUrl, setCoverUrl] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // pets do usuário visualizado
  const [pets, setPets] = useState([]);
  const [petThumbs, setPetThumbs] = useState({});

  // conexões
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [iFollow, setIFollow] = useState(false);

  // lightbox
  const [lb, setLb] = useState({ open: false, slides: [], index: 0 });

  // --------- MODAIS Seguidores / Seguindo ----------
  const [openFollowers, setOpenFollowers] = useState(false);
  const [openFollowing, setOpenFollowing] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loadingModal, setLoadingModal] = useState(false);

  // carregar quem sou eu
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoadingMe(true);
        const u = await getMyProfile();
        if (!cancel) setMe(u || null);
      } catch {
        if (!cancel && !userId) navigate("/auth", { replace: true });
      } finally {
        if (!cancel) setLoadingMe(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [navigate, userId]);

  const currentId = me?.id || me?._id || me?.email || me?.username || null;
  const viewedParam = userId || currentId;

  // carregar perfil visualizado
  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!viewedParam) return;
      try {
        const isOwnParam =
          !!currentId && String(viewedParam) === String(currentId);
        let u = isOwnParam ? me : await getUserProfile({ id: viewedParam });
        if (!u && isOwnParam) u = me;
        if (!cancel) setViewedUser(u || null);
      } catch {
        if (!cancel) setViewedUser(null);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [viewedParam, currentId, me]);

  // id real do perfil visualizado
  const viewedRealId = viewedUser?.id || viewedUser?._id || null;
  const isOwn = !!(
    me?.id &&
    viewedRealId &&
    String(me.id) === String(viewedRealId)
  );

  // resolver avatar/capa
  useEffect(() => {
    const u = viewedUser || {};
    setCoverUrl(u?.imageCover || u?.cover || "");
    setAvatarUrl(u?.image || u?.avatar || "");
  }, [viewedUser]);

  // seguir / desseguir
  async function computeIFollow(viewedId, meId) {
    if (!viewedId || !meId) return false;
    try {
      const resp = await userFolloweds({ id: meId, page: 1, perPage: 1000 });
      const arr =
        (resp && Array.isArray(resp.data) && resp.data) ||
        (Array.isArray(resp) && resp) ||
        (resp && Array.isArray(resp.users) && resp.users) ||
        (resp && resp.results && Array.isArray(resp.results) && resp.results) ||
        [];
      return arr.some((u) => {
        const candIds = [
          u?.id,
          u?._id,
          u?.user?.id,
          u?.user?._id,
          u?.followed?.id,
          u?.followed?._id,
          u?.followedId,
        ]
          .filter(Boolean)
          .map(String);
        return candIds.includes(String(viewedId));
      });
    } catch {
      return false;
    }
  }

  const refetchConnections = useRef(null);
  useEffect(() => {
    let cancel = false;
    refetchConnections.current = async () => {
      if (!viewedRealId) return;
      try {
        const summary = await summaryUserConnections({ id: viewedRealId });
        const followers =
          summary?.follwers ??
          summary?.followers ??
          summary?.followersCount ??
          summary?.data?.followers ??
          0;

        const followeds =
          summary?.follweds ??
          summary?.followeds ??
          summary?.following ??
          summary?.followedsCount ??
          summary?.data?.followeds ??
          0;

        let amIFollowing =
          summary?.iFollow ?? summary?.amIFollowing ?? summary?.data?.iFollow;
        if (
          amIFollowing === undefined &&
          me?.id &&
          String(me.id) !== String(viewedRealId)
        ) {
          amIFollowing = await computeIFollow(viewedRealId, me.id);
        }

        if (!cancel) {
          setFollowersCount(Number(followers) || 0);
          setFollowingCount(Number(followeds) || 0);
          setIFollow(!!amIFollowing);
        }
      } catch {
        if (!cancel) {
          setFollowersCount(0);
          setFollowingCount(0);
          setIFollow(false);
        }
      }
    };
    refetchConnections.current();
    return () => {
      cancel = true;
    };
  }, [viewedRealId, me?.id]);

  // carregar pets do usuário visualizado
  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!viewedRealId) return;
      try {
        const resp = await fetchAnimalsByOwner({
          userId: viewedRealId,
          page: 1,
          perPage: 100,
        });
        const list = Array.isArray(resp?.data)
          ? resp.data
          : Array.isArray(resp)
          ? resp
          : [];
        if (cancel) return;
        setPets(
          list.map((p) => {
            const breedName = p?.breed?.name || "—";
            const breedImage = p?.breed?.image || "";
            const specieName =
              p?.breed?.specie?.name ||
              p?.specie?.name ||
              p?.species ||
              p?.specie ||
              "";
            return {
              id: p.id || p._id,
              name: p.name || "Sem nome",
              speciesLabel: speciePt(specieName),
              breedName,
              genderLabel: genderPt(p?.gender),
              birthday: p.birthday || p.birthDate || p.birthdate || "",
              weight: p.weight || 0,
              image: p.image?.url || p.image || breedImage || "",
              imageCover: p.imageCover?.url || p.imageCover || "",
              mediasCount: Number(p.mediasCount || p.mediaCount || 0),
              _breedImage: breedImage || "",
            };
          })
        );
      } catch {
        if (!cancel) setPets([]);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [viewedRealId]);

  // construir thumbs
  useEffect(() => {
    let cancel = false;
    (async () => {
      const map = {};
      for (const p of pets) {
        let avatarUrl = p.image || "";
        let coverUrl = p.imageCover || "";
        if (!avatarUrl || !coverUrl) {
          try {
            const pet = await fetchAnimalsById({ animalId: p.id });
            avatarUrl = avatarUrl || pet?.image?.url || pet?.image || "";
            coverUrl =
              coverUrl || pet?.imageCover?.url || pet?.imageCover || "";
          } catch {}
        }
        map[p.id] = { avatarUrl, coverUrl };
      }
      if (!cancel) setPetThumbs(map);
    })();
    return () => {
      cancel = true;
    };
  }, [pets]);

  const metrics = useMemo(() => {
    const totalPets = pets.length;
    const totalMedia = pets.reduce(
      (acc, p) => acc + (Number(p.mediasCount) || 0),
      0
    );
    return { totalPets, totalMedia };
  }, [pets]);

  const openLightbox = (slides, index = 0) =>
    setLb({ open: true, slides, index });

  const displayName =
    viewedUser?.name ||
    viewedUser?.displayName ||
    viewedUser?.username ||
    "Usuário";
  const displayUsername = viewedUser?.username
    ? `@${viewedUser.username}`
    : viewedUser?.email || "";

  // seguir / desseguir
  async function handleToggleFollow() {
    if (!me || isOwn || !viewedRealId) return;
    if (isTogglingFollowRef.current) return;
    isTogglingFollowRef.current = true;

    const prevIFollow = iFollow;
    const willFollow = !prevIFollow;

    setIFollow(willFollow);
    setFollowersCount((c) => Math.max(0, c + (willFollow ? 1 : -1)));

    try {
      if (prevIFollow) await unfollowUser({ id: viewedRealId });
      else await followUser({ id: viewedRealId });
      await refetchConnections.current?.();
    } catch {
      setIFollow(prevIFollow);
      setFollowersCount((c) => Math.max(0, c + (prevIFollow ? 1 : -1)));
    } finally {
      isTogglingFollowRef.current = false;
    }
  }

  // ---------- abrir modais ----------
  async function openFollowersModal() {
    if (!viewedRealId) return;
    try {
      setLoadingModal(true);
      setOpenFollowers(true);
      const resp = await userFollowers({
        id: viewedRealId,
        page: 1,
        perPage: 200,
      });
      const data =
        (resp && resp.data) ||
        (Array.isArray(resp) && resp) ||
        resp?.items ||
        [];
      setFollowers(data);
    } catch {
      setFollowers([]);
    } finally {
      setLoadingModal(false);
    }
  }

  async function openFollowingModal() {
    if (!viewedRealId) return;
    try {
      setLoadingModal(true);
      setOpenFollowing(true);
      const resp = await userFolloweds({
        id: viewedRealId,
        page: 1,
        perPage: 200,
      });
      const data =
        (resp && resp.data) ||
        (Array.isArray(resp) && resp) ||
        resp?.items ||
        [];
      setFollowing(data);
    } catch {
      setFollowing([]);
    } finally {
      setLoadingModal(false);
    }
  }

  if (loadingMe && !viewedRealId) {
    return (
      <div className="min-h-dvh w-full grid place-items-center">
        <div className="animate-pulse text-sm text-zinc-500 dark:text-zinc-400">
          Carregando…
        </div>
      </div>
    );
  }

  if (!viewedUser) {
    return (
      <div className="mx-auto w-full max-w-5xl p-4 md:p-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm opacity-70 dark:border-zinc-800 dark:bg-zinc-900">
          Usuário não encontrado.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl p-4 md:p-6">
      {/* HEADER */}
      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="relative h-56 w-full bg-gradient-to-r from-orange-300 to-rose-300 dark:from-orange-800 dark:to-rose-800 md:h-72">
          {coverUrl ? (
            <img
              src={coverUrl || undefined}
              alt="Capa do perfil"
              className="h-full w-full object-cover"
              onClick={() =>
                openLightbox(
                  [
                    {
                      id: "cover",
                      url: coverUrl,
                      title: viewedUser.username || viewedUser.name,
                    },
                  ],
                  0
                )
              }
            />
          ) : (
            <div className="h-full w-full" />
          )}

          <div className="absolute left-6 -bottom-12 z-10">
            <Avatar
              src={avatarUrl}
              alt={displayName}
              size={104}
              onClick={() =>
                avatarUrl &&
                openLightbox(
                  [
                    {
                      id: "avatar",
                      url: avatarUrl,
                      title: viewedUser.username || viewedUser.name,
                    },
                  ],
                  0
                )
              }
            />
          </div>
        </div>

        <div className="relative px-4 pb-4 pt-14 md:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-6">
            <div className="min-w-0">
              <div className="text-lg font-semibold leading-tight md:text-xl">
                {displayName}
              </div>
              <div className="text-xs text-zinc-500">{displayUsername}</div>
            </div>

            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Metric label="Pets" value={metrics.totalPets} />
              <Metric label="Mídias" value={metrics.totalMedia} />
              <Metric
                label="Seguidores"
                value={followersCount}
                onClick={openFollowersModal}
              />
              <Metric
                label="Seguindo"
                value={followingCount}
                onClick={openFollowingModal}
              />

              {!isOwn ? (
                <button
                  onClick={handleToggleFollow}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-white ${
                    iFollow
                      ? "bg-zinc-700 hover:bg-zinc-800"
                      : "bg-[#f77904] hover:opacity-90"
                  }`}
                >
                  {iFollow ? (
                    <UserCheck className="h-4 w-4" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  {iFollow ? "Seguindo" : "Seguir"}
                </button>
              ) : (
                <Link
                  to="/perfil/editar"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#f77904] px-3 py-1.5 text-xs font-semibold text-white"
                >
                  <Edit3 className="h-4 w-4" />
                  Editar perfil
                </Link>
              )}
            </div>
          </div>

          {/* bio / metadados */}
          <div className="mt-4 border-t border-zinc-200 pt-4 text-sm dark:border-zinc-800">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <div className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Sobre
                </div>
                <p className="whitespace-pre-wrap">
                  {String(viewedUser?.about || "").trim() || "Sem descrição."}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                  <CalendarDays className="h-4 w-4 opacity-70" />
                  <span>Membro desde {fmtMemberSince(viewedUser)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PETS */}
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 text-sm font-medium opacity-80">
            <PawPrint className="h-4 w-4" />
            Pets de {isOwn ? "você" : viewedUser.username || "usuário"}
          </div>
          {isOwn && (
            <Link
              to="/pets/novo"
              className="inline-flex items-center gap-2 rounded-lg bg-[#f77904] px-3 py-1.5 text-xs font-semibold text-white"
            >
              <ImagePlus className="h-4 w-4" /> Adicionar pet
            </Link>
          )}
        </div>

        {pets.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-white p-6 text-sm opacity-70 dark:border-zinc-800 dark:bg-zinc-900">
            Nenhum pet encontrado.
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pets.map((p) => {
              const cover = petThumbs[p.id]?.coverUrl || p._breedImage;
              const avatar = petThumbs[p.id]?.avatarUrl || p._breedImage;

              return (
                <li
                  key={p.id}
                  className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <Link to={`/pets/${p.id}`} className="block">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      {cover ? (
                        <img
                          src={cover || undefined}
                          alt={p.name}
                          className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.03]"
                          onClick={(e) => {
                            e.preventDefault();
                            openLightbox(
                              [
                                {
                                  id: p.id + "-cover",
                                  url: cover,
                                  title: p.name,
                                },
                              ],
                              0
                            );
                          }}
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-xs opacity-60">
                          sem capa
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="space-y-3 p-4">
                    <div className="flex items-start gap-3">
                      {avatar ? (
                        <img
                          src={avatar || undefined}
                          alt=""
                          className="h-12 w-12 rounded-full object-cover ring-2 ring-white dark:ring-zinc-900"
                          onClick={() =>
                            openLightbox(
                              [
                                {
                                  id: p.id + "-avatar",
                                  url: avatar,
                                  title: p.name,
                                },
                              ],
                              0
                            )
                          }
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-zinc-200 ring-2 ring-white dark:bg-zinc-800 dark:ring-zinc-900" />
                      )}

                      <div className="min-w-0">
                        <Link
                          to={`/pets/${p.id}`}
                          className="group inline-flex items-center gap-1"
                        >
                          <h3 className="truncate text-base font-semibold leading-5 group-hover:underline">
                            {p.name || "Sem nome"}
                          </h3>
                        </Link>
                        <p className="truncate text-xs opacity-70">
                          {p.speciesLabel} • {p.breedName} • {p.genderLabel}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-xs opacity-70">
                        Nasc. {fmtDate(p.birthday)} • {p.weight || 0} kg
                      </div>

                      {isOwn && (
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/pets/${p.id}/editar`}
                            title="Editar"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#f77904] text-white"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => {
                              if (window.confirm(`Remover "${p.name}"?`)) {
                                setPets((list) =>
                                  list.filter((x) => x.id !== p.id)
                                );
                              }
                            }}
                            title="Remover"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#f77904] text-white"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {lb.open && (
        <Lightbox
          open={lb.open}
          slides={lb.slides}
          index={lb.index}
          onIndexChange={(i) => setLb((s) => ({ ...s, index: i }))}
          onClose={() => setLb({ open: false, slides: [], index: 0 })}
        />
      )}

      {/* ----------------------------- MODAIS ------------------------------ */}
      <Modal
        open={openFollowers}
        title="Seguidores"
        onClose={() => setOpenFollowers(false)}
      >
        {loadingModal && (
          <div className="p-3 text-sm opacity-70">Carregando…</div>
        )}
        {!loadingModal && followers.length === 0 && (
          <div className="p-3 text-sm opacity-70">
            Nenhum seguidor por aqui.
          </div>
        )}
        <div className="grid gap-1">
          {followers.map((u) => (
            <PersonRow
              key={u.id || u.userId || u.username}
              user={u}
              onClick={() => {
                const target = `/usuario/${u.id || u.userId || u.username}`;
                setOpenFollowers(false); // fecha o modal
                setTimeout(() => navigate(target), 0); // navega em seguida
              }}
            />
          ))}
        </div>
      </Modal>

      <Modal
        open={openFollowing}
        title="Seguindo"
        onClose={() => setOpenFollowing(false)}
      >
        {loadingModal && (
          <div className="p-3 text-sm opacity-70">Carregando…</div>
        )}
        {!loadingModal && following.length === 0 && (
          <div className="p-3 text-sm opacity-70">
            Este usuário ainda não segue ninguém.
          </div>
        )}
        <div className="grid gap-1">
          {following.map((u) => (
            <PersonRow
              key={u.id || u.userId || u.username}
              user={u}
              onClick={() => {
                const target = `/usuario/${u.id || u.userId || u.username}`;
                setOpenFollowing(false); // fecha o modal
                setTimeout(() => navigate(target), 0); // navega em seguida
              }}
            />
          ))}
        </div>
      </Modal>
    </div>
  );
}

/* --------------------------------- helpers --------------------------------- */
function Metric({ label, value, onClick }) {
  const clickable = typeof onClick === "function";
  return (
    <div
      onClick={onClick}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      className={`rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-center text-xs dark:border-zinc-700 dark:bg-zinc-800 ${
        clickable
          ? "cursor-pointer hover:bg-black/5 dark:hover:bg-white/10"
          : ""
      }`}
      onKeyDown={(e) => {
        if (clickable && (e.key === "Enter" || e.key === " ")) onClick();
      }}
      title={clickable ? label : undefined}
    >
      <div className="font-semibold">{value}</div>
      <div className="opacity-70">{label}</div>
    </div>
  );
}

/* ------------------------------- Modal base -------------------------------- */
function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="absolute left-1/2 top-1/2 w-[min(680px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-black/10 bg-white shadow-xl dark:border-white/10 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-black/10 p-4 dark:border-white/10">
          <h3 className="text-base font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-3">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------- List item --------------------------------- */
function PersonRow({ user, onClick }) {
  const avatar =
    user?.image ||
    user?.avatar ||
    user?.photo ||
    user?.imageUrl ||
    "https://ui-avatars.com/api/?name=" +
      encodeURIComponent(user?.name || user?.username || "User");

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-black/5 dark:hover:bg-white/5"
      title={user?.name || user?.username}
    >
      <img
        src={avatar}
        alt={user?.name || user?.username}
        className="h-10 w-10 rounded-full object-cover"
      />
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium">
          {user?.name || user?.username}
        </span>
        {user?.username && (
          <span className="truncate text-xs opacity-70">@{user.username}</span>
        )}
      </div>
    </button>
  );
}
