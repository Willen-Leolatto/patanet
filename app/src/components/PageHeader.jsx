import React from "react";
import Breadcrumbs from "./Breadcrumbs";

/**
 * Props:
 * - title: string
 * - description?: string
 * - breadcrumbs?: {label: string, to?: string}[]
 * - actions?: React.ReactNode
 */
export default function PageHeader({
  title,
  description,
  breadcrumbs = [],
  actions,
}) {
  return (
    <div className="space-y-3 mb-6">
      {breadcrumbs.length > 0 && (
        <div className="opacity-90">
          <Breadcrumbs items={breadcrumbs} />
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold leading-tight">{title}</h1>
          {description && (
            <p className="text-sm opacity-70 mt-1">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
