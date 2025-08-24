import React from "react";
import clsx from "clsx";

/**
 * ContentCard: cartão de conteúdo com suporte a título, descrição e ações.
 *
 * Props:
 * - title?: string
 * - description?: string
 * - actions?: ReactNode
 * - className?: string (ex.: "border-dashed")
 * - children?: ReactNode (corpo do cartão)
 * - padding?: boolean (default: true) — controla padding do corpo
 */
export default function ContentCard({
  title,
  description,
  actions,
  className,
  children,
  padding = true,
}) {
  return (
    <div
      className={clsx(
        // base consistente claro/escuro
        "rounded-xl border shadow-sm transition-colors",
        "border-slate-200 bg-white/95 text-slate-900",
        "dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-100",
        className
      )}
    >
      {(title || description || actions) && (
        <div className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              {title && <div className="text-sm font-medium">{title}</div>}
              {description && (
                <p className="mt-1 text-sm opacity-70">{description}</p>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-2">{actions}</div>
            )}
          </div>
        </div>
      )}

      {children != null && (
        <div className={clsx(padding && "p-4")}>{children}</div>
      )}
    </div>
  );
}
