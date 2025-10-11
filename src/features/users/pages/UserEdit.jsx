// src/features/users/pages/UserEdit.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera,
  Image as ImageIcon,
  User2,
  Save,
  X,
  ChevronLeft,
  AlertTriangle,
} from "lucide-react";

import { useToast } from "@/components/ui/ToastProvider";
import { getMyProfile, updateUser } from "@/api/user.api.js";

/* -------------------------------- helpers --------------------------------- */
async function fileToDataURL(file) {
  if (!file) return "";
  const buf = await file.arrayBuffer();
  const blob = new Blob([buf], { type: file.type || "image/jpeg" });
  return await new Promise((res) => {
    const fr = new FileReader();
    fr.onload = () => res(String(fr.result || ""));
    fr.readAsDataURL(blob);
  });
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

function Section({ title, children, right = null }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold opacity-80">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

/* ---------------------------------- page ---------------------------------- */
export default function UserEdit() {
  const navigate = useNavigate();
  const toast = useToast?.();

  // usuário logado
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  // formulário
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [about, setAbout] = useState("");

  // imagens (preview + arquivo)
  const [avatarPreview, setAvatarPreview] = useState("");
  const [coverPreview, setCoverPreview] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);

  // preferências (visual, sem API) — padrão 7 dias
  const [vaccineDays, setVaccineDays] = useState(7);

  // refs para inputs de arquivo
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  // carrega perfil do logado (API)
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoading(true);
        const u = await getMyProfile();
        if (!u) throw new Error("unauthorized");
        if (cancel) return;

        setMe(u);
        setName(u?.name || "");
        setUsername(u?.username || "");
        setEmail(u?.email || "");
        setAbout(u?.about || "");
        setAvatarPreview(u?.image || "");
        setCoverPreview(u?.imageCover || "");

        // preferências visuais
        setVaccineDays(7);
      } catch {
        if (!cancel) navigate("/auth", { replace: true });
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [navigate]);

  // cálculo simples de "dirty"
  const initialHash = useMemo(
    () =>
      JSON.stringify({
        name,
        username,
        email,
        about,
        avatarPreview: !!avatarPreview,
        coverPreview: !!coverPreview,
        vaccineDays: 7,
      }),
    [] // primeira renderização
  );

  const dirty = useMemo(() => {
    const now = JSON.stringify({
      name,
      username,
      email,
      about,
      avatarPreview: !!avatarPreview,
      coverPreview: !!coverPreview,
      vaccineDays,
    });
    return now !== initialHash;
  }, [name, username, email, about, avatarPreview, coverPreview, vaccineDays, initialHash]);

  /* --------------------------------- ações -------------------------------- */
  async function onPickAvatar(e) {
    const file = (e.target.files && e.target.files[0]) || null;
    e.target.value = "";
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(await fileToDataURL(file));
  }

  async function onPickCover(e) {
    const file = (e.target.files && e.target.files[0]) || null;
    e.target.value = "";
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(await fileToDataURL(file));
  }

  function onRemoveAvatar() {
    setAvatarFile(null);
    setAvatarPreview("");
  }

  function onRemoveCover() {
    setCoverFile(null);
    setCoverPreview("");
  }

  async function onSave() {
    if (!me) return;
    if (!String(name).trim() || !String(username).trim()) {
      if (toast?.push) toast.push({ title: "Preencha nome e username", tone: "warning" });
      else alert("Preencha nome e username");
      return;
    }

    try {
      // payload esperado pela API (updateUser monta o FormData)
      const payload = {
        id: me?.id || me?._id || me?.uuid || undefined,
        name: String(name || ""),
        about: String(about || ""),
        username: String(username || ""),
        email: String(email || ""),
      };
      if (avatarFile) payload.image = avatarFile;
      if (coverFile) payload.imageCover = coverFile;

      await updateUser(payload);

      if (toast?.push) {
        toast.push({ title: "Perfil atualizado", description: "Suas alterações foram salvas." });
      } else {
        console.info("Perfil atualizado com sucesso");
      }

      // redireciona para o perfil do logado
      const id = payload.id ?? me?.id ?? "";
      navigate(`/perfil/${id}`, { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Não foi possível atualizar o perfil.";
      if (toast?.push) {
        toast.push({ title: "Erro", description: String(msg), tone: "danger" });
      } else {
        alert(String(msg));
      }
    }
  }

  function goBackToProfile() {
    const id = me?.id || me?._id || me?.uuid || "";
    navigate(id ? `/perfil/${id}` : "/perfil", { replace: true });
  }

  function onCancel() {
    if (dirty) {
      const leave = window.confirm("Existem alterações não salvas. Deseja descartá-las?");
      if (!leave) return;
    }
    goBackToProfile();
  }

  /* ----------------------------------- UI ---------------------------------- */
  if (loading) {
    return (
      <div className="min-h-dvh w-full grid place-items-center">
        <div className="animate-pulse text-sm text-zinc-500 dark:text-zinc-400">Carregando…</div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl p-4 md:p-6">
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
            <p className="text-sm opacity-70">Atualize seus dados, imagem de perfil e capa.</p>
          </div>
        </div>

        {/* Desktop actions */}
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

      {/* GRID PRINCIPAL */}
      {/* Linha 1: Conta | Aparência */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Conta */}
        <Section title="Conta">
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
                Alteração de e-mail poderá ser habilitada futuramente.
              </p>
            </Field>

            <Field label="Bio">
              <textarea
                rows={3}
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-800"
                placeholder="Fale um pouco sobre você"
              />
            </Field>
          </div>
        </Section>

        {/* Aparência */}
        <Section title="Aparência">
          <div className="grid gap-5">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative inline-block">
                <div className="h-24 w-24 overflow-hidden rounded-full ring-4 ring-black/10 dark:ring-white/10">
                  {avatarPreview ? (
                    <img src={avatarPreview || undefined} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-[var(--chip-bg)] text-[var(--chip-fg)]">
                      <User2 className="h-9 w-9 opacity-60" />
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  title="Alterar avatar"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute right-0 bottom-0 translate-x-1/3 translate-y-1/3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#f77904] text-white shadow-lg ring-2 ring-white hover:opacity-95"
                >
                  <Camera className="h-4 w-4" />
                </button>

                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onPickAvatar}
                />
              </div>

              {avatarPreview && (
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
                {coverPreview ? (
                  <img src={coverPreview || undefined} alt="Capa" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-[var(--chip-bg)] text-[var(--chip-fg)]">
                    <ImageIcon className="h-7 w-7 opacity-60" />
                  </div>
                )}

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

              {coverPreview && (
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
        </Section>
      </div>

      {/* Linha 2: Preferências & Armazenamento (full width) */}
      {/* <div className="mt-6">
        <Section title="Preferências & Armazenamento">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-xl bg-[var(--chip-bg)] p-4 ring-1 ring-black/5 dark:ring-white/5">
              <label className="block text-sm font-medium">Avisar vacinas com antecedência</label>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={vaccineDays}
                  onChange={(e) => setVaccineDays(Number(e.target.value || 0))}
                  className="w-24 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-800"
                />
                <span className="text-sm opacity-70">dia(s)</span>
              </div>
              <p className="mt-1 text-xs opacity-70">
                Padrão 7. A preferência será sincronizada quando a API de configurações estiver disponível.
              </p>
            </div>

            <div className="rounded-xl bg-[var(--chip-bg)] p-4 ring-1 ring-black/5 dark:ring-white/5">
              <label className="flex cursor-default items-start gap-3">
                <input type="checkbox" className="mt-1 h-4 w-4" disabled />
                <div>
                  <div className="text-sm font-medium">Priorizar postagens de quem sigo</div>
                  <div className="text-xs opacity-70">
                    (Visual por enquanto) Será sincronizado quando o backend tiver suporte.
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="mt-5 flex items-start gap-3 rounded-xl bg-amber-100 p-4 text-amber-900 ring-1 ring-amber-300 dark:bg-amber-950/30 dark:text-amber-200 dark:ring-amber-900/50">
            <AlertTriangle className="mt-[2px] h-5 w-5 shrink-0" />
            <div className="text-sm">
              <strong>Atenção:</strong> preferências acima estão desabilitadas até a API de configurações.
            </div>
          </div>
        </Section>
      </div> */}

      {/* Rodapé (mobile) */}
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
