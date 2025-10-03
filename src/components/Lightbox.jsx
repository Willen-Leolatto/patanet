// src/components/Lightbox.jsx
import React, { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight, Download, Share2 } from "lucide-react";

export default function Lightbox({ images = [], index = 0, onClose }) {
  const [i, setI] = useState(index);
  const canPrev = i > 0;
  const canNext = i < images.length - 1;

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
      if (e.key === "ArrowLeft" && canPrev) setI((v) => v - 1);
      if (e.key === "ArrowRight" && canNext) setI((v) => v + 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canPrev, canNext, onClose]);

  const src = images[i]?.url || images[i];

  async function doShare() {
    try {
      if (navigator.share) {
        await navigator.share({ title: "Foto", url: src });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(src);
        alert("Link copiado!");
      }
    } catch {}
  }

  function doDownload() {
    const a = document.createElement("a");
    a.href = src;
    a.download = `foto-${i + 1}.jpg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      {/* toolbar */}
      <div className="absolute right-4 top-4 flex gap-2">
        <button className="rounded-md bg-white/10 p-2 text-white hover:bg-white/20" onClick={doShare} title="Compartilhar">
          <Share2 className="h-5 w-5" />
        </button>
        <button className="rounded-md bg-white/10 p-2 text-white hover:bg-white/20" onClick={doDownload} title="Baixar">
          <Download className="h-5 w-5" />
        </button>
        <button className="rounded-md bg-white/10 p-2 text-white hover:bg-white/20" onClick={onClose} title="Fechar">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* setas */}
      {canPrev && (
        <button
          className="absolute left-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
          onClick={() => setI(i - 1)}
          title="Anterior"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}
      {canNext && (
        <button
          className="absolute right-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
          onClick={() => setI(i + 1)}
          title="Próxima"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* imagem com fade */}
      <img
        key={src}
        src={src}
        alt=""
        className="max-h-[85vh] max-w-[92vw] rounded-lg object-contain opacity-0 transition-opacity duration-300"
        onLoad={(e) => (e.currentTarget.style.opacity = 1)}
      />
    </div>
  );
}
