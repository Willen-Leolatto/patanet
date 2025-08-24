import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import ContentCard from "../components/ContentCard";
import { Plus, Dog, Eye, Pencil, Trash2 } from "lucide-react";
import { loadPets, deletePet } from "../utils/petsStorage";
import { useToast } from "../components/ui/ToastProvider";
import { useConfirm } from "../components/ui/ConfirmProvider";
import { playSfx } from "../utils/sfx";

const specieLabel = { dog: "Cachorro", cat: "Gato", other: "Outro" };

export default function Pets() {
  const [pets, setPets] = useState([]);
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();

  const refresh = () => setPets(loadPets());
  useEffect(() => {
    refresh();
  }, []);

  async function onDelete(id, name) {
    const ok = await confirm({
      title: "Excluir pet?",
      message: `Você está prestes a excluir "${name}". Esta ação não pode ser desfeita.`,
      confirmText: "Excluir",
      variant: "danger",
    });
    if (!ok) {
      playSfx("cancel");
      return;
    }
    deletePet(id);
    refresh();
    playSfx("success");
    toast.success("Pet excluído");
  }

  return (
    <div className="w-full">
      <PageHeader
        title="Meus Pets"
        description="Gerencie os animais cadastrados da família."
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Meus Pets" },
        ]}
        actions={
          <Link
            to="/dashboard/pets/novo"
            className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm
            border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <Dog className="h-4 w-4" />
            <Plus className="h-4 w-4" />
            <span>Novo Pet</span>
          </Link>
        }
      />

      <ContentCard>
        {pets.length === 0 ? (
          <div className="text-sm opacity-70">Nenhum pet cadastrado ainda.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left opacity-70">
                <tr>
                  <th className="py-2 pr-4">Pet</th>
                  <th className="py-2 pr-4">Espécie</th>
                  <th className="py-2 pr-4">Raça</th>
                  <th className="py-2 pr-4">Nascimento</th>
                  <th className="py-2 pr-4">Peso (kg)</th>
                  <th className="py-2 pr-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pets.map((p) => (
                  <tr
                    key={p.id}
                    className="border-t border-slate-200 dark:border-slate-800"
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          {p.photo && (
                            <img
                              src={p.photo}
                              alt={p.name}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div className="font-medium">{p.name}</div>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      {specieLabel[p.species] || "-"}
                    </td>
                    <td className="py-3 pr-4">{p.breed || "-"}</td>
                    <td className="py-3 pr-4">
                      {p.birthDate
                        ? new Date(p.birthDate).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="py-3 pr-4">{p.weightKg ?? "-"}</td>
                    <td className="py-3 pl-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs
                                     border-slate-300 hover:bg-slate-100
                                     dark:border-slate-700 dark:hover:bg-slate-800"
                          onClick={() => navigate(`/dashboard/pets/${p.id}`)}
                          title="Ver"
                        >
                          <Eye className="h-4 w-4" /> Ver
                        </button>
                        <Link
                          to={`/dashboard/pets/${p.id}/editar`}
                          className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs
                                     border-slate-300 hover:bg-slate-100
                                     dark:border-slate-700 dark:hover:bg-slate-800"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" /> Editar
                        </Link>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs
                                     border-slate-300 text-red-600 hover:bg-red-50
                                     dark:border-slate-700 dark:text-red-400 dark:hover:bg-red-950/30"
                          onClick={() => onDelete(p.id, p.name)}
                          title="Excluir"
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
