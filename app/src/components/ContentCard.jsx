import React from "react";
import clsx from "clsx";

/**
 * ContentCard: cartão de conteúdo com suporte a título, descrição e ações.
 * Props:
 * - title?: string
 * - description?: string
 * - actions?: ReactNode
 * - className?: string
 * - children?: ReactNode
 * - padding?: boolean (default: true)
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
    <div className={clsx("elevated-card animate-fade-in", className)}>
      {(title || description || actions) && (
        <div className={clsx(padding && "p-4", "border-b border-[color:var(--card-border)]")}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              {title && <h3 className="text-sm font-medium">{title}</h3>}
              {description && <p className="mt-1 text-xs text-muted">{description}</p>}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        </div>
      )}
      {children != null && <div className={clsx(padding && "p-4")}>{children}</div>}
    </div>
  );
}
