// src/store/ui.js
import { create } from "zustand";

const KEY = "patanet_ui";

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}
function save(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {} }

export const useUI = create((set, get) => ({
  sidebarOpen: false,          // overlay no mobile
  sidebarCollapsed: false,     // modo compacto no desktop
  initFromStorage() {
    const s = load();
    set({ sidebarCollapsed: !!s.sidebarCollapsed });
  },
  toggleSidebar() { set(s => ({ sidebarOpen: !s.sidebarOpen })); },
  closeSidebar() { set({ sidebarOpen: false }); },
  toggleCollapse() {
    const next = !get().sidebarCollapsed;
    set({ sidebarCollapsed: next });
    const s = load(); s.sidebarCollapsed = next; save(s);
  },
}));
