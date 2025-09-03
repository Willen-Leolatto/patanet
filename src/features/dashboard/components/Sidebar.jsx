import React from "react";
import { Link, useLocation } from "react-router-dom";
import clsx from "clsx";
import { Home, Dog, Syringe, Images, Users2 } from "lucide-react";

const items = [
  { to: "/dashboard", label: "Início", icon: Home },
  { to: "/dashboard/pets", label: "Meus Pets", icon: Dog },
  { to: "/dashboard/vacinas", label: "Carteira de Vacinação", icon: Syringe },
  { to: "/dashboard/fotos", label: "Fotos", icon: Images },
  { to: "/dashboard/familia", label: "Família", icon: Users2 },
  { to: "/dashboard/configuracoes", label: "Configurações", icon: Users2 },
];

export default function Sidebar({ open }) {
  const { pathname } = useLocation();

  return (
    <aside
      className={clsx(
        "shrink-0 sticky top-14 h-[calc(100dvh-56px)] transition-all border-r border-slate-800 bg-slate-900 text-slate-100",
        open ? "w-64" : "w-0 sm:w-16"
      )}
    >
      <div
        className={clsx(
          "h-full overflow-y-auto",
          open ? "opacity-100" : "sm:opacity-100 opacity-0"
        )}
      >
        {open && <div className="p-3 text-sm font-medium">Menu</div>}
        <nav className="flex flex-col py-2">
          {items.map(({ to, label, icon: Icon }) => {
            const active =
              pathname === to ||
              (to !== "/dashboard" && pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                title={!open ? label : undefined}
                className={clsx(
                  "group relative flex items-center gap-3 px-3 py-2 text-sm hover:bg-slate-800",
                  active && "bg-slate-800 font-medium",
                  !open && "justify-center"
                )}
              >
                <Icon
                  className={clsx(
                    "h-5 w-5",
                    active
                      ? "opacity-100"
                      : "opacity-80 group-hover:opacity-100"
                  )}
                />
                <span className={clsx(open ? "block" : "hidden")}>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
