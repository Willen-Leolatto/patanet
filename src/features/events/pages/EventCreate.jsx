// src/features/events/pages/EventCreate.jsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Clock, MapPin, Image as ImageIcon, ArrowLeft } from "lucide-react";
import heic2any from "heic2any";

import { createEvent } from "@/api/events.api.js";
import { useToast } from "@/components/ui/ToastProvider";

const isHeic = (file) =>
  file &&
  (/\.(heic|heif)$/i.test(file.name || "") || /image\/hei(c|f)/i.test(file.type || ""));

async function ensureJpeg(file) {
  if (!(file instanceof File)) return file;
  if (!isHeic(file)) return file;
  try {
    const blob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.92 });
    return new File([blob], (file.name || "image").replace(/\.(heic|heif)$/i, ".jpg"), {
      type: "image/jpeg",
    });
  } catch {
    return file;
  }
}

async function compressImage(file, { maxW = 1920, maxH = 1920, targetMaxBytes = 900 * 1024 } = {}) {
  if (!(file instanceof File)) return file;
  const base = await ensureJpeg(file);

  let bitmap;
  try {
    bitmap = await createImageBitmap(base);
  } catch {
    const url = URL.createObjectURL(base);
    bitmap = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        createImageBitmap(img).then(resolve).catch(() => resolve(img));
        URL.revokeObjectURL(url);
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  let { width, height } = bitmap;
  const ratio = Math.min(maxW / width, maxH / height, 1);
  let w = Math.max(1, Math.round(width * ratio));
  let h = Math.max(1, Math.round(height * ratio));

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(bitmap, 0, 0, w, h);

  let quality = 0.86;
  let blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", quality));

  while (blob && blob.size > targetMaxBytes && quality > 0.6) {
    quality = Math.max(0.6, quality - 0.08);
    blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", quality));
  }

  while (blob && blob.size > targetMaxBytes && (w > 640 || h > 640)) {
    w = Math.max(640, Math.round(w * 0.9));
    h = Math.max(640, Math.round(h * 0.9));
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(bitmap, 0, 0, w, h);
    blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.6));
  }

  if (!blob) return base;
  return new File([blob], (base.name || "image").replace(/\.(png|webp|gif|heic|heif)$/i, ".jpg"), {
    type: "image/jpeg",
  });
}

export default function EventCreate() {
  const navigate = useNavigate();
  const toast = useToast();

  const [sending, setSending] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [locationText, setLocationText] = useState("");
  const [image, setImage] = useState(null);

  const previewUrl = useMemo(() => (image ? URL.createObjectURL(image) : ""), [image]);

  async function onPickImage(ev) {
    const f = ev.target.files?.[0];
    if (!f) return;
    setImage(f);
  }

  async function submit(ev) {
    ev.preventDefault();

    const cleanTitle = String(title || "").trim();
    const cleanDesc = String(description || "").trim();
    if (!cleanTitle || !cleanDesc || !date || !time) {
      toast.error("Preencha título, descrição, data e hora.");
      return;
    }

    setSending(true);
    try {
      const img = image ? await compressImage(image) : null;
      await createEvent({
        title: cleanTitle,
        description: cleanDesc,
        date,
        time,
        locationText: String(locationText || "").trim() || null,
        latitude: null,
        longitude: null,
        image: img,
      });

      toast.success("Evento criado! Ele deve aparecer no feed.");
      navigate("/feed");
    } catch (e) {
      console.error(e);
      toast.error("Não foi possível criar o evento.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl p-4 md:p-6">
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
        <div>
          <div className="text-base font-semibold">Criar evento</div>
          <div className="text-xs text-zinc-500">O backend deve criar um post vinculado automaticamente.</div>
        </div>
      </div>

      <form
        onSubmit={submit}
        className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="grid gap-4">
          <label className="grid gap-1">
            <span className="text-sm font-medium">Título *</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Feira de adoção"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Descrição *</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Conte os detalhes do evento…"
              className="w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="text-sm font-medium inline-flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Data *</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-sm font-medium inline-flex items-center gap-2"><Clock className="h-4 w-4" /> Hora *</span>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>
          </div>

          <label className="grid gap-1">
            <span className="text-sm font-medium inline-flex items-center gap-2"><MapPin className="h-4 w-4" /> Local (opcional)</span>
            <input
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
              placeholder="Ex: Praça Central"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>

          <div className="grid gap-2">
            <div className="text-sm font-medium inline-flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Imagem (opcional)</div>

            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800">
              <ImageIcon className="h-5 w-5" />
              <span>Selecionar imagem</span>
              <input type="file" accept="image/*" className="hidden" onChange={onPickImage} />
            </label>

            {previewUrl && (
              <img src={previewUrl} alt="Pré-visualização" className="max-h-72 w-full rounded-xl object-cover" />
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={sending}
              className="rounded-lg bg-[#f77904] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              {sending ? "Enviando…" : "Criar evento"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
