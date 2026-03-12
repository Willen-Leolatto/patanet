// src/features/policy/pages/TermsAccept.jsx
import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { http } from "@/api/axios.js";

const SUPPORT_EMAIL = "dev.patanet@gmail.com";

export default function TermsAccept() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [consent, setConsent] = useState(false);

  const termsVersion = useMemo(() => {
    return window.localStorage.getItem("patanet:terms-version") || "";
  }, []);

  const version = termsVersion || "2026-03-09";

  const TERMS_TEXT = useMemo(() => {
    return `TERMOS DE USO E DIRETRIZES (PataNet)\nVersão: ${version}\n\n1) Visão geral\nO PataNet é uma plataforma social sobre pets, eventos e comunidade. Você é responsável por todo conteúdo e ações realizadas na sua conta.\n\n2) Idade mínima\nO PataNet não é destinado a crianças. Se você não tem idade mínima exigida pela lei local para consentir com estes termos, não utilize o app.\n\n3) Conteúdo gerado por usuários (UGC)\nVocê pode criar posts, comentários e enviar imagens. Esse conteúdo pode ser visível a outros usuários.\n\n4) Conteúdo e condutas proibidas\nÉ proibido publicar, solicitar, promover ou compartilhar:\n- Exploração/abuso sexual infantil (CSAE/CSAM) ou qualquer conteúdo envolvendo menores em contexto sexual;\n- Nudez/sexo explícito, exploração sexual, pornografia;\n- Ódio, assédio, bullying, ameaças, perseguição, incitação à violência;\n- Golpes, fraudes, phishing, engenharia social, venda de itens ilegais;\n- Violência extrema, crueldade (inclui maus-tratos a animais), apologia a crimes;\n- Dados pessoais sensíveis de terceiros (ex.: documentos, endereços, telefones) sem autorização;\n- Conteúdo que viole direitos autorais/marcas de terceiros sem permissão.\n\n5) Moderação, denúncias e bloqueio\nPara manter a comunidade segura, o app oferece:\n- Denúncia de conteúdo/usuários (inclui categoria “Segurança Infantil (CSAE)”);\n- Bloqueio de usuários;\n- Ações de moderação conforme necessário (remoção de conteúdo, restrição de conta e/ou encaminhamento a autoridades quando aplicável).\n\n6) Consequências\nPodemos remover conteúdo, limitar funcionalidades ou suspender contas em caso de violações destes termos, das diretrizes ou da lei.\n\n7) Privacidade e exclusão de conta\nO uso de dados é descrito na Política de Privacidade. Você pode solicitar exclusão de conta e dados associados em “Exclusão de conta”.\n\n8) Contato\nDúvidas, denúncias e solicitações: ${SUPPORT_EMAIL}\n\nAo aceitar, você confirma que leu e concorda com estes termos e com as Diretrizes da Comunidade.`;
  }, [version]);

  async function accept() {
    if (!consent) return;
    setLoading(true);
    try {
      await http.post("/auth/accept-terms", { termsVersion: version });
      navigate("/feed", { replace: true });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="text-2xl font-bold">Termos de uso</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
        Para continuar, você precisa ler e aceitar os termos desta versão.
      </p>

      <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-zinc-700 dark:text-zinc-200">
          Versão atual: <b>{version}</b>
        </p>

        <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
          <pre className="whitespace-pre-wrap leading-relaxed">{TERMS_TEXT}</pre>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <Link className="text-[#f77904] hover:underline" to="/diretrizes">
            Diretrizes da Comunidade
          </Link>
          <span className="opacity-60">•</span>
          <Link className="text-[#f77904] hover:underline" to="/privacidade">
            Política de Privacidade
          </Link>
          <span className="opacity-60">•</span>
          <Link className="text-[#f77904] hover:underline" to="/denuncia">
            Canal de denúncia
          </Link>
          <span className="opacity-60">•</span>
          <Link className="text-[#f77904] hover:underline" to="/excluir-conta">
            Exclusão de conta
          </Link>
        </div>

        <label className="mt-4 flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-200">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1"
          />
          <span>
            Eu li e aceito os Termos de Uso e as Diretrizes da Comunidade.
          </span>
        </label>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={accept}
            disabled={loading || !consent}
            className="inline-flex items-center justify-center rounded-xl bg-[#f77904] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Salvando…" : "Aceitar termos"}
          </button>

          <a
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("[TERMS] PataNet")}`}
          >
            Contato <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        <p className="mt-3 text-xs text-zinc-500">Última atualização: 12/03/2026</p>
      </div>
    </div>
  );
}
