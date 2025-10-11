// src/features/users/pages/UserProfile.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Lightbox from "@/components/Lightbox";
import {
  Camera,
  Edit3,
  Trash2,
  Link as LinkIcon,
  MapPin,
  CalendarDays,
  PawPrint,
  ImagePlus,
  UserPlus,
  UserCheck,
  User as UserIcon,
} from "lucide-react";

import { getMyProfile, getUserProfile } from "@/api/user.api.js";
import { http } from "@/api/axios.js";
import { fetchAnimalsById } from "@/api/animal.api.js";
import {
  followUser,
  unfollowUser,
  summaryUserConnections,
} from "@/api/connection.api.ts.js";

/* --------------------------------- utils UI -------------------------------- */
function Avatar({ src, alt, size = 96, className = "" }) {
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
    />
  );
}

const title = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "—");
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("pt-BR") : "—");
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

  // quem sou eu (logado)
  const [me, setMe] = useState(null);
  const [loadingMe, setLoadingMe] = useState(true);

  // perfil visualizado
  const [viewedUser, setViewedUser] = useState(null);

  // mídia resolvida para exibição
  const [coverUrl, setCoverUrl] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // campos “legados” só para manter layout (sem storage)
  const [profileExtras, setProfileExtras] = useState({
    website: "",
    location: "",
    bioLegacy: "",
  });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profileExtras);
  useEffect(() => setDraft(profileExtras), [profileExtras]);

  // pets do usuário visualizado
  const [pets, setPets] = useState([]);
  const [petThumbs, setPetThumbs] = useState({});

  // conexões
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [iFollow, setIFollow] = useState(false);

  // lightbox
  const [lb, setLb] = useState({ open: false, slides: [], index: 0 });

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
  const viewedId = userId || currentId;
  const isOwn = !!currentId && String(viewedId) === String(currentId);

  // carregar perfil visualizado
  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!viewedId) return;
      try {
        let u = isOwn ? me : await getUserProfile({ id: viewedId });
        if (!u && isOwn) u = me;
        if (!cancel) setViewedUser(u || null);
      } catch {
        if (!cancel) setViewedUser(null);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [viewedId, isOwn, me]);

  // resolver avatar/capa a partir do perfil
  useEffect(() => {
    const u = viewedUser || {};
    const cover = u?.imageCover || u?.cover || "";
    const avatar = u?.image || u?.avatar || "";
    setCoverUrl(cover || "");
    setAvatarUrl(avatar || "");
  }, [viewedUser]);

  // resumo de conexões (seguidores/seguidos + se eu sigo)
  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!viewedId) return;
      try {
        const summary = await summaryUserConnections({ id: viewedId });
        // tentativas de leitura tolerantes ao shape
        const followers =
          summary?.followers ??
          summary?.followersCount ??
          summary?.data?.followers ??
          0;
        const followeds =
          summary?.followeds ??
          summary?.following ??
          summary?.followedsCount ??
          summary?.data?.followeds ??
          0;
        const amIFollowing =
          summary?.iFollow ??
          summary?.amIFollowing ??
          summary?.data?.iFollow ??
          false;

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
    })();
    return () => {
      cancel = true;
    };
  }, [viewedId]);

  // carregar pets do usuário visualizado (lista)
  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!viewedId) return;
      try {
        // Lista por usuário – mantém fallback direto
        const { data } = await http.get(`/animals/user/${viewedId}`);
        if (cancel) return;
        const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        setPets(
          list.map((p) => ({
            id: p.id || p._id,
            name: p.name || "Sem nome",
            species: p.species || "",
            breed: p.breed || "",
            gender: p.gender || "",
            birthday: p.birthday || p.birthDate || p.birthdate || "",
            weight: p.weight || 0,
            image: p.image?.url || p.image || "",
            imageCover: p.imageCover?.url || p.imageCover || "",
          }))
        );
      } catch {
        if (!cancel) setPets([]);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [viewedId]);

  // construir thumbs (com fetch individual se necessário)
  useEffect(() => {
    let cancel = false;
    (async () => {
      const map = {};
      for (const p of pets) {
        let avatarUrl = p.image || "";
        let coverUrl = p.imageCover || "";
        if (!avatarUrl || !coverUrl) {
          try {
            // resolve com fetch individual quando algo vier faltando
            const pet = await fetchAnimalsById({ animalId: p.id });
            avatarUrl = avatarUrl || pet?.image?.url || pet?.image || "";
            coverUrl = coverUrl || pet?.imageCover?.url || pet?.imageCover || "";
          } catch {
            // ignora
          }
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
    const totalMedia = 0; // manter como 0 até termos endpoint de contagem
    return { totalPets, totalMedia };
  }, [pets]);

  const openLightbox = (slides, index = 0) =>
    setLb({ open: true, slides, index });

  const fileRef = useRef(null);
  const onPickCover = async (e) => {
    // Mantém o fluxo/visual do botão; sem persistência local aqui.
    e.target.value = "";
  };

  const displayName =
    viewedUser?.name || viewedUser?.displayName || viewedUser?.username || "Usuário";
  const displayUsername = viewedUser?.username
    ? `@${viewedUser.username}`
    : viewedUser?.email || "";

  // seguir / desseguir
  async function handleToggleFollow() {
    if (!me || isOwn || !viewedId) return;
    const prevIFollow = iFollow;
    const delta = prevIFollow ? -1 : 1;
    // optimistic
    setIFollow(!prevIFollow);
    setFollowersCount((c) => Math.max(0, c + delta));
    try {
      if (prevIFollow) {
        await unfollowUser({ id: viewedId });
      } else {
        await followUser({ id: viewedId });
      }
    } catch {
      // rollback
      setIFollow(prevIFollow);
      setFollowersCount((c) => Math.max(0, c - delta));
    }
  }

  if (loadingMe && !viewedId) {
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
                  [{ id: "cover", url: coverUrl, title: viewedUser.username || viewedUser.name }],
                  0
                )
              }
            />
          ) : (
            <div className="h-full w-full" />
          )}

          {isOwn && (
            <button
              className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-xs text-white backdrop-blur hover:bg-black/70"
              onClick={() => fileRef.current?.click()}
              title="Alterar capa do perfil"
            >
              <Camera className="h-4 w-4" /> Alterar capa
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickCover} />

          <div className="absolute left-6 -bottom-12 z-10">
            <Avatar src={avatarUrl} alt={displayName} size={104} />
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
              <Metric label="Seguidores" value={followersCount} />
              <Metric label="Seguindo" value={followingCount} />

              {!isOwn ? (
                <button
                  onClick={handleToggleFollow}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-white ${
                    iFollow ? "bg-zinc-700 hover:bg-zinc-800" : "bg-[#f77904] hover:opacity-90"
                  }`}
                >
                  {iFollow ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
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

          {/* bio / website / location – mantém layout; bio usa API (about) */}
          <div className="mt-4 border-t border-zinc-200 pt-4 text-sm dark:border-zinc-800">
            {!editing ? (
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
                  {/* <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                    <MapPin className="h-4 w-4 opacity-70" />
                    <span className="truncate">{profileExtras.location || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                    <LinkIcon className="h-4 w-4 opacity-70" />
                    {profileExtras.website ? (
                      <a
                        href={profileExtras.website}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {profileExtras.website}
                      </a>
                    ) : (
                      <span>—</span>
                    )}
                  </div> */}
                  <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                    <CalendarDays className="h-4 w-4 opacity-70" />
                    <span>Membro desde {fmtMemberSince(viewedUser)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <form
                className="grid gap-3 md:grid-cols-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  setEditing(false);
                  setProfileExtras(draft);
                }}
              >
                {/* Mantém edição visual local de website/location para não quebrar layout */}
                {/* <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Sobre 
                  </label>
                  <textarea
                    className="w-full rounded-lg border border-zinc-200 bg-white p-2 outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-900"
                    rows={3}
                    maxLength={280}
                    value={draft.bioLegacy}
                    onChange={(e) => setDraft((d) => ({ ...d, bioLegacy: e.target.value }))}
                  />
                </div> */}

                {/* <div className="space-y-2">
                  <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Localização
                  </label>
                  <input
                    type="text"
                    className="mb-2 w-full rounded-lg border border-zinc-200 bg-white p-2 text-sm outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-900"
                    value={draft.location}
                    onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))}
                  />
                  <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Website
                  </label>
                  <input
                    type="url"
                    className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-sm outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-900"
                    placeholder="https://…"
                    value={draft.website}
                    onChange={(e) => setDraft((d) => ({ ...d, website: e.target.value }))}
                  />
                </div> */}

                {/* <div className="md:col-span-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs dark:border-zinc-700"
                    onClick={() => {
                      setEditing(false);
                      setDraft(profileExtras);
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-[#f77904] px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Salvar
                  </button>
                </div> */}
              </form>
            )}

            {/* {isOwn && !editing && (
              <div className="mt-3 flex justify-end">
                <button
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs dark:border-zinc-700"
                  onClick={() => setEditing(true)}
                >
                  <Edit3 className="h-4 w-4" /> Editar seção “Sobre”
                </button>
              </div>
            )} */}
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
              const cover = petThumbs[p.id]?.coverUrl || "";
              const avatar = petThumbs[p.id]?.avatarUrl || "";

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
                            openLightbox([{ id: p.id + "-cover", url: cover, title: p.name }], 0);
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
                            openLightbox([{ id: p.id + "-avatar", url: avatar, title: p.name }], 0)
                          }
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-zinc-200 ring-2 ring-white dark:bg-zinc-800 dark:ring-zinc-900" />
                      )}

                      <div className="min-w-0">
                        <Link to={`/pets/${p.id}`} className="group inline-flex items-center gap-1">
                          <h3 className="truncate text-base font-semibold leading-5 group-hover:underline">
                            {p.name || "Sem nome"}
                          </h3>
                        </Link>
                        <p className="truncate text-xs opacity-70">
                          {title(p.species)} • {title(p.breed)} • {title(p.gender)}
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
                                // Sem endpoint de remoção aqui para lista do usuário; visual rápido
                                setPets((list) => list.filter((x) => x.id !== p.id));
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
    </div>
  );
}

/* --------------------------------- helpers --------------------------------- */
function Metric({ label, value }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-center text-xs dark:border-zinc-700 dark:bg-zinc-800">
      <div className="font-semibold">{value}</div>
      <div className="opacity-70">{label}</div>
    </div>
  );
}
