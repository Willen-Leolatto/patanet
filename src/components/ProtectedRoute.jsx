import React from "react";
import { Navigate } from "react-router-dom";
import { getSession } from "@features/auth/services/authStorage";

export default function ProtectedRoute({ children }) {
  const { user } = getSession();
  if (user) return children;
  return <Navigate to="/login" replace />;
}
