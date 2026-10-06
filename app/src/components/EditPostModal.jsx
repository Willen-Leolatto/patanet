// src/components/EditPostModal.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, Trash2, ImagePlus } from "lucide-react";

/**
 * Modal de edição de post (texto + remoção e adição de imagens)
 * Props:
 *  - open: boolean
 *  - post: { id, text, images:[{id,url,title?}] }
 *  - onClose(): void
 *  - onSave({ text, images }): void
 */
export default function EditPostModal({ open, post, onClose, onSave }) {
  const fileRef = useRef(null);

  const safeImages = useMemo(
    () =>
      (post?.images || post?.media || [])
        .map((m, i) => {
          if (typeof m === "string") return { id: i, url: m, title: "" };
          const url = m?.url || m?.src || "";
          if (!url) return null;
          return { id: m?.id ?? i, url, title: m?.title || "" };
        })
        .filter(Boolean),
    [post]
  );

  const [text, setText] = useState(post?.text || "");
  const [images, setImages] = useState(safeImages);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setText(post?.text || "");
    setImages(safeImages);
  }, [post, safeImages]);

  if (!open || !post) return null;

  function removeImage(imgId) {
    setImages((arr) => arr.filter((m) => m.id !== imgId));
  }

  async function handleFiles(files) {
    if (!files?.length) return;
    setBusy(true);
    try {
      const arr = [];
      for (const file of files) {
        const dataUrl = await compressToDataURL(file, 1400, 0.82);
        arr.push({
          id: crypto.randomUUID(),
          url: dataUrl,
          title: file.name.replace(/\.[^.]+$/, ""),
        });
      }
      setImages((prev) => [...prev, ...arr]);
    } finally {
      setBusy(false);
    }
  }

  function save() {
    onSave?.({ text: text ?? "", images });
  }

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4"
      onMouseDown={(e) => {
        // fechar ao clicar no backdrop
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200/60 bg-white text-slate-900 shadow-xl dark:border-slate-700/60 dark:bg-slate-900 dark:text-slate-100">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-slate-200/60 px-5 py-3 dark:border-slate-700/60">
          <h3 className="text-base font-semibold">Editar publicação</h3>
          <button
            className="rounded p-1 hover:bg-black/5 dark:hover:bg-white/10"
            onClick={onClose}
            aria-label="Fechar"
            title="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Corpo */}
        <div className="grid gap-4 px-5 py-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Texto</label>
            <textarea
              className="min-h-[110px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:focus:border-slate-600"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escreva sua legenda…"
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Imagens</label>
              <div className="flex items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    handleFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-md bg-[#f77904] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
                  disabled={busy}
                  title="Adicionar imagens"
                >
                  <ImagePlus className="h-4 w-4" />
                  Adicionar imagens
                </button>
              </div>
            </div>

            {images.length === 0 ? (
              <p className="text-sm opacity-70">Sem imagens nesta postagem.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {images.map((img) => (
                  <div
                    key={img.id}
                    className="group relative overflow-hidden rounded-lg border border-slate-200/60 dark:border-slate-700/60"
                  >
                    <img
                      src={img.url}
                      alt={img.title || ""}
                      className="aspect-[4/3] w-full object-cover"
                      loading="lazy"
                    />
                    <div className="pointer-events-none absolute right-2 top-2 flex gap-1">
                      <button
                        type="button"
                        className="pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white hover:bg-black/70"
                        title="Remover"
                        onClick={() => removeImage(img.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {img.title && (
                      <div className="absolute inset-x-0 bottom-0 bg-black/35 px-2 py-1 text-xs text-white">
                        {img.title}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Rodapé */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-200/60 px-5 py-3 dark:border-slate-700/60">
          <button
            type="button"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="rounded-md bg-[#f77904] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
            onClick={save}
            disabled={busy}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------
   Compressão simples para DataURL (JPEG)
-------------------------------------------- */
async function compressToDataURL(file, maxW = 1400, quality = 0.82) {
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(1, maxW / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * ratio);
  const h = Math.round(bitmap.height * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, w, h);
  // força JPEG para reduzir tamanho
  return canvas.toDataURL("image/jpeg", quality);
}
