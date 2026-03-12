// src/store/vetMode.jsx
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getMyProfile } from "@/api/user.api.js";
import { getTokenRoles } from "@/utils/jwt.js";

// preferred: "feed" | "vet" | null
export const useVetMode = create(
  persist(
    (set, get) => ({
      preferred: null,
      me: null,
      loading: false,

      setPreferred: (preferred) => set({ preferred }),

      // carrega o me para saber role
      probeMe: async () => {
        try {
          set({ loading: true });
          const me = await getMyProfile();
          // fallback: se backend não retornar role em /users/me, tenta ler do JWT
          const tokenRoles = getTokenRoles();
          const patched =
            me && typeof me === "object" && !me.role && tokenRoles.length
              ? { ...me, role: tokenRoles[0] }
              : me;
          set({ me: patched || null });
        } catch {
          set({ me: null });
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: "patanet_vet_mode",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (s) => ({ preferred: s.preferred }),
    }
  )
);
