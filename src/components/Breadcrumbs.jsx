import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

/** items: [{ label: string, to?: string }] */
export default function Breadcrumbs({ items = [] }) {
  if (!items.length) return null;
  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <ol className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
        {items.map((it, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={idx} className="flex items-center gap-1">
              {isLast || !it.to ? (
                <span className="truncate font-medium text-gray-700 dark:text-gray-200">
                  {it.label}
                </span>
              ) : (
                <Link to={it.to} className="truncate hover:underline">
                  {it.label}
                </Link>
              )}
              {!isLast && <ChevronRight className="h-4 w-4 opacity-60" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
