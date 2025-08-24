import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

import { AuthProvider } from "./contexts/AuthContext";
import "./index.css";
import "./store/theme"; // ⬅ importa pelos efeitos (aplica tema imediatamente)

import { registerSW } from "virtual:pwa-register";
const updateSW = registerSW({
  onNeedRefresh() {
    // mostra um prompt simples; você pode trocar por seu Toast/Confirm
    if (confirm("Nova versão do PataNet disponível. Atualizar agora?")) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    // opcional: console/log ou toast “pronto para offline”
    console.log("PataNet pronto para uso offline.");
  },
});

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
