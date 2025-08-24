import { create } from "zustand";

const storageKey = "patanet_auth_v1";

function readPersisted() {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const useAuth = create((set, get) => ({
  user: readPersisted(),
  login: async ({ email }) => {
    // Simulação de login; troque por chamada ao backend depois
    const fakeUser = { id: "u_1", name: "Demo User", email, avatar: null };
    localStorage.setItem(storageKey, JSON.stringify(fakeUser));
    set({ user: fakeUser });
    return true;
  },
  logout: () => {
    localStorage.removeItem(storageKey);
    set({ user: null });
  },
  isAuthenticated: () => !!get().user,
}));
