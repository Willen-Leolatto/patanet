// src/features/users/pages/UserProfile.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "@/store/auth";
import {
  getUserById as getUserCatalogById,
  countFollowers,
  countFollowing,
  isFollowing,
  toggleFollow,
  upsertUser as upsertCatalogUser,
} from "@/features/users/services/userStorage";
import { getUserById as getAuthUserById } from "@/features/auth/services/authStorage";
import {
  loadPets,
  removePet,
  mediaGetUrl, // <-- resolve avatarId/coverId
} from "@/features/pets/services/petsStorage";
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
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Perfil visual (capa/bio/site/local)                                        */
/* -------------------------------------------------------------------------- */
const PROFILE_KEY = "patanet_user_profiles";
function readProfiles() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}");
  } catch {
    return {};
  }
}
function writeProfiles(map) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(map || {}));
}
function getProfile(uid) {
  const map = readProfiles();
  return map[uid] || { cover: "", bio: "", website: "", location: "" };
}
function patchProfile(uid, patch) {
  const map = readProfiles();
  map[uid] = { ...(map[uid] || {}), ...(patch || {}) };
  writeProfiles(map);
}

/* --------------------------------- utils UI -------------------------------- */
function Avatar({ src, alt, size = 96, className = "" }) {
  if (!src) {
    return (
      <div
        className={`rounded-full bg-zinc-300 dark:bg-zinc-700 ring-4 ring-black/10 dark:ring-white/10 ${className}`}
        style={{ width: size, height: size }}
        title={alt}
      />
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
const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("pt-BR") : "—";

/* ---------------------------------- página --------------------------------- */
export default function UserProfile() {
  const { userId } = useParams(); // /perfil/:userId? — vazio => meu perfil

  const authUser = useAuth((s) => s.user);
  const currentId =
    authUser?.id ||
    authUser?.uid ||
    authUser?.email ||
    authUser?.username ||
    null;
  const viewedId = userId || currentId;

  const isOwn = !!currentId && String(viewedId) === String(currentId);

  // dados do usuário a ser exibido
  const [viewedUser, setViewedUser] = useState(null);

  useEffect(() => {
    if (!viewedId) return;

    if (isOwn) {
      setViewedUser({
        id: currentId,
        name: authUser?.name || authUser?.displayName || "",
        username: authUser?.username || "",
        email: authUser?.email || "",
        image: authUser?.image || authUser?.avatar || authUser?.photoURL || "",
        createdAt: authUser?.createdAt || Date.now(),
      });
    } else {
      // 1) tenta catálogo (userStorage)
      let u = getUserCatalogById?.(viewedId);
      // 2) fallback para authStorage (usuários antigos)
      if (!u) {
        u = getAuthUserById?.(viewedId);
        // se achou no auth e não existe no catálogo, sincroniza agora
        if (u) {
          try {
            upsertCatalogUser({
              id: u.id || u.uid || u.email || u.username,
              name: u.name || u.displayName || "",
              username: u.username || "",
              email: u.email || "",
              image: u.image || u.avatar || u.photoURL || "",
              createdAt: u.createdAt || Date.now(),
            });
          } catch {}
        }
      }
      setViewedUser(
        u
          ? {
              id: u.id || u.uid || viewedId,
              name: u.name || u.displayName || "",
              username: u.username || "",
              email: u.email || "",
              image: u.image || u.avatar || u.photoURL || "",
              createdAt: u.createdAt || Date.now(),
            }
          : {
              id: viewedId,
              name: "",
              username: "",
              email: "",
              image: "",
              createdAt: Date.now(),
            }
      );
    }
  }, [isOwn, viewedId, currentId, authUser]);

  const fixedUser = viewedUser || { id: viewedId, username: "" };

  // perfil visual
  const [profile, setProfile] = useState(getProfile(viewedId));
  useEffect(() => {
    setProfile(getProfile(viewedId));
  }, [viewedId]);

  // pets do usuário
  const [pets, setPets] = useState([]);
  useEffect(() => {
    const refresh = () => {
      const all = loadPets() || [];
      const mine = all.filter((p) => (p.ownerId || p.userId || p.createdBy) === viewedId);
      setPets(mine);
    };
    refresh();
    window.addEventListener("patanet:pets-updated", refresh);
    return () => window.removeEventListener("patanet:pets-updated", refresh);
  }, [viewedId]);

  // URLs resolvidas para avatar/capa de cada pet
  const [petThumbs, setPetThumbs] = useState({}); // { [petId]: { coverUrl, avatarUrl } }
  useEffect(() => {
    let cancelled = false;
    async function resolveAll() {
      const pairs = await Promise.all(
        (pets || []).map(async (p) => {
          // COVER
          let coverUrl = p.cover || "";
          if (!coverUrl && p.coverId) {
            try {
              coverUrl = await mediaGetUrl(p.coverId);
            } catch {
              coverUrl = "";
            }
          }
          // AVATAR (fallback para cover)
          let avatarUrl = p.avatar || "";
          if (!avatarUrl && p.avatarId) {
            try {
              avatarUrl = await mediaGetUrl(p.avatarId);
            } catch {
              avatarUrl = "";
            }
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
    resolveAll();
    return () => {
      cancelled = true;
      // revoga objectURLs
      Object.values(petThumbs).forEach(({ coverUrl, avatarUrl }) => {
        [coverUrl, avatarUrl].forEach((u) => {
          if (u && typeof u === "string" && u.startsWith("blob:")) {
            try {
              URL.revokeObjectURL(u);
            } catch {}
          }
        });
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pets.length]);

  // followers/following (contadores reativos)
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [iFollow, setIFollow] = useState(false);
  const refreshFollows = () => {
    setFollowersCount(countFollowers(viewedId));
    setFollowingCount(countFollowing(viewedId));
    setIFollow(!!(currentId && !isOwn && isFollowing(currentId, viewedId)));
  };
  useEffect(() => {
    refreshFollows();
    const h = () => refreshFollows();
    window.addEventListener("patanet:follows-updated", h);
    return () => window.removeEventListener("patanet:follows-updated", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewedId, currentId, isOwn]);

  // lightbox
  const [lb, setLb] = useState({ open: false, slides: [], index: 0 });

  // edição de capa
  const fileRef = useRef(null);
  const onPickCover = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const dataUrl = await readAsDataURL(f);
    setProfile((p) => ({ ...p, cover: dataUrl }));
    patchProfile(viewedId, { cover: dataUrl });
    e.target.value = "";
  };

  // editar bio/site/local
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);
  useEffect(() => setDraft(profile), [profile]);
  const saveProfile = () => {
    setEditing(false);
    setProfile(draft);
    patchProfile(viewedId, draft);
  };

  // métricas simples
  const metrics = useMemo(() => {
    const totalPets = pets.length;
    const totalMedia = pets.reduce(
      (acc, p) => acc + (Array.isArray(p.media) ? p.media.length : 0),
      0
    );
    return { totalPets, totalMedia };
  }, [pets]);

  // ações
  const handleRemovePet = (pet) => {
    if (!isOwn || !pet?.id) return;
    if (!window.confirm(`Remover "${pet.name}"?`)) return;
    removePet(pet.id);
    setPets((list) => list.filter((x) => x.id !== pet.id));
  };
  const toggleFollowAction = () => {
    if (!currentId || isOwn) return;
    toggleFollow(currentId, viewedId);
    refreshFollows();
  };

  // helpers
  const openLightbox = (slides, index = 0) =>
    setLb({ open: true, slides, index });

  return (
    <div className="mx-auto w-full max-w-5xl p-4 md:p-6">
      {/* HEADER */}
      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {/* Capa maior */}
        <div className="relative h-56 w-full bg-gradient-to-r from-orange-300 to-rose-300 dark:from-orange-800 dark:to-rose-800 md:h-72">
          {profile.cover && (
            <img
              src={profile.cover || undefined}
              alt="Capa do perfil"
              className="h-full w-full object-cover"
              onClick={() =>
                openLightbox(
                  [
                    {
                      id: "cover",
                      url: profile.cover,
                      title: fixedUser.username || fixedUser.name,
                    },
                  ],
                  0
                )
              }
            />
          )}

          {/* Botão de alterar capa (apenas no próprio) */}
          {isOwn && (
            <button
              className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-xs text-white backdrop-blur hover:bg-black/70"
              onClick={() => fileRef.current?.click()}
              title="Alterar capa do perfil"
            >
              <Camera className="h-4 w-4" /> Alterar capa
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPickCover}
          />

          {/* Avatar sobreposto à capa */}
          <div className="absolute left-6 -bottom-12 z-10">
            <Avatar
              src={fixedUser.image}
              alt={fixedUser.username || fixedUser.name || "Usuário"}
              size={104}
            />
          </div>
        </div>

        {/* Barra inferior do header */}
        <div className="relative px-4 pb-4 pt-14 md:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-6">
            <div className="min-w-0">
              <div className="text-lg font-semibold leading-tight md:text-xl">
                {fixedUser.name || fixedUser.username || "Usuário"}
              </div>
              <div className="text-xs text-zinc-500">
                {fixedUser.username ? `@${fixedUser.username}` : fixedUser.email}
              </div>
            </div>

            {/* métricas + ações */}
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Metric label="Pets" value={metrics.totalPets} />
              <Metric label="Mídias" value={metrics.totalMedia} />
              <Metric label="Seguidores" value={followersCount} />
              <Metric label="Seguindo" value={followingCount} />

              {!isOwn ? (
                <button
                  onClick={toggleFollowAction}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-white ${
                    iFollow ? "bg-zinc-700 hover:bg-zinc-800" : "bg-[#f77904] hover:opacity-90"
                  }`}
                >
                  {iFollow ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                  {iFollow ? "Seguindo" : "Seguir"}
                </button>
              ) : (
                <Link
                  to="/dashboard/configuracoes"
                  className="rounded-lg bg-[#f77904] px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Configurar conta
                </Link>
              )}
            </div>
          </div>

          {/* bio / website / location */}
          <div className="mt-4 border-t border-zinc-200 pt-4 text-sm dark:border-zinc-800">
            {!editing ? (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="md:col-span-2">
                  <div className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Sobre
                  </div>
                  <p className="whitespace-pre-wrap">
                    {profile.bio?.trim() ? profile.bio : "Sem descrição."}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                    <MapPin className="h-4 w-4 opacity-70" />
                    <span className="truncate">{profile.location || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                    <LinkIcon className="h-4 w-4 opacity-70" />
                    {profile.website ? (
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {profile.website}
                      </a>
                    ) : (
                      <span>—</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                    <CalendarDays className="h-4 w-4 opacity-70" />
                    <span>Membro desde {fmtMemberSince(fixedUser)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <form
                className="grid gap-3 md:grid-cols-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  saveProfile();
                }}
              >
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Sobre
                  </label>
                  <textarea
                    className="w-full rounded-lg border border-zinc-200 bg-white p-2 outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-900"
                    rows={3}
                    maxLength={280}
                    value={draft.bio}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, bio: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Localização
                  </label>
                  <input
                    type="text"
                    className="mb-2 w-full rounded-lg border border-zinc-200 bg-white p-2 text-sm outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-900"
                    value={draft.location}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, location: e.target.value }))
                    }
                  />
                  <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Website
                  </label>
                  <input
                    type="url"
                    className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-sm outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-900"
                    placeholder="https://…"
                    value={draft.website}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, website: e.target.value }))
                    }
                  />
                </div>

                <div className="md:col-span-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs dark:border-zinc-700"
                    onClick={() => {
                      setEditing(false);
                      setDraft(profile);
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
                </div>
              </form>
            )}

            {isOwn && !editing && (
              <div className="mt-3 flex justify-end">
                <button
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs dark:border-zinc-700"
                  onClick={() => setEditing(true)}
                >
                  <Edit3 className="h-4 w-4" /> Editar perfil
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* PETS desse usuário */}
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 text-sm font-medium opacity-80">
            <PawPrint className="h-4 w-4" />
            Pets de {isOwn ? "você" : fixedUser.username || "usuário"}
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
              const coverUrl = petThumbs[p.id]?.coverUrl || "";
              const avatarUrl = petThumbs[p.id]?.avatarUrl || "";

              return (
                <li
                  key={p.id}
                  className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <Link to={`/pets/${p.id}`} className="block">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      {coverUrl ? (
                        <img
                          src={coverUrl || undefined}
                          alt={p.name}
                          className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.03]"
                          onClick={(e) => {
                            e.preventDefault();
                            openLightbox(
                              [
                                {
                                  id: p.id + "-cover",
                                  url: coverUrl,
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
                      {avatarUrl ? (
                        <img
                          src={avatarUrl || undefined}
                          alt=""
                          className="h-12 w-12 rounded-full object-cover ring-2 ring-white dark:ring-zinc-900"
                          onClick={() =>
                            openLightbox(
                              [
                                {
                                  id: p.id + "-avatar",
                                  url: avatarUrl,
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
                            onClick={() => handleRemovePet(p)}
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

      {/* LIGHTBOX */}
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
function fmtMemberSince(u) {
  const ts = u?.createdAt;
  try {
    const d = ts ? new Date(ts) : new Date();
    return d.getFullYear();
  } catch {
    return "—";
  }
}
function readAsDataURL(file) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });
}
