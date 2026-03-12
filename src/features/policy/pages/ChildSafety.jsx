// src/features/policy/pages/ChildSafety.jsx
import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldAlert, ExternalLink, Mail, ArrowLeft } from "lucide-react";

const REPORT_EMAIL = "dev.patanet@gmail.com";

function mailtoUrl({ subject, body }) {
  const s = encodeURIComponent(subject || "");
  const b = encodeURIComponent(body || "");
  return `mailto:${REPORT_EMAIL}?subject=${s}&body=${b}`;
}

export default function ChildSafety() {
  const navigate = useNavigate();
  const body = useMemo(() => {
    const now = new Date().toISOString();
    return [
      "Olá equipe PataNet,",
      "",
      "Quero denunciar um conteúdo/usuário que pode violar os Padrões de Segurança Infantil (CSAE).",
      "",
      `Data/hora (UTC): ${now}`,
      "",
      "Link/Local no app:",
      "- (Cole aqui o link ou descreva onde encontrou)",
      "",
      "Descrição da denúncia:",
      "- (Explique o que ocorreu e por que considera inadequado)",
      "",
      "Anexos (opcional):",
      "- (Inclua prints/imagens se possível)",
      "",
      "Obrigado.",
    ].join("\n");
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
        <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-800 dark:bg-orange-950/30 dark:text-orange-200">
          <ShieldAlert className="h-4 w-4" />
          Segurança infantil (CSAE)
        </div>
        <h1 className="mt-3 text-2xl font-bold">Padrões de Segurança Infantil</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Esta página descreve os padrões adotados pela PataNet para prevenir e combater exploração e abuso sexual infantil (CSAE).
        </p>
      </header>

      <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold">1) Tolerância zero</h2>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
          A PataNet possui tolerância zero para qualquer conteúdo que represente, promova, incentive ou facilite exploração e abuso sexual infantil
          (CSAE), incluindo material de abuso sexual infantil (CSAM). Conteúdo ou contas que violem estes padrões podem ser removidos e podem
          resultar em bloqueio, banimento e/ou comunicação às autoridades competentes, quando aplicável.
        </p>

        <h2 className="text-lg font-semibold">2) Conteúdos proibidos</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-700 dark:text-zinc-200">
          <li>Qualquer material sexual envolvendo menores de idade, real ou simulado.</li>
          <li>Pedidos de conteúdo sexual com menores, aliciamento (grooming) ou tentativa de contato com finalidade sexual.</li>
          <li>Compartilhamento de links, instruções ou meios para obtenção de CSAM/CSAE.</li>
          <li>Conteúdo que sexualize menores, mesmo sem nudez explícita.</li>
        </ul>

        <h2 className="text-lg font-semibold">3) Como denunciar</h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-200">
          Se você encontrar conteúdo ou comportamento suspeito, denuncie imediatamente.
          No app, use o botão <strong>CSAE</strong> disponível no feed e no perfil de usuários.
        </p>

        <div className="flex flex-col gap-2 sm:flex-row">
          <a
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f77904] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            href={mailtoUrl({
              subject: "[DENÚNCIA CSAE] PataNet",
              body,
            })}
          >
            <Mail className="h-4 w-4" />
            Denunciar por e-mail
          </a>

          <Link
            to="/denuncia"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            <ShieldAlert className="h-4 w-4" />
            Canal de denúncia
          </Link>
        </div>

        <h2 className="text-lg font-semibold">4) Moderação e resposta</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-700 dark:text-zinc-200">
          <li>As denúncias são revisadas e podem resultar em remoção de conteúdo e medidas na conta.</li>
          <li>Quando houver indícios de CSAE/CSAM, podemos encaminhar informações às autoridades competentes.</li>
          <li>Podemos solicitar informações adicionais para investigar (ex.: prints, IDs, links).</li>
        </ul>

        <h2 className="text-lg font-semibold">5) Links úteis</h2>
        <div className="flex flex-col gap-2 text-sm">
          <Link className="inline-flex items-center gap-2 text-[#f77904] hover:underline" to="/privacidade">
            Política de Privacidade
          </Link>
          <a
            className="inline-flex items-center gap-2 text-[#f77904] hover:underline"
            href="/seguranca-infantil.html"
            target="_blank"
            rel="noreferrer"
          >
            Versão HTML (para compartilhamento) <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        <p className="mt-2 text-xs text-zinc-500">
          Última atualização: 24/02/2026
        </p>
      </section>
    </div>
  );
}
