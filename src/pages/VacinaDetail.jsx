import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import ContentCard from "../components/ContentCard";
import { getVaccineById, deleteVaccine } from "../utils/vaccinesStorage";
import { loadPets } from "../utils/petsStorage";
import { Pencil, Trash2 } from "lucide-react";
import { useToast } from "../components/ui/ToastProvider";
import { useConfirm } from "../components/ui/ConfirmProvider";

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
function NextDoseBadge({ dateStr }) {
  if (!dateStr) return null;
  const days = daysUntil(dateStr);
  if (days < 0) {
    return (
      <span
        className="ml-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium
                            border-red-200 bg-red-100 text-red-700
                            dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
      >
        Atrasada
      </span>
    );
  }
  if (days <= 7) {
    return (
      <span
        className="ml-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium
                            border-amber-200 bg-amber-100 text-amber-800
                            dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
      >
        Próxima {days === 0 ? "hoje" : `em ${days} dia${days > 1 ? "s" : ""}`}
      </span>
    );
  }
  return (
    <span
      className="ml-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium
                         border-emerald-200 bg-emerald-100 text-emerald-700
                         dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
    >
      Agendada
    </span>
  );
}

export default function VacinaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();

  const vac = getVaccineById(id);
  const pets = loadPets();
  const petName =
    pets.find((p) => Number(p.id) === Number(vac?.petId))?.name ||
    "(pet removido)";

  if (!vac) {
    return (
      <div className="w-full">
        <PageHeader
          title="Vacina não encontrada"
          breadcrumbs={[
            { label: "Dashboard", to: "/dashboard" },
            { label: "Carteira de Vacinação", to: "/dashboard/vacinas" },
          ]}
        />
        <ContentCard>
          <div className="text-sm">Este registro não existe mais.</div>
        </ContentCard>
      </div>
    );
  }

  const onDelete = async () => {
    const ok = await confirm({
      title: "Excluir registro de vacina?",
      message: `Remover "${vac.name}" de ${petName}? Esta ação não pode ser desfeita.`,
      confirmText: "Excluir",
      variant: "danger",
    });
    if (!ok) return;
    deleteVaccine(id);
    toast.success("Vacina excluída");
    navigate("/dashboard/vacinas");
  };

  return (
    <div className="w-full">
      <PageHeader
        title={vac.name}
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Carteira de Vacinação", to: "/dashboard/vacinas" },
          { label: vac.name },
        ]}
        actions={
          <div className="flex gap-2">
            <Link
              to={`/dashboard/vacinas/${id}/editar`}
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm
                         border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              <Pencil className="h-4 w-4" /> Editar
            </Link>
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm
                         border-slate-300 text-red-600 hover:bg-red-50
                         dark:border-slate-700 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              <Trash2 className="h-4 w-4" /> Excluir
            </button>
          </div>
        }
      />

      <ContentCard>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <div>
            <dt className="opacity-60">Pet</dt>
            <dd className="font-medium">{petName}</dd>
          </div>
          <div>
            <dt className="opacity-60">Vacina</dt>
            <dd className="font-medium">{vac.name}</dd>
          </div>
          <div>
            <dt className="opacity-60">Aplicada em</dt>
            <dd className="font-medium">{formatPt(vac.date)}</dd>
          </div>
          <div className="flex items-center">
            <div>
              <dt className="opacity-60">Próxima dose</dt>
              <dd className="font-medium">
                {vac.nextDoseDate ? formatPt(vac.nextDoseDate) : "-"}
                {vac.nextDoseDate && (
                  <NextDoseBadge dateStr={vac.nextDoseDate} />
                )}
              </dd>
            </div>
          </div>
          <div className="sm:col-span-2">
            <dt className="opacity-60">Clínica</dt>
            <dd className="font-medium">{vac.clinic || "-"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="opacity-60">Observações</dt>
            <dd className="font-medium">{vac.notes || "-"}</dd>
          </div>
        </dl>
      </ContentCard>
    </div>
  );
}
