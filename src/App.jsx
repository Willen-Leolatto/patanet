import React from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { ToastProvider } from "./components/ui/ToastProvider";
import ConfirmProvider from "@/components/ui/ConfirmProvider.jsx";

export default function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <RouterProvider router={router} />
      </ConfirmProvider>
    </ToastProvider>
  );
}
