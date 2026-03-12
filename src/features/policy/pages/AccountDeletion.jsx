// src/features/policy/pages/AccountDeletion.jsx
import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Trash2, ExternalLink, FileText, ArrowLeft, AlertTriangle } from "lucide-react";

import { removeOwnerAccount, getMyProfile } from "@/api/user.api.js";
import { clearTokens } from "@/api/auth.api.js";
import { useToast } from "@/components/ui/ToastProvider";

const EMAIL = "dev.patanet@gmail.com";

function mailtoUrl({ subject, body }) {
  const s = encodeURIComponent(subject || "");
  const b = encodeURIComponent(body || "");
  return `mailto:${EMAIL}?subject=${s}&body=${b}`;
}

export default function AccountDeletion() {
  const navigate = useNavigate();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [me, setMe] = useState(null);

  React.useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const u = await getMyProfile();
        if (!cancel) setMe(u || null);
      } catch {
        if (!cancel) setMe(null);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  async function handleDeleteNow() {
    const ok = window.confirm(
      "Tem certeza? Isso excluirá sua conta e dados associados. Esta ação não pode ser desfeita."
    );
    if (!ok) return;

    try {
      setBusy(true);
      await removeOwnerAccount();
      try {
        clearTokens();
      } catch {}
      window.dispatchEvent(new CustomEvent("patanet:auth-updated"));
      toast.success("Conta excluída com sucesso.");
      navigate("/auth", { replace: true });
    } catch (e) {
      console.error(e);
      toast.error(
        "Não foi possível excluir sua conta agora. Tente novamente ou use o e-mail de suporte."
      );
    } finally {
      setBusy(false);
    }
  }

  const body = useMemo(() => { 
    const now = new Date().toISOString();
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return [
      "Olá equipe PataNet,",
      "",
      "Quero solicitar a exclusão da minha conta e dos dados associados.",
      "",
      `Data/hora (UTC): ${now}`,
      origin ? `Origem: ${origin}` : "",
      "",
      "Dados para localizar minha conta:",
      "- E-mail de cadastro:",
      "- Usuário (@):",
      "- ID (se souber):",
      "",
      "Observações:",
      "- (Se quiser, descreva se deseja também excluir posts/fotos, etc.)",
      "",
      "Obrigado.",
    ]
      .filter(Boolean)
      .join("\n");
  }, []);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <header className="mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
        <div className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
          <Trash2 className="h-4 w-4" /> Exclusão de conta
        </div>
        <h1 className="mt-3 text-2xl font-bold">Solicitar exclusão de conta</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Se você criou uma conta no PataNet, você pode solicitar a exclusão. Se você estiver logado(a), pode excluir diretamente aqui. Se não conseguir acessar sua conta, use o e-mail.
        </p>
      </header>

      <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold">Excluir agora (in-app)</h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-200">
          Se você estiver logado(a), pode excluir sua conta e dados associados com um clique.
        </p>

        <button
          type="button"
          onClick={handleDeleteNow}
          disabled={busy || !me?.id}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white sm:w-auto ${
            busy || !me?.id ? "bg-zinc-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
          }`}
        >
          <Trash2 className="h-4 w-4" /> {busy ? "Excluindo…" : "Excluir minha conta"}
        </button>

        {!me?.id && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4" />
              <div>
                Para excluir diretamente aqui, faça login primeiro. Se não tiver acesso à conta, use o e-mail abaixo.
              </div>
            </div>
          </div>
        )}

        <hr className="border-zinc-200 dark:border-zinc-800" />

        <h2 className="text-lg font-semibold">Excluir por e-mail (alternativa)</h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-200">
          Caso não consiga acessar sua conta, você pode solicitar por e-mail. Inclua informações para localizar sua conta.
        </p>

        <a
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#f77904] px-4 py-3 text-sm font-semibold text-white hover:opacity-90 sm:w-auto"
          href={mailtoUrl({ subject: "[EXCLUSÃO DE CONTA] PataNet", body })}
        >
          <Mail className="h-4 w-4" /> Solicitar exclusão por e-mail
        </a>

        <h2 className="text-lg font-semibold">O que acontece depois</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-700 dark:text-zinc-200">
          <li>Vamos confirmar o pedido e orientar próximos passos (se necessário).</li>
          <li>Ao concluir, os dados associados à conta serão removidos, salvo retenções obrigatórias por motivos legais/segurança.</li>
        </ul>

        <h2 className="text-lg font-semibold">Links</h2>
        <div className="flex flex-col gap-2 text-sm">
          <Link className="inline-flex items-center gap-2 text-[#f77904] hover:underline" to="/excluir-conta.html">
            Versão HTML (para compartilhamento) <ExternalLink className="h-4 w-4" />
          </Link>
          <a className="inline-flex items-center gap-2 text-[#f77904] hover:underline" href="/privacidade">
            <FileText className="h-4 w-4" /> Política de Privacidade
          </a>
        </div>

        <p className="mt-2 text-xs text-zinc-500">Última atualização: 24/02/2026</p>
      </section>
    </div>
  );
}
