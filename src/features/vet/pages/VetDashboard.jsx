import React from "react";
import { Navigate } from "react-router-dom";

export default function VetDashboard() {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <h1 className="text-2xl font-bold">Dashboard Vet</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
        Atalhos rápidos do modo Vet.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Card title="Agenda" to="/vet/agenda" desc="Semana/dia + bloqueios" />
        <Card title="Consultas" to="/vet/consultas" desc="Inbox por status" />
        <Card title="Procedimentos" to="/vet/procedimentos" desc="Lista e duração" />
        <Card title="Pets" to="/vet/pets" desc="Carteira clínica e prontuário" />
        <Card title="Perfil" to="/vet/perfil" desc="Seus dados e clínicas" />
      </div>

      {/* compat: mantém URL /vet funcional mesmo enquanto migramos */}
      <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="font-semibold">Observação</div>
        <div className="mt-1 text-zinc-600 dark:text-zinc-300">
          Estamos migrando a antiga tela “Área Vet” para um modo Vet completo.
        </div>
      </div>
    </div>
  );
}

function Card({ title, desc, to }) {
  return (
    <a
      href={to}
      className="block rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm hover:shadow-md transition dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="text-base font-semibold">{title}</div>
      <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{desc}</div>
    </a>
  );
}
