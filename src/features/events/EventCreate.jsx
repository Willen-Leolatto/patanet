import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, MapPin, Image as ImageIcon } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Textarea from "@/components/Textarea";
import Loading from "@/components/Loading";
import { useToast } from "@/providers/ToastProvider";

import { createEvent } from "../api/events.api";

export default function EventCreate() {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [locationText, setLocationText] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!title || !description || !date || !time) {
      error("Preencha todos os campos obrigatórios.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        title,
        description,
        date,
        time,
        locationText,
        image,
        // latitude / longitude ficam prontos para o backend
        latitude: null,
        longitude: null,
      };

      await createEvent(payload);

      success("Evento criado com sucesso!");
      navigate("/eventos");
    } catch (err) {
      console.error(err);
      error("Erro ao criar evento.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-10">
      <PageHeader
        title="Criar Evento"
        subtitle="Divulgue encontros, feiras e atividades"
      />

      <form
        onSubmit={handleSubmit}
        className="mt-6 flex flex-col gap-6 rounded-2xl border bg-card p-6 shadow-sm"
      >
        {/* Nome */}
        <Input
          label="Nome do evento"
          placeholder="Ex: Feira de Adoção"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        {/* Descrição */}
        <Textarea
          label="Descrição"
          placeholder="Descreva o evento"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          required
        />

        {/* Data e Hora */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Data"
            type="date"
            icon={Calendar}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          <Input
            label="Hora"
            type="time"
            icon={Clock}
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </div>

        {/* Local */}
        <Input
          label="Local"
          placeholder="Ex: Praça Central"
          icon={MapPin}
          value={locationText}
          onChange={(e) => setLocationText(e.target.value)}
        />

        {/* Imagem */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Imagem do evento</label>

          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed p-6 text-sm text-muted-foreground transition hover:bg-muted">
            <ImageIcon className="h-5 w-5" />
            <span>Selecionar imagem</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </label>

          {preview && (
            <img
              src={preview}
              alt="Pré-visualização"
              className="mt-2 max-h-64 w-full rounded-xl object-cover"
            />
          )}
        </div>

        {/* Ações */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate("/eventos")}
          >
            Cancelar
          </Button>

          <Button type="submit">
            Criar Evento
          </Button>
        </div>
      </form>
    </div>
  );
}
