// src/features/policy/pages/Privacy.jsx
import React from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Mail, FileText, ArrowLeft } from "lucide-react";

const PRIVACY_EMAIL = "dev.patanet@gmail.com";

export default function Privacy() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <header className="mb-6">
        <Link to="/feed" className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800">
          <ArrowLeft className="h-4 w-4" /> Voltar ao feed
        </Link>
        <div className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
          <FileText className="h-4 w-4" /> Política
        </div>
        <h1 className="mt-3 text-2xl font-bold">Política de Privacidade — PataNet</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Esta política descreve como o PataNet lida com dados pessoais e conteúdo gerado por usuários. (Resumo em linguagem simples.)
        </p>
      </header>

      <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold">1) Quem somos</h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-200">
          Aplicativo: <b>PataNet</b>. Contato de privacidade: <b>{PRIVACY_EMAIL}</b>.
        </p>

        <h2 className="text-lg font-semibold">2) Dados que podem ser coletados</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-700 dark:text-zinc-200">
          <li>
            <b>Dados de conta/perfil:</b> nome/usuário, e-mail, foto, bio.
          </li>
          <li>
            <b>Conteúdo do usuário (UGC):</b> posts, comentários, imagens e metadados do conteúdo.
          </li>
          <li>
            <b>Dados técnicos:</b> informações necessárias para operação, segurança e prevenção de abuso (ex.: registros de erro, IP/logs no servidor,
            identificadores internos).
          </li>
        </ul>

        <h2 className="text-lg font-semibold">3) Finalidades de uso</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-700 dark:text-zinc-200">
          <li>Operar o serviço (feed, perfil, criação e exibição de posts).</li>
          <li>Segurança, prevenção de fraude/abuso, moderação e conformidade com políticas (incluindo CSAE).</li>
          <li>Melhoria de estabilidade e desempenho (diagnóstico de falhas).</li>
        </ul>

        <h2 className="text-lg font-semibold">4) Compartilhamento</h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-200">
          Podemos compartilhar dados com provedores necessários para operar o serviço (por exemplo, infraestrutura/armazenamento) e quando exigido por lei
          ou para proteger usuários e a plataforma.
        </p>

        <h2 className="text-lg font-semibold">5) Retenção e exclusão</h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-200">
          Mantemos dados enquanto necessário para fornecer o serviço e cumprir obrigações legais/segurança. Você pode solicitar a exclusão da sua conta e
          dados associados.
        </p>

        <div className="flex flex-col gap-2 sm:flex-row">
          <a
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f77904] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            href="/excluir-conta"
          >
            Solicitar exclusão de conta
          </a>
          <a
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            href={`mailto:${PRIVACY_EMAIL}?subject=${encodeURIComponent("[PRIVACIDADE] PataNet")}`}
          >
            <Mail className="h-4 w-4" /> Contato
          </a>
        </div>

        <h2 className="text-lg font-semibold">6) Direitos e solicitações</h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-200">
          Para dúvidas, correções, solicitações de acesso/portabilidade ou exclusão, entre em contato pelo e-mail acima.
        </p>

        <div className="text-sm">
          <a className="text-[#f77904] hover:underline" href="/privacidade.html" target="_blank" rel="noreferrer">
            Versão HTML (para compartilhamento) <ExternalLink className="inline h-4 w-4" />
          </a>
        </div>

        <p className="mt-2 text-xs text-zinc-500">Última atualização: 24/02/2026</p>
      </section>
    </div>
  );
}
