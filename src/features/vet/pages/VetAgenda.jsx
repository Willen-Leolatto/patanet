import React from "react";

export default function VetAgenda() {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <h1 className="text-2xl font-bold">Agenda</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
        Grade no desktop e visão dia no mobile (em implementação).
      </p>

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="text-sm text-zinc-500">
          Próximo passo: consumir /vet/orgs/:orgId/agenda?fromto e renderizar slots.
        </div>
      </div>
    </div>
  );
}
