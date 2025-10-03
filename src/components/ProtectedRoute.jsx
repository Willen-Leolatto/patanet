import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/store/auth";

export default function ProtectedRoute() {
  const user = useAuth((s) => s.user);
  const loc = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: loc }} />;
  }
  // Importantíssimo: Outlet para renderizar as rotas filhas
  return <Outlet />;
}
