// src/features/auth/pages/Login.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/store/theme";
import { Sun, Moon } from "lucide-react";
import dogImg from "@/assets/dog.png";

// APIs (imutáveis conforme combinado)
import { signIn } from "@/api/auth.api.js";
import { http } from "@/api/axios.js";
import { getMyProfile } from "@/api/user.api.js";

export default function Login() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("login"); // 'login' | 'signup'
  const [showPass, setShowPass] = useState(false);

  // compartilhados
  const [name, setName] = useState("");
  const [username, setUsername] = useState(""); // segue existente para signup (opcional)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // imagem de perfil (signup)
  const [preview, setPreview] = useState("");
  const [pickedFile, setPickedFile] = useState(null);

  const theme = useTheme((s) => s.theme);
  const toggleTheme = useTheme((s) => s.toggle);

  const title = mode === "login" ? "Entre com sua conta" : "Crie sua conta";
  const cta = mode === "login" ? "Entrar" : "Criar conta";
  const switchText =
    mode === "login" ? (
      <>
        ainda não tem uma conta?{" "}
        <button
          className="text-orange-500 hover:underline"
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
        Already have an account?{" "}
        <button
          className="text-orange-400 hover:underline"
          onClick={() => {
            setMode("login");
            setError("");
          }}
        >
          Log in here!
        </button>
      </>
    );

  const canSubmit = useMemo(() => {
    if (submitting) return false;
    if (mode === "login") return !!email && !!password; // APENAS EMAIL
    return !!name && (!!email || !!username) && !!password && terms;
  }, [mode, name, email, username, password, terms, submitting]);

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
    // Se já for pequeno, mantém
    if (file.size <= IMAGE_MAX_BYTES) return file;

    // Carrega imagem e redesenha em canvas (remove transparência -> fundo branco)
    const img = await loadImageFromFile(file);
    const canvas = drawToCanvas(img, IMAGE_MAX_DIM, "#ffffff");

    // Tenta qualidades decrescentes até ficar <= limite
    let quality = 0.9;
    let blob = await toJpegBlob(canvas, quality);
    while (blob && blob.size > IMAGE_MAX_BYTES && quality > 0.5) {
      quality -= 0.1;
      blob = await toJpegBlob(canvas, quality);
    }

    // Se ainda estiver grande, aceita assim mesmo (melhor do que falhar silenciosamente)
    const out = blob || (await toJpegBlob(canvas, 0.8));

    // Retorna como File para manter nome/extensão coerentes
    const name = (file.name || "avatar").replace(/\.(png|webp|gif|bmp)$/i, "") + ".jpg";
    return new File([out], name, { type: "image/jpeg", lastModified: Date.now() });
  }

  function onPickAvatar(e) {
    const file = e.target.files?.[0];
    if (!file) {
      setPickedFile(null);
      setPreview("");
      return;
    }

    // Gera preview imediata
    const url = URL.createObjectURL(file);
    setPreview(url);

    // Comprime/normaliza em background
    (async () => {
      try {
        const processed = await compressImageIfNeeded(file);
        setPickedFile(processed);
      } catch {
        // Se algo falhar, usa o original mesmo
        setPickedFile(file);
      }
    })();
  }

  // Redireciona se já estiver autenticado
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const me = await getMyProfile();
        const ok =
          !!me &&
          typeof me === "object" &&
          (me.id || (me.email && String(me.email).includes("@")) || me.username);
        if (alive && ok) {
          navigate("/feed", { replace: true });
        }
      } catch {
        // silencioso: permanece na tela de auth
      }
    })();
    return () => {
      alive = false;
    };
  }, [navigate]);

  async function handleLogin({ email, password }) {
    // A API espera "username", então enviamos o e-mail neste campo
    await signIn({
      username: String(email || "").trim(),
      password: String(password || ""),
    });

    // informa o AppShell para revalidar a sessão
    window.dispatchEvent(new CustomEvent("patanet:auth-updated"));

    navigate("/feed", { replace: true });
  }

  async function handleSignup(payload) {
    const fd = new FormData();
    fd.append("name", payload.name.trim());
    if (payload.username?.trim()) fd.append("username", payload.username.trim());
    if (payload.email?.trim()) fd.append("email", payload.email.trim().toLowerCase());
    fd.append("password", payload.password);

    if (payload.imageFile) {
      // arquivo já vem possivelmente comprimido
      fd.append("image", payload.imageFile);
    }

    await http.post("/users", fd); // sem forçar Content-Type (Axios define)

    // Após criar, efetua login automático com EMAIL + SENHA
    await handleLogin({ email: payload.email, password: payload.password });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (mode === "signup") {
        if (!terms) {
          setError("Você precisa aceitar os termos.");
          return;
        }
        if (!name || !email || !password) {
          setError("Preencha nome, e-mail e senha.");
          return;
        }
        await handleSignup({
          name,
          username,
          email,
          password,
          imageFile: pickedFile || null,
        });
      } else {
        // LOGIN APENAS COM EMAIL
        const emailField = String(email || "").trim();
        if (!emailField || !password) {
          setError("Informe email e senha.");
          return;
        }
        await handleLogin({ email: emailField, password });
      }
    } catch (err) {
      const status = err?.response?.status;
      const rawMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Não foi possível autenticar.";

      // Mensagem mais clara para casos de payload grande (muitas vezes aparece como CORS)
      if (status === 413 || /payload too large/i.test(rawMsg)) {
        setError("Imagem muito grande para envio. Tente uma foto menor.");
      } else {
        setError(rawMsg);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen w-full overflow-hidden bg-gradient-to-b from-zinc-50 to-zinc-100 text-zinc-900 dark:from-[#0F141B] dark:to-[#0B1117] dark:text-zinc-100">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-0 px-4 py-10 md:grid-cols-2 md:py-14 lg:py-16">
        {/* coluna da imagem */}
        <div className="relative hidden select-none items-end justify-center md:flex">
          <img
            src={dogImg}
            alt="Dog"
            className="pointer-events-none w-[88%] max-w-[820px] translate-y-6 drop-shadow-2xl transition-transform duration-700 ease-out will-change-transform md:translate-x-[-4%] md:scale-105"
          />
          <div className="absolute left-10 top-10 text-3xl font-semibold tracking-tight text-orange-500">
            <span className="mr-2">🐶</span> PET{" "}
            <span className="text-zinc-700 dark:text-zinc-200">EASY</span>
          </div>
        </div>

        {/* card do formulário */}
        <div className="flex items-center justify-center">
          <div className="relative w-full max-w-xl rounded-3xl bg-white/70 p-8 shadow-xl backdrop-blur-md transition-colors dark:bg-white/5 md:p-10">
            <div className="mb-4 flex items-center justify-end">
              <button
                onClick={toggleTheme}
                className="inline-flex items-center gap-2 rounded-full border border-black/10 px-3 py-1 text-xs text-[var(--fg)] hover:bg-black/[0.03] dark:border-white/10 dark:hover:bg-white/5"
                type="button"
                aria-label="Alternar tema"
                title="Alternar tema"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {theme === "dark" ? "Claro" : "Escuro"}
              </button>
            </div>

            {/* badge topo */}
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
            <p className="mb-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Bem Vindo! Por favor entre com suas informações para darmos início
              em sua jornada!
            </p>

            <form onSubmit={onSubmit} className="space-y-4">
              {mode === "signup" && (
                <>
                  {/* Avatar */}
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img
                        src={
                          preview ||
                          "https://api.dicebear.com/8.x/identicon/svg?seed=patanet"
                        }
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

                    <div className="flex-1 text-sm opacity-70">
                      Foto de perfil (opcional)
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm">Nome</label>
                    <input
                      className="w-full rounded-xl border border-zinc-300/70 bg-white/70 px-4 py-3 outline-none ring-0 transition focus:border-orange-400 dark:border-white/10 dark:bg-white/5"
                      placeholder="Seu nome completo"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm">
                      Usuário (opcional)
                    </label>
                    <input
                      className="w-full rounded-xl border border-zinc-300/70 bg-white/70 px-4 py-3 outline-none ring-0 transition focus:border-orange-400 dark:border-white/10 dark:bg-white/5"
                      placeholder="apelido"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div>
                <label className="mb-1 block text-sm">Email</label>
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
              </div>

              {mode === "signup" && (
                <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <input
                    type="checkbox"
                    className="size-4 accent-orange-500"
                    checked={terms}
                    onChange={(e) => setTerms(e.target.checked)}
                  />
                  Aceito os Termos e Condições
                </label>
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
            </form>

            <p className="mt-5 text-center text-sm text-zinc-500 dark:text-zinc-400">
              {switchText}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
