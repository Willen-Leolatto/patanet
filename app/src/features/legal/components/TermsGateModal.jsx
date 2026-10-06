// src/features/legal/components/TermsGateModal.jsx
import React, { useEffect, useState } from "react";
import { ShieldCheck, FileText } from "lucide-react";

import { fetchTermsStatus, acceptTerms, CURRENT_TERMS_VERSION } from "@/api/terms.api.js";
import { useToast } from "@/components/ui/ToastProvider";

/**
 * Modal bloqueante de Termos LGPD.
 *
 * Exibido sempre que o usuário logado ainda não aceitou a versão vigente
 * dos Termos de Uso / Política de Privacidade. Diferente do ConfirmProvider,
 * este modal não pode ser fechado via ESC/backdrop — só sai ao aceitar.
 */
export default function TermsGateModal({ userId }) {
  const toast = useToast();
  const [status, setStatus] = useState(null); // null = ainda carregando
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancel = false;
    if (!userId) {
      setStatus(null);
      return;
    }
    (async () => {
      try {
        const s = await fetchTermsStatus({ userId });
        if (!cancel) setStatus(s);
      } catch {
        // Falha de rede pontual: não bloqueia o app por uma instabilidade
        // transitória; o gate será reavaliado na próxima navegação/login.
        if (!cancel) setStatus({ requiresAcceptance: false });
      }
    })();
    return () => {
      cancel = true;
    };
  }, [userId]);

  const open = Boolean(status?.requiresAcceptance);

  async function handleAccept() {
    if (!checked || submitting) return;
    setSubmitting(true);
    try {
      await acceptTerms({ userId, version: status?.currentVersion || CURRENT_TERMS_VERSION });
      setStatus((s) => ({ ...s, requiresAcceptance: false }));
    } catch (e) {
      console.error(e);
      toast.error("Não foi possível registrar seu aceite agora. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-gate-title"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-900">
        <div className="flex items-center gap-2 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <ShieldCheck className="h-5 w-5 text-[#f77904]" />
          <h2 id="terms-gate-title" className="text-base font-semibold">
            Atualizamos nossos Termos e Política de Privacidade
          </h2>
        </div>

        <div className="max-h-[45vh] overflow-y-auto px-5 py-4 text-sm text-zinc-700 dark:text-zinc-200">
          <p>
            Para continuar usando o PataNet, você precisa revisar e aceitar a
            versão vigente dos nossos Termos de Uso e da Política de
            Privacidade, em conformidade com a Lei Geral de Proteção de Dados
            (LGPD). Isso inclui como tratamos os dados do seu perfil, dos
            seus pets e das informações enviadas por meio de recursos como o
            "Avistei um Pet".
          </p>
          <a
            href={status?.termsUrl || "/privacidade"}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-2 text-[#f77904] hover:underline"
          >
            <FileText className="h-4 w-4" /> Ler o texto completo
          </a>
        </div>

        <div className="border-t border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <label className="flex cursor-pointer items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-orange-500"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
            />
            Li e concordo com os Termos de Uso e a Política de Privacidade.
          </label>

          <button
            type="button"
            onClick={handleAccept}
            disabled={!checked || submitting}
            className="mt-4 w-full rounded-xl bg-[#f77904] px-4 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Confirmando…" : "Aceitar e continuar"}
          </button>
        </div>
      </div>
    </div>
  );
}
