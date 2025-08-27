import React, { createContext,  useEffect, useMemo, useState } from "react";
import {
  getSession,
  logoutMock,
  setSession,
} from "../utils/authStorage";
import { createSession } from "../services/api/auth";
import { api } from "../services/api";
import { getMyProfile } from "../services/api/user";

export const AuthCtx = createContext(null);

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
      async login({ email, password }) {
        const { access_token, refresh_token } = await createSession({
          usernameOrEmail: email,
          password,
        });
        api.defaults.headers.common.Authorization = `Bearer ${access_token}`;
        const user = await getMyProfile();
        setSession({
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.imageProfile,
          },
          token: access_token,
          refreshToken: refresh_token,
          loggedAt: Date.now(),
        });
        setUser(user);
        return user;
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

