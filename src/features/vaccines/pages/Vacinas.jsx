import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "../../../components/PageHeader";
import ContentCard from "../../../components/ContentCard";
import { Plus, Syringe, Eye, Pencil, Trash2 } from "lucide-react";
import { loadVaccines, deleteVaccine } from "../services/vaccinesStorage";
import { loadPets } from "../../pets/services/petsStorage";
import { useToast } from "../../../components/ui/ToastProvider";
import { useConfirm } from "../../../components/ui/ConfirmProvider";

/* ---------- Utils de data ---------- */
function parseISODateLocal(s) {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}
function formatPt(dateStr) {
  const d = parseISODateLocal(dateStr);
  return d ? d.toLocaleDateString() : "-";
}
function daysUntil(dateStr) {
  const d = parseISODateLocal(dateStr);
  if (!d) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.floor((d - today) / 86400000);
}

/* ---------- Chip da coluna "Próxima dose" ---------- */
function NextDoseCell({ dateStr }) {
  if (!dateStr) return <span>—</span>;
  const days = daysUntil(dateStr);
  const labelDate = formatPt(dateStr);

  let badge = null;
  if (days < 0) {
    badge = (
      <span
        className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium
                       border-red-200 bg-red-100 text-red-700
                       dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
      >
        Atrasada
      </span>
    );
  } else if (days <= 7) {
    badge = (
      <span
        className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium
                       border-amber-200 bg-amber-100 text-amber-800
                       dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
      >
        Próxima {days === 0 ? "hoje" : `em ${days} dia${days > 1 ? "s" : ""}`}
      </span>
    );
  } else {
    badge = (
      <span
        className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium
                       border-emerald-200 bg-emerald-100 text-emerald-700
                       dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
      >
        Agendada
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span>{labelDate}</span>
      {badge}
    </div>
  );
}

/* ---------- Filtro ---------- */
const FILTERS = ["todas", "atrasadas", "proximas", "agendadas"];

function filterCategory(nextDoseDate) {
  if (!nextDoseDate) return "todas"; // sem próxima dose definida -> só aparece em "Todas"
  const d = daysUntil(nextDoseDate);
  if (d < 0) return "atrasadas";
  if (d <= 7) return "proximas";
  return "agendadas";
}

function FilterTabs({ active, counts, onChange }) {
  const btnBase =
    "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs transition-colors " +
    "border-slate-300 hover:bg-slate-100 " +
    "dark:border-slate-700 dark:hover:bg-slate-800";

  const btnActive =
    "bg-slate-900 text-white hover:opacity-90 dark:bg-slate-200 dark:text-slate-900";

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className={`${btnBase} ${active === "todas" ? btnActive : ""}`}
        onClick={() => onChange("todas")}
        title="Mostrar todos os registros"
      >
        Todas{" "}
        <span
          className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] text-slate-700
                              dark:bg-slate-700 dark:text-slate-200"
        >
          {counts.todas}
        </span>
      </button>
      <button
        type="button"
        className={`${btnBase} ${active === "atrasadas" ? btnActive : ""}`}
        onClick={() => onChange("atrasadas")}
        title="Registros com próxima dose atrasada"
      >
        Atrasadas{" "}
        <span
          className="rounded bg-red-200 px-1.5 py-0.5 text-[10px] text-red-800
                               dark:bg-red-900 dark:text-red-200"
        >
          {counts.atrasadas}
        </span>
      </button>
      <button
        type="button"
        className={`${btnBase} ${active === "proximas" ? btnActive : ""}`}
        onClick={() => onChange("proximas")}
        title="Próxima dose em até 7 dias"
      >
        Próximas (≤7d){" "}
        <span
          className="rounded bg-amber-200 px-1.5 py-0.5 text-[10px] text-amber-900
                                     dark:bg-amber-900 dark:text-amber-200"
        >
          {counts.proximas}
        </span>
      </button>
      <button
        type="button"
        className={`${btnBase} ${active === "agendadas" ? btnActive : ""}`}
        onClick={() => onChange("agendadas")}
        title="Próxima dose em mais de 7 dias"
      >
        Agendadas{" "}
        <span
          className="rounded bg-emerald-200 px-1.5 py-0.5 text-[10px] text-emerald-900
                                dark:bg-emerald-900 dark:text-emerald-200"
        >
          {counts.agendadas}
        </span>
      </button>
    </div>
  );
}

/* ---------- Página ---------- */
export default function Vacinas() {
  const [vaccines, setVaccines] = useState([]);
  const [pets, setPets] = useState([]);
  const [filter, setFilter] = useState("todas");
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();

  const refresh = () => {
    setVaccines(loadVaccines());
    setPets(loadPets());
  };
  useEffect(() => {
    refresh();
  }, []);

  const petNameById = useMemo(() => {
    const map = new Map();
    pets.forEach((p) => map.set(Number(p.id), p.name));
    return (id) => map.get(Number(id)) || "(pet removido)";
  }, [pets]);

  const counts = useMemo(() => {
    const c = {
      todas: vaccines.length,
      atrasadas: 0,
      proximas: 0,
      agendadas: 0,
    };
    for (const v of vaccines) {
      const cat = filterCategory(v.nextDoseDate);
      if (cat !== "todas") c[cat]++;
    }
    return c;
  }, [vaccines]);

  const filteredList = useMemo(() => {
    if (filter === "todas") return vaccines;
    return vaccines.filter((v) => filterCategory(v.nextDoseDate) === filter);
  }, [vaccines, filter]);

  async function onDelete(id) {
    const vac = vaccines.find((v) => Number(v.id) === Number(id));
    const petName = petNameById(vac?.petId);
    const ok = await confirm({
      title: "Excluir registro de vacina?",
      message: `Remover "${
        vac?.name || "Vacina"
      }" de ${petName}? Esta ação não pode ser desfeita.`,
      confirmText: "Excluir",
      variant: "danger",
    });
    if (!ok) return;
    deleteVaccine(id);
    refresh();
    toast.success("Vacina excluída");
  }

  return (
    <div className="w-full">
      <PageHeader
        title="Carteira de Vacinação"
        description="Registre e acompanhe as vacinas dos pets."
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Carteira de Vacinação" },
        ]}
        actions={
          <Link
            to="/dashboard/vacinas/nova"
            className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm
            border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <Syringe className="h-4 w-4" />
            <Plus className="h-4 w-4" />
            <span>Registrar Vacina</span>
          </Link>
        }
      />

      <ContentCard
        title="Registros"
        actions={
          <FilterTabs active={filter} counts={counts} onChange={setFilter} />
        }
      >
        {filteredList.length === 0 ? (
          <div className="text-sm opacity-70">
            Nenhum registro para este filtro.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left opacity-70">
                <tr>
                  <th className="py-2 pr-4">Pet</th>
                  <th className="py-2 pr-4">Vacina</th>
                  <th className="py-2 pr-4">Aplicada em</th>
                  <th className="py-2 pr-4">Próxima dose</th>
                  <th className="py-2 pr-4">Clínica</th>
                  <th className="py-2 pr-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((v) => (
                  <tr
                    key={v.id}
                    className="border-t border-slate-200 dark:border-slate-800"
                  >
                    <td className="py-3 pr-4">{petNameById(v.petId)}</td>
                    <td className="py-3 pr-4">{v.name}</td>
                    <td className="py-3 pr-4">{formatPt(v.date)}</td>
                    <td className="py-3 pr-4">
                      <NextDoseCell dateStr={v.nextDoseDate} />
                    </td>
                    <td className="py-3 pr-4">{v.clinic || "-"}</td>
                    <td className="py-3 pl-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs
                                     border-slate-300 hover:bg-slate-100
                                     dark:border-slate-700 dark:hover:bg-slate-800"
                          onClick={() => navigate(`/dashboard/vacinas/${v.id}`)}
                        >
                          <Eye className="h-4 w-4" /> Ver
                        </button>
                        <Link
                          to={`/dashboard/vacinas/${v.id}/editar`}
                          className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs
                                     border-slate-300 hover:bg-slate-100
                                     dark:border-slate-700 dark:hover:bg-slate-800"
                        >
                          <Pencil className="h-4 w-4" /> Editar
                        </Link>
                        <button
                          type="button"
                          onClick={() => onDelete(v.id)}
                          className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs
                                     border-slate-300 text-red-600 hover:bg-red-50
                                     dark:border-slate-700 dark:text-red-400 dark:hover:bg-red-950/30"
                        >
                          <Trash2 className="h-4 w-4" /> Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ContentCard>
    </div>
  );
}
