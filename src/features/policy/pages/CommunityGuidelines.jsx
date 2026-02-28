// src/features/policy/pages/CommunityGuidelines.jsx
import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, FileText, Users, ExternalLink, ArrowLeft, PawPrint, MessageCircleWarning } from "lucide-react";

export default function CommunityGuidelines() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <header className="mb-6">
        <Link
          to="/feed"
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao feed
        </Link>
        <div className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
          <Users className="h-4 w-4" /> Diretrizes
        </div>
        <h1 className="mt-3 text-2xl font-bold">Diretrizes da Comunidade</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Estas regras se aplicam a posts, comentários, fotos, perfis e interações dentro do PataNet. A ideia é simples: proteger pessoas, proteger
          animais e manter o app útil para a comunidade.
        </p>
      </header>

      <section className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold">1) O que é proibido</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-700 dark:text-zinc-200">
          <li>
            <b>Segurança infantil (CSAE/CSAM):</b> qualquer conteúdo envolvendo exploração/abuso sexual infantil.
          </li>
          <li>
            <b>Maus-tratos a animais:</b> incentivar, exibir crueldade, negligência grave ou conteúdo que promova violência contra pets.
          </li>
          <li>
            <b>Assédio, bullying, ameaças e extorsão:</b> humilhar, perseguir, ameaçar ou chantagear.
          </li>
          <li>
            <b>Ódio e discriminação:</b> conteúdo que promova violência ou ódio contra grupos protegidos.
          </li>
          <li>
            <b>Conteúdo sexual explícito e nudez:</b> pornografia ou sexualização de pessoas (principalmente menores).
          </li>
          <li>
            <b>Violência gráfica:</b> gore, crueldade explícita ou incentivo a violência.
          </li>
          <li>
            <b>Conteúdo ilegal:</b> venda/compra de itens ilícitos, instruções para crimes, etc.
          </li>
          <li>
            <b>Spam e golpes:</b> links maliciosos, phishing, automações de spam, promessas enganosas.
          </li>
          <li>
            <b>Exposição de dados pessoais:</b> publicar dados sensíveis de terceiros (endereços, documentos, telefone, etc.) sem consentimento.
          </li>
        </ul>

        <h2 className="text-lg font-semibold">2) Boas práticas (o que a gente quer ver)</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-700 dark:text-zinc-200">
          <li>Conteúdo sobre pets: cuidados, adoção responsável, dicas e histórias.</li>
          <li>Eventos: informações claras (data, hora, local) e descrição objetiva.</li>
          <li>Discussões respeitosas: discordar é ok; atacar pessoas, não.</li>
        </ul>

        <h2 className="text-lg font-semibold">3) Denúncia e bloqueio</h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-200">
          Encontrou algo impróprio? Use o menu dos 3 pontinhos no post para <b>Denunciar</b> (geral), <b>Maus-tratos</b> ou <b>CSAE</b>. Você também pode
          <b> Bloquear</b> usuários para não ver mais conteúdo deles.
        </p>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            to="/denuncia"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f77904] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            <MessageCircleWarning className="h-4 w-4" /> Canal de denúncia
          </Link>
          <Link
            to="/seguranca-infantil"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            <ShieldAlert className="h-4 w-4" /> Segurança infantil (CSAE)
          </Link>
        </div>

        <h2 className="text-lg font-semibold">4) Ações e moderação</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-700 dark:text-zinc-200">
          <li>Podemos remover conteúdo que viole estas diretrizes e aplicar medidas em contas.</li>
          <li>Em casos graves (ex.: CSAE), podemos encaminhar informações às autoridades competentes quando necessário.</li>
          <li>Podemos solicitar dados adicionais para investigação (ex.: IDs, links, prints), quando aplicável.</li>
        </ul>

        <h2 className="text-lg font-semibold">5) Links</h2>
        <div className="flex flex-col gap-2 text-sm">
          <Link className="inline-flex items-center gap-2 text-[#f77904] hover:underline" to="/privacidade">
            <FileText className="h-4 w-4" /> Política de Privacidade
          </Link>
          <a
            className="inline-flex items-center gap-2 text-[#f77904] hover:underline"
            href="/diretrizes.html"
            target="_blank"
            rel="noreferrer"
          >
            Versão HTML (para compartilhamento) <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        <p className="mt-2 text-xs text-zinc-500">Última atualização: 24/02/2026</p>
      </section>
    </div>
  );
}
