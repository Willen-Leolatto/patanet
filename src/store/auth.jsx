// src/store/auth.jsx
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Integrações com o storage local (camada de persistência)
import {
  getCurrentUser,
  loginWithPassword,
  logout as storageLogout,
  registerUser,
  updateUser as storageUpdateUser,
} from "@/features/auth/services/authStorage";

// Normalização mínima para manter shape consistente no app
const normalizeUser = (u = {}) => ({
  id:
    u.id ||
    u.uid ||
    u.email ||
    u.username ||
    (typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : String(Date.now())),
  name: u.name ?? "",
  username: u.username ?? "",
  email: (u.email || "").toLowerCase(),
  image: u.image ?? "",
});

export const useAuth = create(
  persist(
    (set, get) => ({
      user: null,      // <- shape único (NÃO aninhar: nada de user.user)
      hydrated: false, // <- indica quando o zustand reidratou

      // Boot inicial: tenta recuperar sessão existente do authStorage
      _boot: () => {
        try {
          const current = getCurrentUser();
          set({ user: current ? normalizeUser(current) : null });
        } catch {
          set({ user: null });
        }
      },

      // Login com email ou username + senha (authStorage valida credenciais)
      login: ({ login, password }) => {
        const u = loginWithPassword({ login, password });
        const user = normalizeUser(u);
        set({ user });
        return user;
      },

      // Registro cria usuário no authStorage e já autentica a sessão
      register: (payload) => {
        const u = registerUser(payload);
        const user = normalizeUser(u);
        set({ user });
        return user;
      },

      // Atualização de perfil (ex.: trocar avatar futuramente)
      updateProfile: (patch) => {
        const cur = get().user || {};
        const merged = { ...cur, ...patch };
        const updated = storageUpdateUser(merged) || merged;
        set({ user: normalizeUser(updated) });
        return updated;
      },

      // Logout: limpa sessão do authStorage e o estado do store
      logout: () => {
        storageLogout();
        set({ user: null });
      },
    }),
    {
      name: "patanet_auth",
      storage: createJSONStorage(() => localStorage),
      version: 2,
      // Ao reidratar o zustand, sincronia com a sessão real do authStorage
      onRehydrateStorage: () => (state) => {
        try {
          // Garante que estamos alinhados à sessão ativa (ou nula)
          const current = getCurrentUser();
          useAuth.setState({
            user: current ? normalizeUser(current) : null,
            hydrated: true,
          });
        } catch {
          useAuth.setState({ user: null, hydrated: true });
        }
      },
    }
  )
);

// Helpers
export const useCurrentUserId = () =>
  useAuth(
    (s) =>
      s.user?.id || s.user?.uid || s.user?.email || s.user?.username || null
  );

export const useIsAuthHydrated = () => useAuth((s) => s.hydrated);
