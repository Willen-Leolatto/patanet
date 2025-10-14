import React from "react";

/**
 * IconButton – botão de ícone consistente em todo o app
 * variant: "primary" (laranja #f77904) | "ghost" (neutro)
 */
export default function IconButton({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  variant = "ghost",
  className = "",
  type = "button",
}) {
  const base =
    "inline-flex items-center justify-center rounded-md h-8 w-8 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1";
  const styles =
    variant === "primary"
      ? "bg-[#f77904] text-white hover:opacity-90"
      : "bg-transparent text-slate-300 hover:bg-slate-700/50";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`${base} ${styles} disabled:opacity-50 ${className}`}
    >
      <Icon className="h-4 w-4" />
      <span className="sr-only">{label}</span>
    </button>
  );
}
