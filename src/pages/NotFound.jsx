import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center p-4 text-center">
      <div>
        <h1 className="text-2xl font-bold">404</h1>
        <p className="opacity-70">Página não encontrada ou rota exige login.</p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <Link className="rounded-md border px-3 py-1 text-sm" to="/">
            Ir para o Feed
          </Link>
          <Link className="rounded-md border px-3 py-1 text-sm" to="/login">
            Fazer login
          </Link>
        </div>
      </div>
    </div>
  );
}
