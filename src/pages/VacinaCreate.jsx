import React from "react";
import PageHeader from "../components/PageHeader";
import FormCard from "../components/forms/FormCard";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { loadPets } from "../utils/petsStorage";
import { addVaccine } from "../utils/vaccinesStorage";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "../components/ui/ToastProvider";

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

export default function VacinaCreate() {
  const pets = loadPets();
  const navigate = useNavigate();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(Schema),
    defaultValues: { petId: pets[0]?.id?.toString() || "" },
  });

  const input =
    "w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors border-slate-300 bg-white focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:focus:border-slate-600";
  const errorText = (m) => (
    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{m}</p>
  );

  const onSubmit = handleSubmit((raw) => {
    const vac = {
      id: Date.now(),
      petId: Number(raw.petId),
      name: raw.name.trim(),
      date: raw.date,
      nextDoseDate: raw.nextDoseDate || undefined,
      clinic: raw.clinic?.trim() || "",
      notes: raw.notes?.trim() || "",
    };
    addVaccine(vac);
    toast.success("Vacina registrada");
    navigate("/dashboard/vacinas");
  });

  return (
    <div className="w-full">
      <PageHeader
        title="Registrar Vacina"
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Carteira de Vacinação", to: "/dashboard/vacinas" },
          { label: "Nova" },
        ]}
        description="Informe a vacina aplicada ao pet."
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
              <input
                className={input}
                {...register("name")}
                placeholder="Ex.: V8, Antirrábica"
              />
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
              <input
                className={input}
                {...register("clinic")}
                placeholder="Opcional"
              />
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
