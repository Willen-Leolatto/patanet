import React, { createContext, useContext, useState, useCallback } from "react";
import { createPortal } from "react-dom";

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (toast) => {
      const id = Math.random().toString(36).slice(2);
      const t = { id, type: "info", duration: 3000, ...toast };
      setToasts((arr) => [...arr, t]);
      if (t.duration > 0) setTimeout(() => remove(id), t.duration);
      return id;
    },
    [remove]
  );

  const value = {
    push,
    success: (msg, opts = {}) => push({ type: "success", title: msg, ...opts }),
    error: (msg, opts = {}) => push({ type: "error", title: msg, ...opts }),
    info: (msg, opts = {}) => push({ type: "info", title: msg, ...opts }),
    remove,
  };

  return (
    <ToastCtx.Provider value={value}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed bottom-4 right-4 z-[1000] flex w-full max-w-sm flex-col gap-2 px-2">
          {toasts.map((t) => (
            <Toast key={t.id} toast={t} onClose={() => remove(t.id)} />
          ))}
        </div>,
        document.body
      )}
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

function Toast({ toast, onClose }) {
  const color =
    toast.type === "success"
      ? "border-green-600/30"
      : toast.type === "error"
      ? "border-red-600/30"
      : "border-slate-500/30";

  return (
    <div
      className={`pointer-events-auto rounded-lg border ${color} shadow-lg backdrop-blur
                  bg-white/95 text-slate-900 dark:bg-slate-900/90 dark:text-slate-100`}
      role="status"
    >
      <div className="flex items-start gap-3 p-3">
        <div className="min-w-0">
          {toast.title && (
            <div className="font-medium text-sm">{toast.title}</div>
          )}
          {toast.description && (
            <div className="text-xs opacity-80">{toast.description}</div>
          )}
        </div>
        <button
          onClick={onClose}
          className="ml-auto rounded-md px-2 py-1 text-xs opacity-70 hover:opacity-100"
          aria-label="Fechar"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
