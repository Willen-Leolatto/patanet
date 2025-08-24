import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { createPortal } from "react-dom";
import { playSfx } from "../../utils/sfx";

const ConfirmCtx = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null); // {title, message, description, confirmText, cancelText, variant, resolve}
  const cancelRef = useRef(null);
  const confirmRef = useRef(null);
  const previouslyFocused = useRef(null);

  const confirm = useCallback((opts) => {
    return new Promise((resolve) => {
      previouslyFocused.current = document.activeElement;
      setState({
        title: "Tem certeza?",
        message: "",
        description: "",
        confirmText: "Confirmar",
        cancelText: "Cancelar",
        variant: "danger",
        ...opts,
        resolve,
      });
    });
  }, []);

  const close = useCallback((result) => {
    setState((curr) => {
      if (curr?.resolve) curr.resolve(result);
      return null;
    });
    // retorna o foco onde estava
    if (previouslyFocused.current && previouslyFocused.current.focus) {
      previouslyFocused.current.focus();
    }
  }, []);

  // Ao abrir: foca "Cancelar", toca sfx
  useEffect(() => {
    if (!state) return;
    // foco
    const t = setTimeout(() => cancelRef.current?.focus(), 0);
    // sfx
    playSfx("warning");
    return () => clearTimeout(t);
  }, [state]);

  // Acessibilidade: Esc cancela, Enter confirma
  useEffect(() => {
    if (!state) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close(false);
      }
      if (e.key === "Enter") {
        e.preventDefault();
        close(true);
      }
      // focus trap básico
      if (e.key === "Tab") {
        const focusables = [cancelRef.current, confirmRef.current].filter(
          Boolean
        );
        if (focusables.length < 2) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [state, close]);

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      {state &&
        createPortal(
          <div
            className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 p-4"
            aria-hidden="false"
          >
            <div
              className="w-full max-w-md rounded-xl border shadow-xl
                       border-slate-200 bg-white text-slate-900
                       dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="confirm-title"
              aria-describedby="confirm-desc"
              onClick={(e) => e.stopPropagation()} // não fecha ao clicar fora
            >
              <div className="p-4">
                <h2 id="confirm-title" className="text-lg font-semibold">
                  {state.title}
                </h2>
                {(state.message || state.description) && (
                  <p id="confirm-desc" className="mt-1 text-sm opacity-80">
                    {state.message || state.description}
                  </p>
                )}
              </div>
              <div
                className="flex items-center justify-end gap-2 border-t p-3
                            border-slate-200 dark:border-slate-800"
              >
                <button
                  type="button"
                  ref={cancelRef}
                  onClick={() => {
                    playSfx("cancel");
                    close(false);
                  }}
                  className="rounded-md border px-3 py-2 text-sm
                           border-slate-300 hover:bg-slate-100
                           dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  {state.cancelText}
                </button>
                <button
                  type="button"
                  ref={confirmRef}
                  onClick={() => {
                    playSfx("success");
                    close(true);
                  }}
                  className={`rounded-md border px-3 py-2 text-sm
                           dark:border-slate-700
                           ${
                             state.variant === "danger"
                               ? "bg-red-600 text-white border-red-700 hover:opacity-90"
                               : "bg-slate-900 text-white border-slate-700 hover:opacity-90"
                           }`}
                >
                  {state.confirmText}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </ConfirmCtx.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmCtx);
  if (!ctx) throw new Error("useConfirm must be used within <ConfirmProvider>");
  return ctx;
}
