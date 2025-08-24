import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import PageHeader from "../components/PageHeader";
import FormCard from "../components/forms/FormCard";
import { getPetById, updatePet } from "../utils/petsStorage";
import { useToast } from "../components/ui/ToastProvider";

const PetSchema = z.object({
  name: z.string().min(2, "Informe ao menos 2 caracteres"),
  species: z.enum(["dog", "cat", "other"]),
  breed: z.string().trim().optional(),
  sex: z.enum(["m", "f"]),
  birthDate: z
    .string()
    .nonempty("Informe a data")
    .refine((s) => !Number.isNaN(new Date(s).getTime()), "Data inválida"),
  weightKg: z
    .number({ invalid_type_error: "Peso inválido" })
    .min(0, "Peso inválido")
    .max(200, "Peso exagerado")
    .optional(),
  notes: z.string().max(500, "Máx. 500 caracteres").optional(),
  photo: z.any().optional(),
});

const fileToDataURL = (file) =>
  new Promise((resolve) => {
    if (!file) return resolve(undefined);
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });

export default function PetEdit() {
  const toast = useToast();
  const { id } = useParams();
  const pet = getPetById(id);
  const navigate = useNavigate();
  const [preview, setPreview] = useState(pet?.photo);

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
      </div>
    );
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    resolver: zodResolver(PetSchema),
    defaultValues: {
      name: pet.name,
      species: pet.species,
      breed: pet.breed || "",
      sex: pet.sex,
      birthDate: pet.birthDate,
      weightKg: pet.weightKg ?? "",
      notes: pet.notes || "",
    },
  });

  const photoFile = watch("photo");
  useMemo(() => {
    if (photoFile && photoFile.length > 0) {
      const url = URL.createObjectURL(photoFile[0]);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreview(pet.photo);
    }
  }, [photoFile, pet.photo]);

  const onSubmit = handleSubmit(async (raw) => {
    const photoDataUrl = await fileToDataURL(raw.photo?.[0]);
    updatePet(id, {
      name: raw.name.trim(),
      species: raw.species,
      breed: raw.breed?.trim() || "",
      sex: raw.sex,
      birthDate: raw.birthDate,
      weightKg: typeof raw.weightKg === "number" ? raw.weightKg : undefined,
      notes: raw.notes?.trim() || "",
      photo: photoDataUrl ?? pet.photo,
    });
    toast.success("Alterações salvas");
    navigate(`/dashboard/pets/${id}`);
  });

  const inputBase =
    "w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors " +
    "border-slate-300 bg-white focus:border-slate-400 " +
    "dark:border-slate-700 dark:bg-slate-900 dark:focus:border-slate-600";

  const errorText = (msg) => (
    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{msg}</p>
  );

  return (
    <div className="w-full">
      <PageHeader
        title={`Editar: ${pet.name}`}
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Meus Pets", to: "/dashboard/pets" },
          { label: pet.name, to: `/dashboard/pets/${id}` },
          { label: "Editar" },
        ]}
      />

      <FormCard title="Informações do Pet" onSubmit={onSubmit}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Foto */}
          <div className="lg:col-span-3">
            <label className="text-sm font-medium">Foto</label>
            <div className="mt-2 flex items-center gap-3">
              <div className="h-20 w-20 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                {preview && (
                  <img
                    src={preview}
                    alt={pet.name}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                className="block text-sm file:mr-2 file:rounded-md file:border file:px-3 file:py-1.5
                           file:border-slate-300 file:bg-slate-100 file:text-slate-800 hover:file:bg-slate-200
                           dark:file:border-slate-700 dark:file:bg-slate-800 dark:file:text-slate-100 dark:hover:file:bg-slate-700"
                {...register("photo")}
              />
            </div>
          </div>

          {/* Nome */}
          <div className="lg:col-span-4">
            <label className="text-sm font-medium">Nome *</label>
            <input type="text" className={inputBase} {...register("name")} />
            {errors.name && errorText(errors.name.message)}
          </div>

          {/* Espécie */}
          <div className="lg:col-span-2">
            <label className="text-sm font-medium">Espécie *</label>
            <select className={inputBase} {...register("species")}>
              <option value="dog">Cachorro</option>
              <option value="cat">Gato</option>
              <option value="other">Outro</option>
            </select>
            {errors.species && errorText(errors.species.message)}
          </div>

          {/* Raça */}
          <div className="lg:col-span-3">
            <label className="text-sm font-medium">Raça</label>
            <input type="text" className={inputBase} {...register("breed")} />
            {errors.breed && errorText(errors.breed.message)}
          </div>

          {/* Sexo */}
          <div className="lg:col-span-3">
            <label className="text-sm font-medium">Sexo *</label>
            <div className="mt-2 flex gap-4">
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="radio" value="m" {...register("sex")} /> Macho
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="radio" value="f" {...register("sex")} /> Fêmea
              </label>
            </div>
            {errors.sex && errorText(errors.sex.message)}
          </div>

          {/* Nascimento */}
          <div className="lg:col-span-3">
            <label className="text-sm font-medium">Nascimento *</label>
            <input
              type="date"
              className={inputBase}
              {...register("birthDate")}
            />
            {errors.birthDate && errorText(errors.birthDate.message)}
          </div>

          {/* Peso */}
          <div className="lg:col-span-3">
            <label className="text-sm font-medium">Peso (kg)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              className={inputBase}
              {...register("weightKg", {
                setValueAs: (v) =>
                  v === "" || v === null ? undefined : Number(v),
              })}
            />
            {errors.weightKg && errorText(errors.weightKg.message)}
          </div>

          {/* Observações */}
          <div className="lg:col-span-12">
            <label className="text-sm font-medium">Observações</label>
            <textarea rows={4} className={inputBase} {...register("notes")} />
            {errors.notes && errorText(errors.notes.message)}
          </div>
        </div>
      </FormCard>
    </div>
  );
}
