// src/components/ConfirmProvider.jsx
import React from "react";

const ConfirmCtx = React.createContext(null);

export function useConfirm() {
  const ctx = React.useContext(ConfirmCtx);
  if (!ctx) throw new Error("useConfirm deve ser usado dentro de <ConfirmProvider/>");
  return ctx.confirm;
}

export function usePrompt() {
  const ctx = React.useContext(ConfirmCtx);
  if (!ctx) throw new Error("usePrompt deve ser usado dentro de <ConfirmProvider/>");
  return ctx.prompt;
}

export default function ConfirmProvider({ children }) {
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState("confirm"); // "confirm" | "prompt"
  const [opts, setOpts] = React.useState(null);
  const resolverRef = React.useRef(null);

  // para prompt
  const [value, setValue] = React.useState("");
  const [error, setError] = React.useState("");

  const close = React.useCallback(() => {
    setOpen(false);
    setTimeout(() => {
      setOpts(null);
      setValue("");
      setError("");
      setMode("confirm");
      resolverRef.current = null;
    }, 150);
  }, []);

  const confirm = React.useCallback((options = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = (ok) => resolve(!!ok);
      setMode("confirm");
      setOpts({
        title: "Confirmar ação",
        description: "",
        confirmText: "Confirmar",
        cancelText: "Cancelar",
        tone: "default", // "default" | "danger"
        ...options,
      });
      setOpen(true);
    });
  }, []);

  const prompt = React.useCallback((options = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = (result) => resolve(result);
      const merged = {
        title: "Editar",
        description: "",
        label: "Valor",
        initialValue: "",
        placeholder: "",
        confirmText: "Salvar",
        cancelText: "Cancelar",
        validate: null, // (val) => true|false
        ...options,
      };
      setMode("prompt");
      setOpts(merged);
      setValue(merged.initialValue || "");
      setOpen(true);
    });
  }, []);

  const onCancel = () => {
    if (!resolverRef.current) return;
    if (mode === "confirm") resolverRef.current(false);
    else resolverRef.current(null);
    close();
  };

  const onConfirm = () => {
    if (!resolverRef.current) return;
    if (mode === "confirm") {
      resolverRef.current(true);
      close();
    } else {
      if (opts?.validate && !opts.validate(value)) {
        setError(typeof opts.validateError === "string" ? opts.validateError : "Valor inválido.");
        return;
      }
      resolverRef.current(value);
      close();
    }
  };

  // atalhos de teclado
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, mode, value]);

  const primaryBase =
    opts?.tone === "danger"
      ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
      : "bg-[#f77904] hover:bg-[#e86e02] focus:ring-[#f77904]";

  return (
    <ConfirmCtx.Provider value={{ confirm, prompt }}>
      {children}

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-[100]">
          {/* overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-[1px] opacity-100 transition-opacity"
            onClick={onCancel}
          />
          {/* dialog */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div
              role="dialog"
              aria-modal="true"
              className="w-full max-w-md origin-center rounded-2xl bg-slate-900 text-slate-100 shadow-xl outline outline-1 outline-white/10 transition-all
                        data-[state=open]:scale-100 data-[state=open]:opacity-100 scale-95 opacity-0"
              data-state="open"
            >
              <div className="px-5 pt-5">
                <h3 className="text-base font-semibold">{opts?.title}</h3>
                {opts?.description ? (
                  <p className="mt-1 text-sm text-slate-300">{opts.description}</p>
                ) : null}
              </div>

              {mode === "prompt" && (
                <div className="px-5 pt-3">
                  {opts?.label ? (
                    <label className="mb-1 block text-xs font-medium text-slate-300">
                      {opts.label}
                    </label>
                  ) : null}
                  <input
                    autoFocus
                    value={value}
                    onChange={(e) => {
                      setValue(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder={opts?.placeholder || ""}
                    className="w-full rounded-md border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white
                               outline-none focus:ring-2 focus:ring-[#f77904]"
                  />
                  {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
                </div>
              )}

              <div className="mt-5 flex items-center justify-end gap-2 border-t border-white/10 px-5 py-4">
                <button
                  className="inline-flex h-9 items-center rounded-md bg-slate-700 px-3 text-sm hover:bg-slate-600"
                  onClick={onCancel}
                >
                  {opts?.cancelText || "Cancelar"}
                </button>
                <button
                  className={`inline-flex h-9 items-center rounded-md px-3 text-sm text-white focus:outline-none focus:ring-2 ${primaryBase}`}
                  onClick={onConfirm}
                >
                  {opts?.confirmText || "Confirmar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConfirmCtx.Provider>
  );
}
