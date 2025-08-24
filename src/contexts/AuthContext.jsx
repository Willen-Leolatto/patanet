import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getSession, loginMock, logoutMock } from "../utils/authStorage";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getSession().user);

  useEffect(() => {
    const onUpd = () => setUser(getSession().user);
    window.addEventListener("patanet:auth-updated", onUpd);
    return () => window.removeEventListener("patanet:auth-updated", onUpd);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      async login({ email, password, name }) {
        const { user: u } = await loginMock({ email, password, name });
        setUser(u);
        return u;
      },
      async logout() {
        await logoutMock();
        setUser(null);
      },
    }),
    [user]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
