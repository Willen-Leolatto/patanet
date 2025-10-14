// src/App.jsx
import React from "react";
import AppRoutes from "./routes"; // agora usamos o default export (componente de rotas)
import { ToastProvider } from "./components/ui/ToastProvider";
import ConfirmProvider from "@/components/ui/ConfirmProvider.jsx";

export default function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <AppRoutes />
      </ConfirmProvider>
    </ToastProvider>
  );
}
