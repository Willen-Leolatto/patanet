import { create } from "zustand";

const storageKey = "patanet_theme_v1";

function applyTheme(t) {
  const root = document.documentElement;
  root.classList.toggle("dark", t === "dark"); // chave para o Tailwind v4 com @custom-variant
  root.style.colorScheme = t === "dark" ? "dark" : "light";
}

function getInitialTheme() {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved === "light" || saved === "dark") return saved;
  } catch {}
  // fallback para preferência do sistema
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return "light";
}

// aplica na carga do módulo (antes da UI quando importado cedo)
if (typeof document !== "undefined") {
  applyTheme(getInitialTheme());
}

export const useTheme = create((set, get) => ({
  theme: getInitialTheme(),
  setTheme: (t) => {
    try {
      localStorage.setItem(storageKey, t);
    } catch {}
    applyTheme(t);
    set({ theme: t });
  },
  toggle: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    get().setTheme(next);
  },
}));
