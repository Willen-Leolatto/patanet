import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedRoute() {
  const { me, loading } = useAuth();
  const loc = useLocation();

  if (loading) return null; // ou um skeleton
  if (!me) return <Navigate to="/auth" replace state={{ from: loc }} />;
  return <Outlet />;
}
