// src/features/vet/VetModeGuard.jsx
import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useVetMode } from "@/store/vetMode";
import { canUseVetMode } from "@/utils/role";

// Guard simples: só deixa acessar rotas /vet se usuário for vet/staff/admin.
// Obs: Sidebar também vai esconder o menu para não-vet.
export default function VetModeGuard({ children }) {
  const loc = useLocation();
  const { me, loading, probeMe } = useVetMode();

  useEffect(() => {
    // carrega role do usuário ao entrar em qualquer rota /vet
    probeMe?.();
  }, [probeMe]);

  if (loading) {
    return (
      <div className="min-h-dvh grid place-items-center text-sm text-zinc-500 dark:text-zinc-400">
        Carregando…
      </div>
    );
  }

  const can = canUseVetMode(me);

  if (!can) {
    return <Navigate to="/feed" replace state={{ from: loc.pathname }} />;
  }

  return children;
}
