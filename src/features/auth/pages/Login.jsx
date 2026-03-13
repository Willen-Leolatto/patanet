// src/features/auth/pages/Login.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "@/store/theme";
import { Sun, Moon, Info, ShieldAlert, X } from "lucide-react";

import dogImg from "@/assets/dog.png";
import DisplayLogo from "@/assets/display.png";

// APIs (imutáveis conforme combinado)
import { signIn } from "@/api/auth.api.js";
import { http } from "@/api/axios.js";
import { getMyProfile } from "@/api/user.api.js";
import { useVetMode } from "@/store/vetMode.jsx";
import { canUseVetMode } from "@/utils/role.js";
import { getTokenRoles, getAccessToken } from "@/utils/jwt.js";

function validatePassword(pw) {
  const errors = [];
  if (!pw || pw.length < 8) errors.push("mínimo 8 caracteres");
  if (!/[A-Z]/.test(pw)) errors.push("1 letra maiúscula");
  if (!/[a-z]/.test(pw)) errors.push("1 letra minúscula");
  if (!/[0-9]/.test(pw)) errors.push("1 número");
  if (!/[^A-Za-z0-9]/.test(pw)) errors.push("1 caractere especial");
  return { ok: errors.length === 0, errors };
}

function TermsModal({ open, onClose, onAccept }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-4">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-[#0F141B] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="text-sm font-semibold text-white">
            Termos e Diretrizes
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-xs text-white/70 hover:bg-white/10"
          >
            <X className="h-4 w-4" /> Fechar
          </button>
        </div>

        <div className="max-h-[70vh] overflow-auto p-4 text-sm text-white/90">
          <h2 className="text-base font-semibold">Termos de uso (resumo)</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-white/80">
            <li>
              O PataNet é uma comunidade sobre pets, eventos e tutoria. Você é
              responsável pelas ações realizadas na sua conta e pelo conteúdo que
              publicar.
            </li>
            <li>
              É proibido publicar ou promover: CSAE/CSAM, violência extrema,
              maus-tratos a animais, ódio, assédio, golpes/fraudes e exposição de
              dados sensíveis de terceiros.
            </li>
            <li>
              Podemos moderar conteúdo/contas (remover posts, restringir acesso,
              suspender) quando necessário para proteger usuários e cumprir a lei.
            </li>
            <li>
              Você pode solicitar exclusão de conta e dados associados na área de
              "Exclusão de conta".
            </li>
          </ul>

          <h2 className="mt-5 text-base font-semibold">Diretrizes da Comunidade</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-white/80">
            <li>Seja respeitoso: sem humilhação, ameaças ou perseguição.</li>
            <li>
              Segurança infantil: tolerância zero para qualquer conteúdo de
              exploração/abuso sexual infantil.
            </li>
            <li>
              Maus-tratos: não incentive nem publique crueldade/negligência grave
              contra animais.
            </li>
            <li>
              Use denúncia e bloqueio quando encontrar algo impróprio.
            </li>
          </ul>

          <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/75">
            Dica: você pode revisar essas páginas depois em <b>Ajuda e Políticas</b>.
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link className="text-[#f77904] hover:underline" to="/ajuda">
              Ajuda e Políticas
            </Link>
            <Link className="text-[#f77904] hover:underline" to="/privacidade">
              Privacidade
            </Link>
            <Link className="text-[#f77904] hover:underline" to="/denuncia">
              Canal de denúncia
            </Link>
            <Link className="text-[#f77904] hover:underline" to="/excluir-conta">
              Exclusão de conta
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-white/10 bg-black/20 p-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
          >
            Não aceito
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="rounded-xl bg-[#f77904] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Eu li e aceito
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();

  const vetPreferred = useVetMode((s) => s.preferred);
  const setVetPreferred = useVetMode((s) => s.setPreferred);

  const [mode, setMode] = useState("login"); // 'login' | 'signup'
  const [showPass, setShowPass] = useState(false);

  // login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // signup
  const [name, setName] = useState("");
  const [username, setUsername] = useState(""); // Apelido
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // imagem de perfil (signup)
  const [preview, setPreview] = useState("");
  const [pickedFile, setPickedFile] = useState(null);

  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const pendingSignupRef = React.useRef(null);

  const theme = useTheme((s) => s.theme);
  const toggleTheme = useTheme((s) => s.toggle);

  const title = mode === "login" ? "Entre com sua conta" : "Crie sua conta";
  const cta = mode === "login" ? "Entrar" : "Criar conta";

  const switchText =
    mode === "login" ? (
      <>
        Ainda não tem uma conta?{" "}
        <button
          className="text-orange-500 hover:underline"
          type="button"
          onClick={() => {
            setMode("signup");
            setError("");
          }}
        >
          Criar conta
        </button>
      </>
    ) : (
      <>
        Já tem uma conta?{" "}
        <button
          className="text-orange-500 hover:underline"
          type="button"
          onClick={() => {
            setMode("login");
            setError("");
          }}
        >
          Entrar
        </button>
      </>
    );

  const canSubmit = useMemo(() => {
    if (submitting) return false;

    const emailOk = !!String(email || "").trim();
    const pwOk = !!String(password || "");

    if (mode === "login") return emailOk && pwOk;

    // Cadastro: habilita o botão ao preencher campos (validações mais pesadas no submit)
    const nameOk = !!String(name || "").trim();
    const nickOk = !!String(username || "").trim();
    const confirmOk = !!String(confirmPassword || "");
    return nameOk && nickOk && emailOk && pwOk && confirmOk;
  }, [mode, name, username, email, password, confirmPassword, submitting]);

  // -------- Helpers de imagem (compressão/redimensionamento) --------
  const IMAGE_MAX_BYTES = 2.5 * 1024 * 1024; // 2.5 MB
  const IMAGE_MAX_DIM = 1600; // maior lado

  async function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(e);
      };
      img.src = url;
    });
  }

  function drawToCanvas(img, maxDim = IMAGE_MAX_DIM, fill = "#ffffff") {
    const { naturalWidth: w0, naturalHeight: h0 } = img;
    const scale = Math.min(1, maxDim / Math.max(w0, h0));
    const w = Math.max(1, Math.round(w0 * scale));
    const h = Math.max(1, Math.round(h0 * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.drawImage(img, 0, 0, w, h);
    return canvas;
  }

  async function toJpegBlob(canvas, quality = 0.85) {
    return new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", quality)
    );
  }

  async function compressImageIfNeeded(file) {
    if (file.size <= IMAGE_MAX_BYTES) return file;

    const img = await loadImageFromFile(file);
    const canvas = drawToCanvas(img, IMAGE_MAX_DIM, "#ffffff");

    let quality = 0.9;
    let blob = await toJpegBlob(canvas, quality);
    while (blob && blob.size > IMAGE_MAX_BYTES && quality > 0.5) {
      quality -= 0.1;
      blob = await toJpegBlob(canvas, quality);
    }

    const out = blob || (await toJpegBlob(canvas, 0.8));
    const outName =
      (file.name || "avatar").replace(/\.(png|webp|gif|bmp)$/i, "") + ".jpg";
    return new File([out], outName, { type: "image/jpeg", lastModified: Date.now() });
  }

  function onPickAvatar(e) {
    const file = e.target.files?.[0];
    if (!file) {
      setPickedFile(null);
      setPreview("");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);

    (async () => {
      try {
        const processed = await compressImageIfNeeded(file);
        setPickedFile(processed);
      } catch {
        setPickedFile(file);
      }
    })();
  }

  const [vetChoiceOpen, setVetChoiceOpen] = useState(false);

  function chooseVetDestination(next) {
    const v = next === "vet" ? "vet" : "feed";
    setVetPreferred(v);
    setVetChoiceOpen(false);
    navigate(v === "vet" ? "/vet" : "/feed", { replace: true });
  }

  // Redireciona se já estiver autenticado
  useEffect(() => {
    if (!getAccessToken()) return;

    let alive = true;
    (async () => {
      try {
        const me = await getMyProfile();
        const ok =
          !!me &&
          typeof me === "object" &&
          (me.id || (me.email && String(me.email).includes("@")) || me.username);
        if (alive && ok) {
          const canVet = canUseVetMode(me);
          if (canVet && vetPreferred === "vet") {
            navigate("/vet", { replace: true });
          } else {
            navigate("/feed", { replace: true });
          }
        }
      } catch {
        // silencioso
      }
    })();

    return () => {
      alive = false;
    };
  }, [navigate, vetPreferred]);

  async function handleLogin({ email, password }) {
    const jwt = await signIn({
      username: String(email || "").trim(),
      password: String(password || ""),
    });

    if (jwt?.terms_version) {
      try {
        window.localStorage.setItem("patanet:terms-version", jwt.terms_version);
      } catch {
        // noop
      }
    }

    window.dispatchEvent(new CustomEvent("patanet:auth-updated"));

    // FIX15: não forçamos mais a rota /termos.

    try {
      const me = await getMyProfile();
      const tokenRoles = getTokenRoles();
      const patched =
        me && typeof me === "object" && !me.role && tokenRoles.length
          ? { ...me, role: tokenRoles[0] }
          : me;
      const canVet = canUseVetMode(patched);
      if (canVet) {
        if (vetPreferred === "vet") {
          navigate("/vet", { replace: true });
          return;
        }
        if (vetPreferred === "feed") {
          navigate("/feed", { replace: true });
          return;
        }
        setVetChoiceOpen(true);
        return;
      }
    } catch {
      // ignore
    }

    navigate("/feed", { replace: true });
  }

  async function handleSignup(payload) {
    const fd = new FormData();
    fd.append("name", payload.name.trim());
    fd.append("username", payload.username.trim());
    fd.append("email", payload.email.trim().toLowerCase());
    fd.append("password", payload.password);

    if (payload.imageFile) fd.append("image", payload.imageFile);

    await http.post("/users", fd);
    await handleLogin({ email: payload.email, password: payload.password });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    const emailField = String(email || "").trim();

    if (mode === "login") {
      if (!emailField || !password) {
        setError("Informe e-mail e senha.");
        return;
      }

      setSubmitting(true);
      try {
        await handleLogin({ email: emailField, password });
      } catch (err) {
        const rawMsg =
          err?.response?.data?.message || err?.message || "Não foi possível autenticar.";
        setError(String(rawMsg));
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Signup
    const nome = String(name || "").trim();
    const nick = String(username || "").trim();

    if (!nome || !nick || !emailField) {
      setError("Preencha nome, apelido e e-mail.");
      return;
    }

    if (!password || !confirmPassword) {
      setError("Informe a senha e a confirmação de senha.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não conferem.");
      return;
    }

    const pw = validatePassword(password);
    if (!pw.ok) {
      setError(`Senha fraca: ${pw.errors.join(", ")}.`);
      return;
    }

    // Guarda dados e só então abre a modal de aceite
    pendingSignupRef.current = {
      name: nome,
      username: nick,
      email: emailField,
      password,
      imageFile: pickedFile || null,
    };
    setTermsModalOpen(true);
  }

  async function acceptTermsAndCreate() {
    const payload = pendingSignupRef.current;
    if (!payload) {
      setTermsModalOpen(false);
      return;
    }

    setTermsModalOpen(false);
    setSubmitting(true);

    try {
      await handleSignup(payload);
      // Alerta simples para confirmar que o cadastro foi concluído.
      // (Pode ser trocado por Toast/Modal no futuro.)
      window.alert("Cadastro realizado com sucesso! Bem-vindo(a) ao PataNet.");
    } catch (err) {
      const status = err?.response?.status;
      const rawMsg =
        err?.response?.data?.message || err?.message || "Não foi possível criar a conta.";

      if (status === 409) {
        setError(
          "Já existe uma conta com este e-mail e/ou apelido. Tente outro ou faça login."
        );
      } else if (status === 413 || /payload too large/i.test(String(rawMsg))) {
        setError("Imagem muito grande para envio. Tente uma foto menor.");
      } else {
        setError(String(rawMsg));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-zinc-50 to-zinc-100 text-zinc-900 dark:from-[#0F141B] dark:to-[#0B1117] dark:text-zinc-100">
      <TermsModal
        open={termsModalOpen}
        onClose={() => setTermsModalOpen(false)}
        onAccept={acceptTermsAndCreate}
      />

      {vetChoiceOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#0F141B]">
            <h2 className="text-lg font-semibold">Escolha o modo de acesso</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              Você tem acesso ao modo Veterinário. Para onde quer ir agora?
            </p>

            <div className="mt-5 grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={() => chooseVetDestination("vet")}
                className="w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-600"
              >
                Ir para Dashboard Vet
              </button>

              <button
                type="button"
                onClick={() => chooseVetDestination("feed")}
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100 dark:hover:bg-white/10"
              >
                Ir para Feed Social
              </button>

              <button
                type="button"
                onClick={() => {
                  setVetChoiceOpen(false);
                  navigate("/feed", { replace: true });
                }}
                className="w-full rounded-xl px-4 py-2 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                Agora não
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto flex min-h-screen max-w-7xl items-center px-4 py-10">
        <div className="grid w-full grid-cols-1 items-center gap-8 md:grid-cols-2">
          {/* coluna da imagem (desktop) */}
          <div className="relative hidden select-none items-center justify-center md:flex">
            <img
              src={DisplayLogo}
              alt="PataNet"
              className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 w-[260px] md:w-[320px] lg:w-[360px]"
              draggable={false}
            />
            <img
              src={dogImg}
              alt="Dog"
              className="pointer-events-none w-[88%] max-w-[820px] drop-shadow-2xl"
            />
          </div>

          {/* coluna do formulário + painel */}
          <div className="flex w-full flex-col items-center justify-center gap-6">
            <div className="relative w-full max-w-xl rounded-3xl bg-white/70 p-8 shadow-xl backdrop-blur-md transition-colors dark:bg-white/5 md:p-10">
              <div className="mb-4 flex items-center justify-between">
                <div className="md:hidden">
                  <img
                    src={DisplayLogo}
                    alt="PataNet"
                    className="w-[140px]"
                    draggable={false}
                  />
                </div>

                <button
                  onClick={toggleTheme}
                  className="inline-flex items-center gap-2 rounded-full border border-black/10 px-3 py-1 text-xs text-[var(--fg)] hover:bg-black/[0.03] dark:border-white/10 dark:hover:bg-white/5"
                  type="button"
                  aria-label="Alternar tema"
                  title="Alternar tema"
                >
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                  {theme === "dark" ? "Claro" : "Escuro"}
                </button>
              </div>

              <div className="absolute -top-8 left-1/2 -translate-x-1/2 rounded-full border border-white/40 bg-white p-2 shadow-md dark:border-white/10 dark:bg-white/10">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-orange-500/30 bg-white text-orange-500 dark:bg-white/5">
                  <svg width="24" height="24" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M12 12a5 5 0 1 0-5-5a5 5 0 0 0 5 5Zm0 2c-4.418 0  -8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5Z"
                    />
                  </svg>
                </div>
              </div>

              <h1 className="mb-2 mt-4 text-center text-2xl font-semibold tracking-tight md:text-3xl">
                {title}
              </h1>
              <p className="mb-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                Acesse o app para entrar no Feed, cadastrar seus pets e participar da comunidade.
              </p>

              <form onSubmit={onSubmit} className="space-y-4">
                {mode === "signup" && (
                  <>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img
                          src={preview || "https://api.dicebear.com/8.x/identicon/svg?seed=patanet"}
                          className="h-16 w-16 rounded-full object-cover ring-2 ring-orange-500/30"
                          alt="avatar"
                        />
                        <label className="absolute -bottom-1 -right-1 inline-flex cursor-pointer items-center justify-center rounded-full bg-orange-500 p-1.5 text-white shadow hover:bg-orange-600">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={onPickAvatar}
                            name="image"
                          />
                          <svg width="16" height="16" viewBox="0 0 24 24">
                            <path
                              fill="currentColor"
                              d="M5 20h14v-9h-4V7H9v4H5v9Zm6-3h2v-3h3v-2h-3V9h-2v3H8v2h3v3Z"
                            />
                          </svg>
                        </label>
                      </div>

                      <div className="flex-1 text-sm opacity-70">Foto de perfil (opcional)</div>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm">Nome</label>
                      <input
                        className="w-full rounded-xl border border-zinc-300/70 bg-white/70 px-4 py-3 outline-none ring-0 transition focus:border-orange-400 dark:border-white/10 dark:bg-white/5"
                        placeholder="Seu nome"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm">Apelido</label>
                      <input
                        className="w-full rounded-xl border border-zinc-300/70 bg-white/70 px-4 py-3 outline-none ring-0 transition focus:border-orange-400 dark:border-white/10 dark:bg-white/5"
                        placeholder="Como você quer ser chamado(a)"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="mb-1 block text-sm">E-mail</label>
                  <input
                    type="email"
                    className="w-full rounded-xl border border-zinc-300/70 bg-white/70 px-4 py-3 outline-none ring-0 transition focus:border-orange-400 dark:border-white/10 dark:bg-white/5"
                    placeholder="email@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm">Senha</label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      className="w-full rounded-xl border border-zinc-300/70 bg-white/70 px-4 py-3 pr-10 outline-none ring-0 transition focus:border-orange-400 dark:border-white/10 dark:bg-white/5"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                      title={showPass ? "Ocultar" : "Mostrar"}
                    >
                      {showPass ? (
                        <svg width="20" height="20" viewBox="0 0 24 24">
                          <path
                            fill="currentColor"
                            d="M12 7a5 5 0 0 1 5 5a4.9 4.9 0 0 1-.6 2.3l3.2 3.2l-1.4 1.4l-3.3-3.3A5 5 0 1 1 12 7m0 2a3 3 0 0 0-3 3a2.9 2.9 0 0 0 .5 1.6l1.1-1.1A1.9 1.9 0 0 1 10 12a2 2 0 0 1 2-2z"
                          />
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24">
                          <path
                            fill="currentColor"
                            d="M12 6a11.8 11.8 0 0 1 10 6a11.8 11.8 0 0 1-10 6A11.8 11.8 0 0 1 2 12A11.8 11.8 0 0 1 12 6m0 10a4 4 0 1 0 0-8a4 4 0 0 0 0 8z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>

                  {mode === "signup" && (
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      Mínimo 8 caracteres, com 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial.
                    </p>
                  )}
                </div>

                {mode === "signup" && (
                  <div>
                    <label className="mb-1 block text-sm">Confirmar senha</label>
                    <input
                      type={showPass ? "text" : "password"}
                      className="w-full rounded-xl border border-zinc-300/70 bg-white/70 px-4 py-3 outline-none ring-0 transition focus:border-orange-400 dark:border-white/10 dark:bg-white/5"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                )}

                {error && (
                  <div className="rounded-lg border border-red-400/30 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-900/20 dark:text-red-200">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="mt-2 w-full rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white shadow-md transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Enviando..." : cta}
                </button>

                {mode === "signup" && (
                  <button
                    type="button"
                    onClick={() => {
                      pendingSignupRef.current = null;
                      setTermsModalOpen(true);
                    }}
                    className="w-full text-center text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                  >
                    Ler Termos e Diretrizes
                  </button>
                )}
              </form>

              <p className="mt-5 text-center text-sm text-zinc-500 dark:text-zinc-400">
                {switchText}
              </p>
            </div>

            {/* Painel de aviso */}
            <div className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white/70 p-5 text-sm text-zinc-700 shadow-sm backdrop-blur-md dark:border-zinc-800 dark:bg-white/5 dark:text-zinc-200">
              <div className="flex items-center gap-2 font-semibold">
                <Info className="h-4 w-4 text-orange-500" /> Antes de começar
              </div>

              {/* desktop */}
              <div className="mt-3 hidden gap-3 md:grid md:grid-cols-2">
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="text-sm font-semibold">Para tutores</div>
                  <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
                    <li>Cadastre seus pets.</li>
                    <li>Use o Feed para postar e aprender.</li>
                    <li>Use Eventos para achar ações locais.</li>
                  </ol>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <ShieldAlert className="h-4 w-4" /> Segurança
                  </div>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                    <li>Tolerância zero para CSAE.</li>
                    <li>Denuncie maus-tratos e abuso.</li>
                    <li>Bloqueie usuários tóxicos.</li>
                  </ul>
                </div>
              </div>

              {/* mobile: accordion */}
              <div className="mt-3 space-y-2 md:hidden">
                <details className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
                  <summary className="cursor-pointer text-sm font-semibold">
                    Para tutores
                  </summary>
                  <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
                    <li>Cadastre seus pets.</li>
                    <li>Use o Feed para postar e aprender.</li>
                    <li>Use Eventos para achar ações locais.</li>
                  </ol>
                </details>

                <details className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
                  <summary className="cursor-pointer text-sm font-semibold">
                    Segurança
                  </summary>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                    <li>Tolerância zero para CSAE.</li>
                    <li>Denuncie maus-tratos e abuso.</li>
                    <li>Bloqueie usuários tóxicos.</li>
                  </ul>
                </details>
              </div>

              {/* FAQ (segurança e moderação) */}
              <div className="mt-4">
                <div className="text-sm font-semibold">Perguntas frequentes</div>
                <div className="mt-2 space-y-2">
                  <details className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                    <summary className="cursor-pointer font-semibold">
                      Como denunciar conteúdo ou usuários?
                    </summary>
                    <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-200">
                      Use o menu de opções (três pontos) em um post/comentário/perfil e selecione <b>Denunciar</b>.
                      Para casos de <b>maus-tratos</b>, use o <b>Canal de denúncia</b> (envio por e-mail com provas).
                    </div>
                  </details>

                  <details className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                    <summary className="cursor-pointer font-semibold">
                      O que acontece após uma denúncia?
                    </summary>
                    <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-200">
                      A equipe pode analisar o conteúdo e aplicar medidas como: remover post, limitar alcance, restringir conta ou banir.
                      Em casos graves (ex.: CSAE), podemos encaminhar às autoridades competentes quando aplicável.
                    </div>
                  </details>

                  <details className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                    <summary className="cursor-pointer font-semibold">
                      Quais conteúdos são proibidos?
                    </summary>
                    <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-200">
                      É proibido publicar ou promover: <b>CSAE/CSAM</b>, crueldade/maus-tratos a animais, ódio, assédio, ameaças,
                      golpes/fraudes e exposição de dados pessoais sensíveis.
                    </div>
                  </details>

                  <details className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                    <summary className="cursor-pointer font-semibold">
                      Posso bloquear alguém?
                    </summary>
                    <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-200">
                      Sim. No perfil do usuário ou no menu do post, use <b>Bloquear</b> para não ver mais conteúdo daquela conta.
                      Você pode desfazer depois, se quiser.
                    </div>
                  </details>
                </div>
              </div>

              {/* 3 botões */}
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <Link
                  className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-center text-xs font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  to="/ajuda"
                >
                  Ajuda e Políticas
                </Link>
                <Link
                  className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-center text-xs font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  to="/denuncia"
                >
                  Canal de denúncia
                </Link>
                <Link
                  className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-center text-xs font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  to="/excluir-conta"
                >
                  Exclusão de conta
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
