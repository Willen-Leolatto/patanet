// src/store/auth.jsx
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Shape único do usuário no app:
// { id, name, username, email, image }
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
  email: u.email ?? "",
  image: u.image ?? "",
});

export const useAuth = create(
  persist(
    (set, get) => ({
      user: null,        // <- nunca será user.user
      hydrated: false,   // <- sinaliza rehidratação

      login: (payload) => {
        const user = normalizeUser(payload);
        set({ user });
        return user;
      },

      logout: () => set({ user: null }),

      updateProfile: (patch) => {
        const cur = get().user || {};
        set({ user: { ...cur, ...patch } });
      },
    }),
    {
      name: "patanet_auth",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      onRehydrateStorage: () => () => {
        // marca como hidratado após carregar do storage
        useAuth.setState({ hydrated: true });
      },
    }
  )
);

// Helpers (opcional)
export const useCurrentUserId = () =>
  useAuth(
    (s) =>
      s.user?.id ||
      s.user?.uid ||
      s.user?.email ||
      s.user?.username ||
      null
  );
export const useIsAuthHydrated = () => useAuth((s) => s.hydrated);
