// src/features/policy/pages/PolicyHub.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FileText,
  ShieldAlert,
  Trash2,
  BookOpen,
  ArrowLeft,
} from "lucide-react";

export default function PolicyHub() {
  const navigate = useNavigate();

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

        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
          <BookOpen className="h-4 w-4" /> Ajuda e Políticas
        </div>
        <h1 className="mt-3 text-2xl font-bold">Ajuda e Políticas</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Aqui você encontra as políticas do app, diretrizes da comunidade,
          segurança infantil (CSAE) e informações de exclusão de conta.
        </p>
      </header>

      <section className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <Link
          to="/privacidade"
          className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
        >
          <span className="inline-flex items-center gap-2 text-sm font-semibold">
            <FileText className="h-4 w-4" /> Política de Privacidade
          </span>
          <span className="text-xs opacity-70">Ler</span>
        </Link>

        <Link
          to="/diretrizes"
          className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
        >
          <span className="inline-flex items-center gap-2 text-sm font-semibold">
            <ShieldAlert className="h-4 w-4" /> Diretrizes da Comunidade
          </span>
          <span className="text-xs opacity-70">Ler</span>
        </Link>

        <Link
          to="/seguranca-infantil"
          className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
        >
          <span className="inline-flex items-center gap-2 text-sm font-semibold">
            <ShieldAlert className="h-4 w-4" /> Segurança infantil (CSAE)
          </span>
          <span className="text-xs opacity-70">Ler</span>
        </Link>

        <Link
          to="/denuncia"
          className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
        >
          <span className="inline-flex items-center gap-2 text-sm font-semibold">
            <ShieldAlert className="h-4 w-4" /> Canal de denúncia (pets)
          </span>
          <span className="text-xs opacity-70">Abrir</span>
        </Link>

        <Link
          to="/excluir-conta"
          className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
        >
          <span className="inline-flex items-center gap-2 text-sm font-semibold">
            <Trash2 className="h-4 w-4" /> Solicitar exclusão de conta
          </span>
          <span className="text-xs opacity-70">Abrir</span>
        </Link>

        <p className="pt-2 text-xs text-zinc-500">Última atualização: 12/03/2026</p>
      </section>
    </div>
  );
}
