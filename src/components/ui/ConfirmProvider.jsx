// src/components/ui/ConfirmProvider.jsx
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

const ConfirmCtx = createContext(null);
export function useConfirm() {
  const ctx = useContext(ConfirmCtx);
  if (!ctx) throw new Error("ConfirmProvider ausente");
  const callable = ctx.confirm;
  callable.prompt = ctx.prompt;
  callable.select = ctx.select;
  return callable;
}

export function usePrompt() {
  const ctx = React.useContext(ConfirmCtx);
  if (!ctx)
    throw new Error("usePrompt deve ser usado dentro de <ConfirmProvider/>");
  return ctx.prompt;
}

export default function ConfirmProvider({ children }) {
  const [state, setState] = useState({
    open: false,
    mode: "confirm", // 'confirm' | 'prompt' | 'select'
    options: {},
    resolve: null,
  });
  const panelRef = useRef(null);

  const close = useCallback(() => setState((s) => ({ ...s, open: false })), []);

  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      setState({ open: true, mode: "confirm", options, resolve });
    });
  }, []);
  const prompt = useCallback((options = {}) => {
    return new Promise((resolve) => {
      setState({ open: true, mode: "prompt", options, resolve });
    });
  }, []);
  const select = useCallback((options = {}) => {
    return new Promise((resolve) => {
      setState({ open: true, mode: "select", options, resolve });
    });
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (!state.open) return;
      if (e.key === "Escape") {
        // cancel
        if (state.mode === "prompt") state.resolve && state.resolve("");
        else if (state.mode === "select") state.resolve && state.resolve(null);
        else state.resolve && state.resolve(false);
        close();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state, close]);

  const value = useMemo(() => ({ confirm, prompt, select }), [confirm, prompt, select]);

  const { open, mode, options, resolve } = state;
  const tone = options.tone === "danger" ? "danger" : "default";

  return (
    <ConfirmCtx.Provider value={value}>
      {children}

      {open && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-4"
          onMouseDown={(e) => {
            // clique no backdrop cancela
            if (e.target === e.currentTarget) {
              if (mode === "prompt") resolve && resolve("");
              else if (mode === "select") resolve && resolve(null);
              else resolve && resolve(false);
              close();
            }
          }}
          onContextMenu={(e) => e.preventDefault()}
        >
          <div
            ref={panelRef}
            className="w-full max-w-md overflow-hidden rounded-xl border border-slate-700/40 bg-slate-900 text-slate-100 shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-700/40 px-5 py-3">
              <h3 className="text-base font-semibold">
                {options.title || (mode === "prompt" ? "Digite um valor" : "Confirmação")}
              </h3>
              <button
                className="rounded p-1 hover:bg-white/10"
                onClick={() => {
                  if (mode === "prompt") resolve && resolve("");
                  else if (mode === "select") resolve && resolve(null);
                  else resolve && resolve(false);
                  close();
                }}
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-4">
              {options.description && (
                <p className="text-sm opacity-80 whitespace-pre-wrap">{options.description}</p>
              )}

              {mode === "prompt" && (
                <PromptInput
                  defaultValue={options.defaultValue || ""}
                  placeholder={options.placeholder || ""}
                  confirmText={options.confirmText || "OK"}
                  onSubmit={(val) => {
                    resolve && resolve(val);
                    close();
                  }}
                  onCancel={() => {
                    resolve && resolve("");
                    close();
                  }}
                />
              )}

              {mode === "select" && (
                <div className="grid gap-2">
                  {(options.options || []).map((opt) => (
                    <button
                      key={opt.id}
                      className={`w-full rounded-md border px-3 py-2 text-left transition
                        ${
                          opt.tone === "danger"
                            ? "border-red-500/40 hover:bg-red-500/10 text-red-300"
                            : "border-slate-700 hover:bg-white/5"
                        }`}
                      onClick={() => {
                        resolve && resolve(opt);
                        close();
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer (confirm) */}
            {mode === "confirm" && (
              <div className="flex justify-end gap-2 border-t border-slate-700/40 px-5 py-3">
                <button
                  className="rounded-md border border-slate-700 px-3 py-1.5 text-sm hover:bg-white/5"
                  onClick={() => {
                    resolve && resolve(false);
                    close();
                  }}
                >
                  {options.cancelText || "Cancelar"}
                </button>
                <button
                  className={`rounded-md px-3 py-1.5 text-sm text-white ${
                    tone === "danger"
                      ? "bg-red-600 hover:bg-red-500"
                      : "bg-slate-600 hover:bg-slate-500"
                  }`}
                  onClick={() => {
                    resolve && resolve(true);
                    close();
                  }}
                >
                  {options.confirmText || "Confirmar"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </ConfirmCtx.Provider>
  );
}

function PromptInput({ defaultValue, placeholder, confirmText, onSubmit, onCancel }) {
  const [val, setVal] = useState(defaultValue);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(val);
      }}
      className="grid gap-3"
    >
      <input
        className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none focus:border-slate-500"
        placeholder={placeholder}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        autoFocus
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          className="rounded-md border border-slate-700 px-3 py-1.5 text-sm hover:bg-white/5"
          onClick={onCancel}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="rounded-md bg-slate-600 px-3 py-1.5 text-sm text-white hover:bg-slate-500"
        >
          {confirmText}
        </button>
      </div>
    </form>
  );
}
