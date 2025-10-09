import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Camera,
  Image as ImageIcon,
  User2,
  Save,
  X,
  ChevronLeft,
  AlertTriangle,
  Info,
} from "lucide-react";

import { useAuth } from "@/store/auth";
import { useToast } from "@/components/ui/ToastProvider";
import { registerBackHandler } from "@/layouts/AppShell";

// usamos o mesmo pipeline de mídia dos pets (IndexedDB)
import {
  mediaSaveBlob,
  mediaGetUrl,
} from "@/features/pets/services/petsStorage";

// userStorage existente
import { getUserById, updateUser } from "@/features/users/services/userStorage";

/* ----------------------------------------------------------------------------
 * SETTINGS (fallback localStorage)
 * --------------------------------------------------------------------------*/
const SETTINGS_KEY = "patanet_user_settings";

function readAllSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
  } catch {
    return {};
  }
}
function readUserSettings(userId) {
  const all = readAllSettings();
  return all?.[userId] || {};
}
function writeUserSettings(userId, patch) {
  const all = readAllSettings();
  all[userId] = { ...(all[userId] || {}), ...(patch || {}) };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(all));
}

/* ----------------------------------------------------------------------------
 * Helpers de imagem
 * --------------------------------------------------------------------------*/
const readAsDataURL = (file) =>
  new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });

async function makePreviewDataURL(file, target = 256) {
  const dataUrl = await readAsDataURL(file);
  const img = new Image();
  await new Promise((r, e) => {
    img.onload = r;
    img.onerror = e;
    img.src = dataUrl;
  });

  const scale = Math.min(1, target / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);

  return canvas.toDataURL("image/webp", 0.85);
}

async function fileToCompressedBlob(file, maxSide = 1400, quality = 0.72) {
  const dataUrl = await readAsDataURL(file);
  const img = new Image();
  await new Promise((r, e) => {
    img.onload = r;
    img.onerror = e;
    img.src = dataUrl;
  });

  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);

  let blob = await new Promise((res) =>
    canvas.toBlob((b) => res(b), "image/webp", quality)
  );
  if (!blob) {
    blob = await new Promise((res) =>
      canvas.toBlob((b) => res(b), "image/jpeg", quality)
    );
  }
  return blob;
}

/* ----------------------------------------------------------------------------
 * Página
 * --------------------------------------------------------------------------*/
export default function UserEdit() {
  const navigate = useNavigate();
  const toast = useToast();

  const authUser = useAuth((s) => s.user);
  const setAuthUser = useAuth((s) => s.setUser); // se existir no seu store
  const isAuthenticated = !!authUser?.id;

  // Proteção simples
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const userId = authUser?.id;

  // refs para inputs de arquivo (avatar/capa)
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  // estado base (perfil + settings)
  const [loading, setLoading] = useState(true);
  const [initialHash, setInitialHash] = useState("");

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState(""); // somente leitura por enquanto

  const [avatar, setAvatar] = useState(""); // preview dataURL (compat Sidebar)
  const [avatarId, setAvatarId] = useState(""); // id no IndexedDB (futuro)
  const [cover, setCover] = useState(""); // preview dataURL
  const [coverId, setCoverId] = useState("");

  // settings
  const [feedFollowsFirst, setFeedFollowsFirst] = useState(true);
  const [vaccineWarnDays, setVaccineWarnDays] = useState(7);

  // para confirmar saída sem salvar
  const dirty = useMemo(() => {
    const current = JSON.stringify({
      name,
      username,
      bio,
      email,
      avatar,
      avatarId,
      cover,
      coverId,
      feedFollowsFirst,
      vaccineWarnDays,
    });
    return current !== initialHash;
  }, [
    name,
    username,
    bio,
    email,
    avatar,
    avatarId,
    cover,
    coverId,
    feedFollowsFirst,
    vaccineWarnDays,
    initialHash,
  ]);

  // Registrar back handler para confirmar saída se houver alterações
  useEffect(() => {
    if (!dirty) return;
    const unregister = registerBackHandler(() => {
      if (!dirty) return false;
      const leave = window.confirm(
        "Existem alterações não salvas. Deseja descartá-las e sair?"
      );
      if (leave) {
        navigate(-1);
        return true;
      }
      return true; // tratou mesmo que escolha ficar
    });
    return unregister;
  }, [dirty, navigate]);

  // Carregar dados atuais
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const u = getUserById?.(userId) || authUser || {};
        const s = readUserSettings(userId) || {};

        // ------- Avatar preview com fallbacks robustos -------
        let avatarPreview =
          (u && typeof u.avatar === "string" && u.avatar) ||
          (authUser && typeof authUser.avatar === "string" && authUser.avatar) ||
          (u && typeof u.image === "string" && u.image) ||
          "";

        if (!avatarPreview) {
          const aid = u?.avatarId || authUser?.avatarId;
          if (aid) {
            try {
              avatarPreview = (await mediaGetUrl(aid)) || "";
            } catch {}
          }
        }

        // ------- Cover preview com fallbacks -------
        let coverPreview =
          (u && typeof u.cover === "string" && u.cover) ||
          (authUser && typeof authUser.cover === "string" && authUser.cover) ||
          "";
        if (!coverPreview) {
          const cid = u?.coverId || authUser?.coverId;
          if (cid) {
            try {
              coverPreview = (await mediaGetUrl(cid)) || "";
            } catch {}
          }
        }

        if (!cancelled) {
          setName(u.name || u.displayName || "");
          setUsername(u.username || "");
          setBio(u.bio || "");
          setEmail(u.email || authUser?.email || "");

          setAvatar(avatarPreview || "");
          setAvatarId(u.avatarId || authUser?.avatarId || "");

          setCover(coverPreview || "");
          setCoverId(u.coverId || authUser?.coverId || "");

          setFeedFollowsFirst(
            typeof s.feedFollowsFirst === "boolean" ? s.feedFollowsFirst : true
          );
          setVaccineWarnDays(
            Number.isFinite(s.vaccineWarnDays) ? s.vaccineWarnDays : 7
          );

          const hash = JSON.stringify({
            name: u.name || u.displayName || "",
            username: u.username || "",
            bio: u.bio || "",
            email: u.email || authUser?.email || "",
            avatar: avatarPreview || "",
            avatarId: u.avatarId || authUser?.avatarId || "",
            cover: coverPreview || "",
            coverId: u.coverId || authUser?.coverId || "",
            feedFollowsFirst:
              typeof s.feedFollowsFirst === "boolean"
                ? s.feedFollowsFirst
                : true,
            vaccineWarnDays: Number.isFinite(s.vaccineWarnDays)
              ? s.vaccineWarnDays
              : 7,
          });
          setInitialHash(hash);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (userId) load();
    return () => {
      cancelled = true;
    };
  }, [userId, authUser]);

  /* --------------------------------- Ações -------------------------------- */
  const onPickAvatar = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    try {
      const preview = await makePreviewDataURL(file, 256);
      const blob = await fileToCompressedBlob(file, 1400, 0.76);
      const id = await mediaSaveBlob(blob);

      setAvatar(preview);
      setAvatarId(id || "");
      toast.success("Avatar atualizado (não esqueça de salvar).");
    } catch (err) {
      console.error(err);
      toast.error("Falha ao processar o avatar. Tente outra imagem.");
    }
  };

  const onRemoveAvatar = () => {
    setAvatar("");
    setAvatarId("");
  };

  const onPickCover = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    try {
      const preview = await makePreviewDataURL(file, 512);
      const blob = await fileToCompressedBlob(file, 1600, 0.76);
      const id = await mediaSaveBlob(blob);

      setCover(preview);
      setCoverId(id || "");
      toast.success("Capa atualizada (não esqueça de salvar).");
    } catch (err) {
      console.error(err);
      toast.error("Falha ao processar a capa. Tente outra imagem.");
    }
  };

  const onRemoveCover = () => {
    setCover("");
    setCoverId("");
  };

  const onSave = async () => {
    if (!name.trim() || !username.trim()) {
      toast.error("Preencha nome e username.");
      return;
    }
    try {
      // Atualiza o perfil
      updateUser(userId, {
        name: name.trim(),
        username: username.trim(),
        bio: String(bio || "").trim(),
        // mantemos preview para compat atual com Sidebar/Profile
        avatar: avatar || "",
        avatarId: avatarId || "",
        cover: cover || "",
        coverId: coverId || "",
      });

      // Atualiza configurações (fallback local)
      writeUserSettings(userId, {
        feedFollowsFirst: !!feedFollowsFirst,
        vaccineWarnDays: Math.max(0, Number(vaccineWarnDays) || 0),
      });

      // Atualiza auth store (se houver setter)
      if (typeof setAuthUser === "function") {
        setAuthUser({
          ...authUser,
          name: name.trim(),
          username: username.trim(),
          bio: String(bio || "").trim(),
          avatar: avatar || "",
          avatarId: avatarId || "",
          cover: cover || "",
          coverId: coverId || "",
        });
      }

      // reset hash
      const hash = JSON.stringify({
        name: name.trim(),
        username: username.trim(),
        bio: String(bio || "").trim(),
        email,
        avatar: avatar || "",
        avatarId: avatarId || "",
        cover: cover || "",
        coverId: coverId || "",
        feedFollowsFirst: !!feedFollowsFirst,
        vaccineWarnDays: Math.max(0, Number(vaccineWarnDays) || 0),
      });
      setInitialHash(hash);

      toast.success("Perfil salvo com sucesso!");
      navigate("/perfil", { replace: true });
    } catch (err) {
      console.error(err);
      toast.error("Falha ao salvar o perfil.");
    }
  };

  const onCancel = () => {
    if (dirty) {
      const leave = window.confirm(
        "Existem alterações não salvas. Deseja descartá-las?"
      );
      if (!leave) return;
    }
    navigate("/perfil");
  };

  /* --------------------------------- UI ----------------------------------- */
  if (loading) {
    return (
      <div className="min-h-dvh w-full grid place-items-center">
        <div className="animate-pulse text-sm text-zinc-500 dark:text-zinc-400">
          Carregando…
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-black/10 dark:border-white/10"
            title="Voltar"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold">Editar perfil</h1>
            <p className="text-sm opacity-70">
              Atualize seus dados, imagem de perfil e capa.
            </p>
          </div>
        </div>

        {/* Esconde no mobile, mostra do md pra cima */}
        <div className="hidden items-center gap-2 md:flex">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-2 rounded-lg border border-black/10 px-4 py-2 text-sm hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
          >
            <X className="h-4 w-4" />
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSave}
            className="inline-flex items-center gap-2 rounded-lg bg-[#f77904] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
          >
            <Save className="h-4 w-4" />
            Salvar alterações
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Coluna esquerda: Conta */}
        <section className="lg:col-span-6 rounded-2xl bg-[var(--content-bg)] p-5 ring-1 ring-black/5 dark:ring-white/5">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
            <User2 className="h-5 w-5 opacity-80" />
            Conta
          </h2>

          <div className="grid gap-4">
            <Field label="Nome">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-800"
                placeholder="Seu nome"
              />
            </Field>

            <Field label="Username">
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-800"
                placeholder="ex.: @seuuser"
              />
            </Field>

            <Field label="E-mail">
              <input
                value={email}
                readOnly
                className="w-full cursor-not-allowed rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-500 outline-none dark:border-zinc-700 dark:bg-zinc-900/60"
              />
              <p className="mt-1 text-xs opacity-60">
                Alteração de e-mail estará disponível após integração com o
                servidor.
              </p>
            </Field>

            <Field label="Bio">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-800"
                placeholder="Fale um pouco sobre você"
              />
            </Field>
          </div>
        </section>

        {/* Coluna direita: Aparência */}
        <section className="lg:col-span-6 rounded-2xl bg-[var(--content-bg)] p-5 ring-1 ring-black/5 dark:ring-white/5">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
            <ImageIcon className="h-5 w-5 opacity-80" />
            Aparência
          </h2>

          <div className="grid gap-5">
            {/* Avatar — wrapper sem overflow para permitir o botão “sair” do círculo */}
            <div className="flex items-center gap-4">
              <div className="relative inline-block">
                {/* círculo com overflow-hidden apenas aqui */}
                <div className="h-24 w-24 overflow-hidden rounded-full ring-4 ring-black/10 dark:ring-white/10">
                  {avatar ? (
                    <img
                      src={avatar || undefined}
                      alt="Avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-[var(--chip-bg)] text-[var(--chip-fg)]">
                      <User2 className="h-9 w-9 opacity-60" />
                    </div>
                  )}
                </div>

                {/* botão posicionado no WRAPPER, fora do círculo */}
                <button
                  type="button"
                  title="Alterar avatar"
                  onClick={() => avatarInputRef.current?.click()}
                  className="
        absolute right-0 bottom-0
        translate-x-1/3 translate-y-1/3
        inline-flex h-9 w-9 items-center justify-center
        rounded-full bg-[#f77904] text-white shadow-lg
        ring-2 ring-white hover:opacity-95
      "
                >
                  <Camera className="h-4 w-4" />
                </button>

                {/* input escondido */}
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onPickAvatar}
                />
              </div>

              {/* botão remover (se houver) */}
              {avatar && (
                <button
                  type="button"
                  onClick={onRemoveAvatar}
                  className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800/40"
                >
                  <X className="h-4 w-4" />
                  Remover
                </button>
              )}
            </div>

            {/* Capa */}
            <div>
              <div className="relative aspect-[16/5] w-full overflow-hidden rounded-xl ring-4 ring-black/10 dark:ring-white/10">
                {cover ? (
                  <img
                    src={cover || undefined}
                    alt="Capa"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-[var(--chip-bg)] text-[var(--chip-fg)]">
                    <ImageIcon className="h-7 w-7 opacity-60" />
                  </div>
                )}

                {/* botão flutuante de câmera para a capa */}
                <button
                  type="button"
                  title="Alterar capa"
                  onClick={() => coverInputRef.current?.click()}
                  className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/70"
                >
                  <Camera className="h-4 w-4" />
                </button>

                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onPickCover}
                />
              </div>

              {cover && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={onRemoveCover}
                    className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800/40"
                  >
                    <X className="h-4 w-4" />
                    Remover capa
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Preferências / Armazenamento */}
        <section className="lg:col-span-12 rounded-2xl bg-[var(--content-bg)] p-5 ring-1 ring-black/5 dark:ring-white/5">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
            <Info className="h-5 w-5 opacity-80" />
            Preferências & Armazenamento
          </h2>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-xl bg-[var(--chip-bg)] p-4 ring-1 ring-black/5 dark:ring-white/5">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={feedFollowsFirst}
                  onChange={(e) => setFeedFollowsFirst(e.target.checked)}
                />
                <div>
                  <div className="text-sm font-medium">
                    Priorizar postagens de quem sigo
                  </div>
                  <div className="text-xs opacity-70">
                    O feed exibirá primeiro postagens das pessoas que você
                    segue.
                  </div>
                </div>
              </label>
            </div>

            <div className="rounded-xl bg-[var(--chip-bg)] p-4 ring-1 ring-black/5 dark:ring-white/5">
              <label className="text-sm font-medium">
                Avisar vacinas com antecedência
              </label>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={vaccineWarnDays}
                  onChange={(e) =>
                    setVaccineWarnDays(Math.max(0, Number(e.target.value) || 0))
                  }
                  className="w-24 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-800"
                />
                <span className="text-sm opacity-70">dia(s)</span>
              </div>
              <p className="mt-1 text-xs opacity-70">
                Esse valor é usado nos avisos de vacinas dos seus pets.
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-start gap-3 rounded-xl bg-amber-100 p-4 text-amber-900 ring-1 ring-amber-300 dark:bg-amber-950/30 dark:text-amber-200 dark:ring-amber-900/50">
            <AlertTriangle className="mt-[2px] h-5 w-5 shrink-0" />
            <div className="text-sm">
              <strong>Atenção:</strong> estas configurações são locais (salvas
              no seu dispositivo). Quando o backend estiver disponível, você
              poderá sincronizá-las entre dispositivos.
            </div>
          </div>
        </section>
      </div>

      {/* Rodapé fixo em telas pequenas (apenas mobile) */}
      <div className="sticky bottom-4 mt-6 flex justify-end gap-2 md:hidden">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-[var(--content-bg)] px-4 py-2 text-sm hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
        >
          <X className="h-4 w-4" />
          Cancelar
        </button>
        <button
          type="button"
          onClick={onSave}
          className="inline-flex items-center gap-2 rounded-lg bg-[#f77904] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95"
        >
          <Save className="h-4 w-4" />
          Salvar
        </button>
      </div>
    </div>
  );
}

/* -------------------------------- Subcomponentes ---------------------------*/
function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
