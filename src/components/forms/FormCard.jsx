import React from "react";
import clsx from "clsx";

/**
 * Cartão-base para formulários.
 * Props:
 * - title, description
 * - onSubmit: (e) => void   // passe o handleSubmit do RHF
 * - children: conteúdo do formulário
 * - footer?: ReactNode      // opcional, substitui os botões padrão
 * - className?: string
 */
export default function FormCard({
  title,
  description,
  onSubmit,
  children,
  footer,
  className,
}) {
  return (
    <form
      onSubmit={onSubmit}
      className={clsx(
        "rounded-xl border shadow-sm transition-colors",
        "border-slate-200 bg-white/95 text-slate-900",
        "dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-100",
        className
      )}
    >
      {(title || description) && (
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-semibold leading-tight">{title}</h2>
          {description && (
            <p className="text-sm opacity-70 mt-1">{description}</p>
          )}
        </div>
      )}

      <div className="p-4">{children}</div>

      <div
        className="flex items-center justify-end gap-2 p-3 border-t
                      border-slate-200 dark:border-slate-800"
      >
        {footer ?? (
          <>
            <button
              type="button"
              onClick={() => history.back()}
              className="rounded-md border px-3 py-2 text-sm
                         border-slate-300 hover:bg-slate-100
                         dark:border-slate-700 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-md border px-3 py-2 text-sm
                         border-slate-300 bg-slate-900 text-white hover:opacity-90
                         dark:border-slate-700"
            >
              Salvar
            </button>
          </>
        )}
      </div>
    </form>
  );
}
