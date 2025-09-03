import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../../components/PageHeader";
import ContentCard from "../../../components/ContentCard";
import { getPetById, deletePet } from "../services/petsStorage";
import { Pencil, Trash2 } from "lucide-react";
import { useToast } from "../../../components/ui/ToastProvider";
import { useConfirm } from "../../../components/ui/ConfirmProvider";
import { playSfx } from "../../../utils/sfx";

const specieLabel = { dog: "Cachorro", cat: "Gato", other: "Outro" };

export default function PetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();

  const pet = getPetById(id);

  if (!pet) {
    return (
      <div className="w-full">
        <PageHeader
          title="Pet não encontrado"
          breadcrumbs={[
            { label: "Dashboard", to: "/dashboard" },
            { label: "Meus Pets", to: "/dashboard/pets" },
          ]}
        />
        <ContentCard>
          <div className="text-sm">Este pet não existe mais.</div>
        </ContentCard>
      </div>
    );
  }

  const nameForMsg = pet?.name || "este pet";

  const onDelete = async (e) => {
    e?.preventDefault?.();
    const nameForMsg = pet?.name || "este pet";
    const ok = await confirm({
      title: "Excluir pet?",
      message: `Você está prestes a excluir "${nameForMsg}". Esta ação não pode ser desfeita.`,
      confirmText: "Excluir",
      cancelText: "Cancelar",
      variant: "danger",
    });
    if (!ok) {
      playSfx("cancel");
      return;
    }
    deletePet(id);
    playSfx("success");
    toast.success("Pet excluído");
    navigate("/dashboard/pets");
  };

  return (
    <div className="w-full">
      <PageHeader
        title={pet.name}
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Meus Pets", to: "/dashboard/pets" },
          { label: pet.name },
        ]}
        actions={
          <div className="flex gap-2">
            <Link
              to={`/dashboard/pets/${id}/editar`}
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
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div>
            <div className="h-32 w-32 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              {pet.photo && (
                <img
                  src={pet.photo}
                  alt={pet.name}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          </div>
          <div className="md:col-span-2">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <div>
                <dt className="opacity-60">Espécie</dt>
                <dd className="font-medium">{specieLabel[pet.species]}</dd>
              </div>
              <div>
                <dt className="opacity-60">Raça</dt>
                <dd className="font-medium">{pet.breed || "-"}</dd>
              </div>
              <div>
                <dt className="opacity-60">Sexo</dt>
                <dd className="font-medium">
                  {pet.sex === "m" ? "Macho" : "Fêmea"}
                </dd>
              </div>
              <div>
                <dt className="opacity-60">Nascimento</dt>
                <dd className="font-medium">
                  {new Date(pet.birthDate).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="opacity-60">Peso</dt>
                <dd className="font-medium">{pet.weightKg ?? "-"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="opacity-60">Observações</dt>
                <dd className="font-medium">{pet.notes || "-"}</dd>
              </div>
            </dl>
          </div>
        </div>
      </ContentCard>
    </div>
  );
}
