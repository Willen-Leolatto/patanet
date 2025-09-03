import React from "react";
import PageHeader from "../../../components/PageHeader";
import FormCard from "../../../components/forms/FormCard";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { loadPets } from "../../pets/services/petsStorage";
import { getVaccineById, updateVaccine } from "../services/vaccinesStorage";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useToast } from "../../../components/ui/ToastProvider";

const Schema = z.object({
  petId: z.string().nonempty("Selecione o pet"),
  name: z.string().min(2, "Informe a vacina"),
  date: z
    .string()
    .nonempty("Informe a data")
    .refine((v) => !Number.isNaN(new Date(v).getTime()), "Data inválida"),
  nextDoseDate: z.string().optional(),
  clinic: z.string().optional(),
  notes: z.string().max(500, "Máx. 500 caracteres").optional(),
});

export default function VacinaEdit() {
  const { id } = useParams();
  const vac = getVaccineById(id);
  const pets = loadPets();
  const navigate = useNavigate();
  const toast = useToast();

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
      </div>
    );
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(Schema),
    defaultValues: {
      petId: vac.petId?.toString() || "",
      name: vac.name,
      date: vac.date,
      nextDoseDate: vac.nextDoseDate || "",
      clinic: vac.clinic || "",
      notes: vac.notes || "",
    },
  });

  const input =
    "w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors border-slate-300 bg-white focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:focus:border-slate-600";
  const errorText = (m) => (
    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{m}</p>
  );

  const onSubmit = handleSubmit((raw) => {
    updateVaccine(id, {
      petId: Number(raw.petId),
      name: raw.name.trim(),
      date: raw.date,
      nextDoseDate: raw.nextDoseDate || undefined,
      clinic: raw.clinic?.trim() || "",
      notes: raw.notes?.trim() || "",
    });
    toast.success("Registro atualizado");
    navigate(`/dashboard/vacinas/${id}`);
  });

  return (
    <div className="w-full">
      <PageHeader
        title={`Editar: ${vac.name}`}
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Carteira de Vacinação", to: "/dashboard/vacinas" },
          { label: vac.name, to: `/dashboard/vacinas/${id}` },
          { label: "Editar" },
        ]}
      />

      {pets.length === 0 ? (
        <FormCard title="Dados da Vacina" onSubmit={(e) => e.preventDefault()}>
          <div className="text-sm">
            Você precisa cadastrar um pet primeiro.{" "}
            <Link to="/dashboard/pets/novo" className="underline">
              Cadastrar pet
            </Link>
          </div>
        </FormCard>
      ) : (
        <FormCard title="Dados da Vacina" onSubmit={onSubmit}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Pet *</label>
              <select className={input} {...register("petId")}>
                <option value="">Selecione…</option>
                {pets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {errors.petId && errorText(errors.petId.message)}
            </div>
            <div>
              <label className="text-sm font-medium">Vacina *</label>
              <input className={input} {...register("name")} />
              {errors.name && errorText(errors.name.message)}
            </div>
            <div>
              <label className="text-sm font-medium">Aplicada em *</label>
              <input type="date" className={input} {...register("date")} />
              {errors.date && errorText(errors.date.message)}
            </div>
            <div>
              <label className="text-sm font-medium">Próxima dose</label>
              <input
                type="date"
                className={input}
                {...register("nextDoseDate")}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Clínica</label>
              <input className={input} {...register("clinic")} />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Observações</label>
              <textarea rows={4} className={input} {...register("notes")} />
            </div>
          </div>
        </FormCard>
      )}
    </div>
  );
}
