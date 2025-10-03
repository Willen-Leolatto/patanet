// src/components/FeedComposer.jsx
import React, { useRef, useState } from "react";
import { addPost } from "@/features/feed/services/feedStorage";
import IconButton from "@/components/ui/IconButton";
import { ImagePlus, SendHorizontal } from "lucide-react";

/* helpers */
function readAsDataURL(file) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });
}

async function compressImage(file, maxSide = 1280, quality = 0.78) {
  const dataUrl = await readAsDataURL(file);
  const img = new Image();
  await new Promise((r, e) => {
    img.onload = r;
    img.onerror = e;
    img.src = dataUrl;
  });
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

export default function FeedComposer() {
  const [text, setText] = useState("");
  const [images, setImages] = useState([]); // [{ preview, dataUrl }]
  const [busy, setBusy] = useState(false);
  const pickerRef = useRef(null);

  async function onChooseFiles(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setBusy(true);
    try {
      const results = [];
      for (const f of files.slice(0, 10)) {
        if (!f.type?.startsWith("image/")) continue;
        const dataUrl = await compressImage(f);
        results.push({ preview: URL.createObjectURL(f), dataUrl });
      }
      setImages((prev) => [...prev, ...results]);
    } finally {
      setBusy(false);
      if (pickerRef.current) pickerRef.current.value = "";
    }
  }

  function removeImage(i) {
    setImages((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[i]?.preview);
      next.splice(i, 1);
      return next;
    });
  }

  async function publish() {
    if (!text.trim() && images.length === 0) return;
    setBusy(true);
    try {
      const post = {
        text: text.trim(),
        images: images.map((i) => ({ url: i.dataUrl })), // compatível com o Feed
      };
      addPost(post);
      setText("");
      images.forEach((i) => URL.revokeObjectURL(i.preview));
      setImages([]);
    } catch (e) {
      console.error(e);
      alert("Não foi possível publicar. Tente com menos imagens.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card rounded-xl p-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Escreva algo sobre seu pet..."
        maxLength={1000}
        className="w-full resize-y rounded-md border border-slate-300 bg-white/90 px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900/70 dark:focus:border-slate-500"
        rows={3}
      />
      <div className="mt-2 flex items-center justify-between text-xs opacity-70">
        <span>{text.length}/1000</span>
        <span>Cadastre pets no Dashboard para marcá-los aqui.</span>
      </div>

      {images.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {images.map((img, i) => (
            <div
              key={i}
              className="relative h-24 w-24 overflow-hidden rounded-md border border-slate-200 dark:border-slate-700"
            >
              <img src={img.preview} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute right-1 top-1 rounded bg-black/60 px-1 text-[10px] text-white"
                title="Remover"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        {/* input escondido */}
        <input
          ref={pickerRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={onChooseFiles}
        />
        {/* botão com ícone que abre o seletor */}
        <IconButton
          icon={ImagePlus}
          label="Adicionar mídia"
          variant="ghost"
          onClick={() => pickerRef.current?.click()}
        />

        <IconButton
          icon={SendHorizontal}
          label="Publicar"
          variant="primary"
          onClick={publish}
          disabled={busy || (!text.trim() && images.length === 0)}
          className="ml-auto"
        />
      </div>
    </div>
  );
}
