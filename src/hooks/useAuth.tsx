import { useContext } from "react";
import { AuthCtx } from "../contexts/AuthContext";

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
