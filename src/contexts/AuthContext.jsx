// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  getCurrentUser,
  loginWithPassword,
  logout as storageLogout,
  registerUser,
} from "@/features/auth/services/authStorage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  // carrega sessão ao iniciar
  useEffect(() => {
    setMe(getCurrentUser());
    setLoading(false);

    // sincroniza entre abas
    const onStorage = (ev) => {
      if (ev.key === "pe_session" || ev.key === "pe_users") {
        setMe(getCurrentUser());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const login = async ({ login, password }) => {
    const user = loginWithPassword({ login, password });
    setMe(user);
    return user;
  };

  const register = async (payload) => {
    const user = registerUser(payload);
    setMe(user);
    return user;
  };

  const signout = () => {
    storageLogout();
    setMe(null);
  };

  const value = useMemo(
    () => ({ me, loading, login, register, logout: signout }),
    [me, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
