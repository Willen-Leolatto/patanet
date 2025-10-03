import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import PageHeader from "../../../components/PageHeader";
import FormCard from "../../../components/forms/FormCard";
import { useToast } from "../../../components/ui/ToastProvider";
import FormField from '@/components/FormField'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'

/* ----- schema ----- */
const PetSchema = z.object({
  name: z.string().min(2, "Informe ao menos 2 caracteres"),
  species: z.enum(["dog", "cat", "other"], {
    required_error: "Selecione a espécie",
  }),
  breed: z.string().trim().optional(),
  sex: z.enum(["m", "f"], { required_error: "Selecione o sexo" }),
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
  photo: z.any().optional(), // file (image)
});

/* util: converte File -> dataURL */
const fileToDataURL = (file) =>
  new Promise((resolve) => {
    if (!file) return resolve(undefined);
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });

export default function PetCreate() {
  const navigate = useNavigate();
  const toast = useToast();
  const [preview, setPreview] = useState();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(PetSchema),
    defaultValues: {
      species: "dog",
      sex: "m",
    },
  });

  // preview da foto
  const photoFile = watch("photo");
  useMemo(() => {
    if (photoFile && photoFile.length > 0) {
      const url = URL.createObjectURL(photoFile[0]);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreview(undefined);
    }
  }, [photoFile]);

  const onSubmit = handleSubmit(async (raw) => {
    // prepara payload
    const photoDataUrl = await fileToDataURL(raw.photo?.[0]);
    const pet = {
      id: Date.now(),
      name: raw.name.trim(),
      species: raw.species,
      breed: raw.breed?.trim() || "",
      sex: raw.sex,
      birthDate: raw.birthDate,
      weightKg: typeof raw.weightKg === "number" ? raw.weightKg : undefined,
      notes: raw.notes?.trim() || "",
      photo: photoDataUrl, // base64
    };

    // persiste no localStorage (mock de backend)
    try {
      const key = "patanet_pets";
      const list = JSON.parse(localStorage.getItem(key) || "[]");
      list.push(pet);
      localStorage.setItem(key, JSON.stringify(list));
      toast.success("Pet criado com sucesso");
    } catch {
      toast.error("Não foi possível salvar o pet");
      return;
    }
    navigate("/pets");
  });

  // estilos de campo
  const inputBase =
    "w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors " +
    "border-slate-300 bg-white focus:border-slate-400 " +
    "dark:border-slate-700 dark:bg-slate-900 dark:focus:border-slate-600";

  const errorText = (msg) => (
    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{msg}</p>
  );

  return (
     <div className="w-full">
      <PageHeader title="Novo Pet" breadcrumbs={[{label:'Dashboard',to:'/dashboard'},{label:'Pets',to:'/pets'},{label:'Novo'}]} />
      <form className="space-y-6">
        <FormCard title="Informações básicas">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Nome" required><Input placeholder="Ex.: Max" /></FormField>
            <FormField label="Espécie" required><Input placeholder="Cachorro, Gato..." /></FormField>
            <FormField label="Raça"><Input placeholder="SRD, Pug, Siamês..." /></FormField>
            <FormField label="Data de nascimento"><Input type="date" /></FormField>
            <div className="md:col-span-2"><FormField label="Observações"><Textarea /></FormField></div>
          </div>
        </FormCard>

        <div className="flex justify-end gap-2">
          <Button variant="outline" type="button">Cancelar</Button>
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </div>
  );
}
