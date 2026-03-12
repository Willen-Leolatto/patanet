// src/features/public/pages/PublicHome.jsx
import React from "react";
import { Link } from "react-router-dom";
import DisplayLogo from "@/assets/display.png";

export default function PublicHome() {
  return (
    <div className="min-h-dvh w-full bg-gradient-to-b from-zinc-50 to-zinc-100 text-zinc-900 dark:from-[#0F141B] dark:to-[#0B1117] dark:text-zinc-100">
      <div className="mx-auto w-full max-w-5xl px-4 py-12">
        <div className="flex flex-col items-center text-center">
          <img
            src={DisplayLogo}
            alt="PataNet"
            className="w-[240px] md:w-[320px]"
            draggable={false}
          />

          <h1 className="mt-6 text-3xl font-bold tracking-tight md:text-4xl">
            PataNet — comunidade pet
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-zinc-600 dark:text-zinc-300 md:text-base">
            Um lugar para tutores e profissionais encontrarem informação, eventos e
            compartilhar experiências com segurança.
          </p>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Link
              to="/auth"
              className="inline-flex items-center justify-center rounded-xl bg-[#f77904] px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
            >
              Entrar / Criar conta
            </Link>
            <Link
              to="/ajuda"
              className="inline-flex items-center justify-center rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Ajuda e Políticas
            </Link>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold">Como funciona</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Um resumo rápido para você começar — tanto como tutor quanto como veterinário.
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="text-sm font-semibold">Para tutores</div>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-zinc-700 dark:text-zinc-200">
                <li>Crie sua conta e complete seu perfil.</li>
                <li>Cadastre seus pets e mantenha informações básicas atualizadas.</li>
                <li>Use o Feed para postar, aprender e interagir com a comunidade.</li>
                <li>Use Eventos para encontrar iniciativas e ações locais.</li>
                <li>Denuncie e bloqueie conteúdos/usuários inadequados.</li>
              </ol>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="text-sm font-semibold">Para veterinários</div>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-zinc-700 dark:text-zinc-200">
                <li>Faça login com uma conta com perfil Vet (role VET/STAFF/ADMIN).</li>
                <li>Escolha entrar no Feed (comunidade) ou no Dashboard Vet.</li>
                <li>No Feed, use atalhos para localizar tutores e cadastrar pets.</li>
                <li>No modo Vet, acesse Agenda/Consultas/Procedimentos conforme habilitado.</li>
                <li>Mantenha a moderação ativa: denúncias e bloqueios quando necessário.</li>
              </ol>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Link
              to="/auth"
              className="inline-flex items-center justify-center rounded-xl bg-[#f77904] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Começar agora
            </Link>
            <Link
              to="/diretrizes"
              className="inline-flex items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Ler diretrizes
            </Link>
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <Card
            title="Segurança e moderação"
            desc="Denuncie conteúdo/usuários e bloqueie perfis. Tolerância zero para CSAE e maus-tratos."
            to="/seguranca-infantil"
          />
          <Card
            title="Privacidade e LGPD"
            desc="Como tratamos dados, como solicitar exclusão de conta e seus direitos."
            to="/privacidade"
          />
          <Card
            title="Diretrizes"
            desc="Regras claras sobre conteúdo permitido e proibido dentro do app."
            to="/diretrizes"
          />
        </div>

        <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
          <div className="font-semibold">Links rápidos</div>
          <div className="mt-2 flex flex-wrap gap-3">
            <Link className="text-[#f77904] hover:underline" to="/termos">
              Termos
            </Link>
            <Link className="text-[#f77904] hover:underline" to="/privacidade">
              Privacidade
            </Link>
            <Link className="text-[#f77904] hover:underline" to="/excluir-conta">
              Exclusão de conta
            </Link>
            <Link className="text-[#f77904] hover:underline" to="/denuncia">
              Canal de denúncia
            </Link>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-zinc-500">
          © {new Date().getFullYear()} PataNet
        </p>
      </div>
    </div>
  );
}

function Card({ title, desc, to }) {
  return (
    <Link
      to={to}
      className="block rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm hover:shadow-md transition dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="text-base font-semibold">{title}</div>
      <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{desc}</div>
    </Link>
  );
}
