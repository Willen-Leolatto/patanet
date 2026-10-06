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
  ShieldCheck,
  KeyRound,
  Trash2,
} from "lucide-react";

import { useToast } from "@/components/ui/ToastProvider";
import { useConfirm, usePrompt } from "@/components/ui/ConfirmProvider";
import {
  getMyProfile,
  updateUser,
  updateUserPassword,
  linkGoogleAccount,
  unlinkGoogleAccount,
  removeOwnerAccount,
} from "@/api/user.api.js";
import { clearTokens } from "@/api/auth.api.js";
import GoogleSignInButton from "@/features/auth/components/GoogleSignInButton.jsx";

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

/** Compressão simples em client-side (mantém proporção) */
async function compressImage(file, { maxW = 1600, maxH = 1600, quality = 0.85 } = {}) {
  try {
    if (!(file instanceof File)) return file;
    // cria bitmap
    const bitmap = await createImageBitmap(file);
    let { width, height } = bitmap;
    const ratio = Math.min(maxW / width, maxH / height, 1); // nunca aumenta
    const w = Math.round(width * ratio);
    const h = Math.round(height * ratio);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0, w, h);

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
    if (!blob) return file;

    const name =
      (file.name || "image").replace(/\.(png|webp|gif|heic|heif)$/i, "") + ".jpg";

    return new File([blob], name, { type: "image/jpeg" });
  } catch {
    // fallback seguro
    return file;
  }
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
  const confirm = useConfirm();
  const askInput = usePrompt();

  // usuário logado
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deletingAccount, setDeletingAccount] = useState(false);

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

  // conta e segurança (Google + senha)
  const [googleLinked, setGoogleLinked] = useState(false);
  const [hasPassword, setHasPassword] = useState(true);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [googleError, setGoogleError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

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
        setGoogleLinked(!!u?.googleLinked);
        setHasPassword(u?.hasPassword ?? true);

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

    // Avatar: menor, alta qualidade
    const compressed = await compressImage(file, { maxW: 800, maxH: 800, quality: 0.9 });
    setAvatarFile(compressed);
    setAvatarPreview(await fileToDataURL(compressed));
  }

  async function onPickCover(e) {
    const file = (e.target.files && e.target.files[0]) || null;
    e.target.value = "";
    if (!file) return;

    // Capa: largura grande, mantém proporção
    const compressed = await compressImage(file, { maxW: 1920, maxH: 1080, quality: 0.85 });
    setCoverFile(compressed);
    setCoverPreview(await fileToDataURL(compressed));
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
      if (avatarFile) payload.image = avatarFile;         // já comprimido
      if (coverFile) payload.imageCover = coverFile;      // já comprimido

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

  async function handleGoogleLinked(idToken) {
    setGoogleError("");
    setGoogleBusy(true);
    try {
      const updated = await linkGoogleAccount({ idToken });
      setGoogleLinked(!!updated?.googleLinked);
      setHasPassword(updated?.hasPassword ?? hasPassword);
      if (toast?.push) toast.push({ title: "Conta do Google conectada" });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Não foi possível conectar sua conta do Google.";
      setGoogleError(msg);
    } finally {
      setGoogleBusy(false);
    }
  }

  function handleGoogleLinkError(err) {
    setGoogleError(err?.message || "Não foi possível conectar sua conta do Google.");
  }

  async function handleUnlinkGoogle() {
    if (!hasPassword || googleBusy) return;
    setGoogleError("");
    setGoogleBusy(true);
    try {
      const updated = await unlinkGoogleAccount();
      setGoogleLinked(!!updated?.googleLinked);
      if (toast?.push) toast.push({ title: "Conta do Google desconectada" });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Não foi possível desconectar sua conta do Google.";
      setGoogleError(msg);
    } finally {
      setGoogleBusy(false);
    }
  }

  async function handleSetPassword(e) {
    e.preventDefault();
    if (!me) return;
    if (!newPassword || newPassword.length < 8) {
      if (toast?.push) {
        toast.push({ title: "A senha deve ter ao menos 8 caracteres", tone: "warning" });
      } else {
        alert("A senha deve ter ao menos 8 caracteres");
      }
      return;
    }
    setSavingPassword(true);
    try {
      await updateUserPassword({ newPassword });
      setHasPassword(true);
      setNewPassword("");
      if (toast?.push) toast.push({ title: "Senha definida com sucesso" });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Não foi possível definir a senha.";
      if (toast?.push) {
        toast.push({ title: "Erro", description: String(msg), tone: "danger" });
      } else {
        alert(String(msg));
      }
    } finally {
      setSavingPassword(false);
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

  /**
   * Exclusão de conta com dupla confirmação (conformidade Play Store):
   * 1) confirmação de intenção; 2) usuário precisa digitar "EXCLUIR" para
   * confirmar definitivamente, evitando exclusões acidentais.
   */
  async function handleDeleteAccount() {
    const step1 = await confirm({
      title: "Excluir sua conta?",
      description:
        "Isso removerá sua conta e os dados associados (pets, posts, vacinas etc.), salvo retenções obrigatórias por lei. Esta ação não pode ser desfeita.",
      confirmText: "Continuar",
      cancelText: "Cancelar",
      tone: "danger",
    });
    if (!step1) return;

    const typed = await askInput({
      title: "Confirme a exclusão",
      description: 'Para confirmar definitivamente, digite EXCLUIR (em maiúsculas) abaixo.',
      placeholder: "EXCLUIR",
      confirmText: "Excluir minha conta",
    });
    if (String(typed || "").trim().toUpperCase() !== "EXCLUIR") {
      if (typed) toast?.error?.('Digite exatamente "EXCLUIR" para confirmar.');
      return;
    }

    setDeletingAccount(true);
    try {
      await removeOwnerAccount();
      try {
        clearTokens();
      } catch {
        // best-effort: a conta já foi excluída no backend mesmo se isso falhar
      }
      window.dispatchEvent(new CustomEvent("patanet:auth-updated"));
      toast?.success?.("Conta excluída com sucesso.");
      navigate("/auth", { replace: true });
    } catch (e) {
      console.error(e);
      toast?.error?.(
        e?.response?.data?.message ||
          "Não foi possível excluir sua conta agora. Tente novamente."
      );
    } finally {
      setDeletingAccount(false);
    }
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

      {/* Linha 2: Conta e segurança (Google + senha) */}
      <div className="mt-6">
        <Section title="Conta e segurança">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-xl bg-[var(--chip-bg)] p-4 ring-1 ring-black/5 dark:ring-white/5">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <ShieldCheck className="h-4 w-4" />
                Login com o Google
              </div>

              {googleLinked ? (
                <>
                  <p className="text-sm opacity-80">
                    Sua conta está conectada ao Google ({me?.email}).
                  </p>
                  {hasPassword ? (
                    <button
                      type="button"
                      onClick={handleUnlinkGoogle}
                      disabled={googleBusy}
                      className="mt-3 inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-800/40"
                    >
                      {googleBusy ? "Desconectando..." : "Desconectar do Google"}
                    </button>
                  ) : (
                    <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">
                      Defina uma senha ao lado para poder desconectar sua conta do Google sem
                      perder o acesso.
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="mb-3 text-sm opacity-80">
                    Conecte sua conta do Google para entrar com mais rapidez e completar seu
                    perfil com os dados que já estão lá.
                  </p>
                  <GoogleSignInButton
                    text="continue_with"
                    nativeLabel="Conectar conta do Google"
                    disabled={googleBusy}
                    onSuccess={handleGoogleLinked}
                    onError={handleGoogleLinkError}
                  />
                </>
              )}

              {googleError && <p className="mt-2 text-xs text-red-500">{googleError}</p>}
            </div>

            <div className="rounded-xl bg-[var(--chip-bg)] p-4 ring-1 ring-black/5 dark:ring-white/5">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <KeyRound className="h-4 w-4" />
                Senha
              </div>

              {hasPassword ? (
                <p className="text-sm opacity-80">Sua conta já possui uma senha definida.</p>
              ) : (
                <form onSubmit={handleSetPassword} className="grid gap-2">
                  <p className="text-sm opacity-80">
                    Você entrou pelo Google e ainda não tem uma senha. Defina uma para também
                    poder entrar sem o Google.
                  </p>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nova senha (mín. 8 caracteres)"
                    className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-800"
                  />
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="mt-1 inline-flex items-center justify-center gap-2 rounded-md bg-[#f77904] px-3 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingPassword ? "Salvando..." : "Definir senha"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </Section>
      </div>

      {/* Zona de perigo: exclusão de conta (conformidade Play Store / LGPD) */}
      <div className="mt-6">
        <Section title="Zona de perigo">
          <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-950/20 sm:flex-row sm:items-center">
            <div>
              <div className="text-sm font-semibold text-red-800 dark:text-red-300">
                Excluir minha conta
              </div>
              <p className="mt-1 text-sm text-red-700/90 dark:text-red-300/80">
                Remove permanentemente sua conta e os dados associados. Esta ação exige
                confirmação em duas etapas e não pode ser desfeita.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={deletingAccount}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
              {deletingAccount ? "Excluindo…" : "Excluir minha conta"}
            </button>
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
