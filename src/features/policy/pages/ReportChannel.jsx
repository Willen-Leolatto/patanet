// src/features/policy/pages/ReportChannel.jsx
import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Mail, ShieldAlert, User, FileText, ArrowLeft } from "lucide-react";

const REPORT_EMAIL = "dev.patanet@gmail.com";

function mailtoUrl({ subject, body }) {
  const s = encodeURIComponent(subject || "");
  const b = encodeURIComponent(body || "");
  return `mailto:${REPORT_EMAIL}?subject=${s}&body=${b}`;
}

export default function ReportChannel() {
  const baseBody = useMemo(() => {
    const now = new Date().toISOString();
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return [
      "Olá equipe PataNet,",
      "",
      "Quero fazer uma denúncia.",
      "",
      `Data/hora (UTC): ${now}`,
      origin ? `Origem: ${origin}` : "",
      "",
      "Tipo de denúncia:",
      "- (Conteúdo / Usuário / Evento / Outro)",
      "",
      "Link/Local no app:",
      "- (Cole aqui o link ou descreva onde encontrou)",
      "",
      "Descrição:",
      "- (Explique o que ocorreu e por que considera inadequado)",
      "",
      "IDs (se souber):",
      "- Post ID:",
      "- Evento ID:",
      "- Usuário ID:",
      "",
      "Anexos (opcional):",
      "- (Inclua prints/imagens se possível)",
      "",
      "Obrigado.",
    ]
      .filter(Boolean)
      .join("\n");
  }, []);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <header className="mb-6">
        <Link
          to="/feed"
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao feed
        </Link>
        <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-800 dark:bg-orange-950/30 dark:text-orange-200">
          <ShieldAlert className="h-4 w-4" /> Canal de denúncia
        </div>
        <h1 className="mt-3 text-2xl font-bold">Denúncias e Segurança</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          A forma mais rápida é denunciar direto no app (no menu dos 3 pontinhos do post ou no perfil do usuário). Se você não conseguir acessar o app,
          use o canal por e-mail.
        </p>
      </header>

      <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
          <strong>Como denunciar no app:</strong>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>No feed: toque nos 3 pontinhos do post e escolha <em>Denunciar</em> (geral), <em>Maus-tratos</em> ou <em>CSAE</em>.</li>
            <li>No perfil do usuário: use as opções de <em>Denunciar</em> e/ou <em>Bloquear</em>.</li>
          </ul>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <a
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f77904] px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
            href={mailtoUrl({ subject: "[DENÚNCIA] PataNet", body: baseBody })}
          >
            <Mail className="h-4 w-4" /> Denunciar por e-mail
          </a>

          <a
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            href={mailtoUrl({ subject: "[DENÚNCIA CSAE] PataNet", body: baseBody })}
          >
            <ShieldAlert className="h-4 w-4" /> Denúncia CSAE
          </a>
        </div>

        <div className="mt-2 grid gap-2 text-sm">
          <Link className="inline-flex items-center gap-2 text-[#f77904] hover:underline" to="/seguranca-infantil">
            <FileText className="h-4 w-4" /> Padrões de segurança infantil
          </Link>
          <Link className="inline-flex items-center gap-2 text-[#f77904] hover:underline" to="/privacidade">
            <FileText className="h-4 w-4" /> Política de privacidade
          </Link>
          <Link className="inline-flex items-center gap-2 text-[#f77904] hover:underline" to="/usuarios">
            <User className="h-4 w-4" /> Explorar usuários
          </Link>
        </div>

        <p className="mt-2 text-xs text-zinc-500">Última atualização: 24/02/2026</p>
      </section>
    </div>
  );
}
