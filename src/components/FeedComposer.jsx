import React, { useMemo, useState } from "react";
import ContentCard from "./ContentCard";
import { addPosts } from "@features/feed/services/feedStorage";
import { loadPets } from "@features/pets/services/petsStorage";
import { compressImageSmart } from "../utils/image";
import { useToast } from "./ui/ToastProvider";
import { ImagePlus } from "lucide-react";

export default function FeedComposer({ onPosted }) {
  const pets = useMemo(() => loadPets(), []);
  const [text, setText] = useState("");
  const [petIds, setPetIds] = useState([]);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const toast = useToast();

  function togglePet(idStr) {
    setPetIds((prev) =>
      prev.includes(idStr) ? prev.filter((x) => x !== idStr) : [...prev, idStr]
    );
  }

  async function onPickFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.info("Apenas imagens.");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function clearImage() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFile(null);
  }

  async function publish() {
  const content = text.trim()
  if (!content && !file) {
    toast.info('Escreva algo ou anexe uma imagem.')
    return
  }

  const now = Date.now()
  const author = { id: 'me', name: 'Você', avatar: null }

  // 1) Se tiver imagem: salva só na Galeria (sem criar post de foto no feed)
  if (file) {
    try {
      const { dataUrl } = await compressImageSmart(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.85 })
      // salva na galeria
      const photo = {
        id: now,
        petIds: petIds.map(Number),
        caption: content,
        src: dataUrl,
        createdAt: now,
        originalName: file.name,
      }
      addPhoto(photo)
      toast.success('Foto salva na Galeria. Em breve: publicação com imagem no feed.')
      // limpa composer
      setText(''); setPetIds([]); if (preview) URL.revokeObjectURL(preview); setPreview(null); setFile(null)
      onPosted?.()
      return
    } catch {
      toast.error('Falha ao processar a imagem.')
      return
    }
  }

  // 2) Post de texto normal (continua funcionando)
  const post = {
    id: now,
    type: 'text',
    text: content,
    petIds: petIds.map(Number),
    createdAt: now,
    author,
    likes: 0,
    comments: [],
  }

  try {
    addPosts([post])
    toast.success('Publicado!')
    setText(''); setPetIds([])
    onPosted?.()
  } catch {
    toast.error('Sem espaço para publicar. Remova itens antigos.')
  }
}


  return (
    <ContentCard>
      <div className="flex flex-col gap-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escreva algo…"
          className="min-h-[44px] w-full rounded-md border px-3 py-2 text-sm outline-none
                     border-slate-300 bg-white focus:border-slate-400
                     dark:border-slate-700 dark:bg-slate-900 dark:focus:border-slate-600"
        />

        {/* Pets (tags) */}
        {pets.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {pets.map((p) => {
              const idStr = String(p.id);
              const active = petIds.includes(idStr);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePet(idStr)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    active
                      ? "border-slate-900 bg-slate-900 text-white dark:border-slate-200 dark:bg-slate-200 dark:text-slate-900"
                      : "border-slate-300 bg-white hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                  }`}
                >
                  {p.name}
                </button>
              );
            })}
          </div>
        )}

        {/* Imagem opcional */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => document.getElementById("composer-image")?.click()}
            className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm
                       border-slate-300 hover:bg-slate-100
                       dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <ImagePlus className="h-4 w-4" /> Anexar imagem
          </button>
          <input
            id="composer-image"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPickFile}
          />
          {preview && (
            <div className="flex items-center gap-2">
              <img
                src={preview}
                alt="Pré-visualização"
                className="h-12 w-12 rounded object-cover"
              />
              <button
                type="button"
                onClick={clearImage}
                className="text-xs opacity-70 hover:opacity-100"
              >
                Remover
              </button>
            </div>
          )}
          <div className="ml-auto">
            <button
              type="button"
              onClick={publish}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:opacity-90 dark:bg-slate-200 dark:text-slate-900"
            >
              Publicar
            </button>
          </div>
        </div>
      </div>
    </ContentCard>
  );
}
