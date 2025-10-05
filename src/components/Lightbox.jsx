// src/components/Lightbox.jsx
import React from "react";
import YaLightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";

/**
 * slides: [{ id, url, title }]
 * open, index, onClose, onIndexChange
 * onSetCover(item), onEditTitle(item), onRemove(item)
 */
export default function Lightbox({
  slides = [],
  open = false,
  index = 0,
  onClose,
  onIndexChange,
  onSetCover,
  onEditTitle,
  onRemove,
}) {
  // Map para o formato exigido pela lib
  const lbSlides = slides.map((s) => ({ src: s.url, title: s.title ?? "", id: s.id }));

  return (
    <YaLightbox
      open={open}
      index={index}
      close={onClose}
      slides={lbSlides}
      plugins={[Captions]}
      // animação mais suave ao navegar
      animation={{ fade: 280, swipe: 380 }}
      carousel={{ finite: false }}
      controller={{ closeOnBackdropClick: true }}
      on={{
        view: ({ index: i }) => onIndexChange?.(i),
      }}
      // barra de ações renderizada DENTRO do lightbox (fica sempre por cima)
      render={{
        toolbar: ({ index: i }) => {
          const current = slides[i];
          if (!current) return null;

          const Btn = ({ children, onClick, variant = "neutral" }) => {
            const base =
              "px-3 py-1.5 rounded-md text-sm font-medium border transition-colors";
            const styles =
              variant === "danger"
                ? "bg-red-600/90 border-red-500 text-white hover:bg-red-600"
                : variant === "primary"
                ? "bg-amber-600/95 border-amber-500 text-white hover:bg-amber-600"
                : "bg-slate-800/80 border-slate-700 text-slate-100 hover:bg-slate-800";
            return (
              <button onClick={onClick} className={`${base} ${styles}`}>
                {children}
              </button>
            );
          };

          return (
            <div
              className="pointer-events-auto fixed left-1/2 -translate-x-1/2 bottom-6
                         flex items-center gap-2 rounded-xl border border-slate-700
                         bg-slate-900/85 backdrop-blur px-3 py-2"
              style={{ zIndex: 1000000000 }}
            >
              <span className="text-slate-200 text-sm max-w-[40vw] truncate">
                {current.title || ""}
              </span>
              <div className="w-px h-5 bg-slate-700 mx-2" />
              <Btn variant="primary" onClick={() => onSetCover?.(current)}>⭐ Capa</Btn>
              <Btn onClick={() => onEditTitle?.(current)}>✏️ Título</Btn>
              <Btn variant="danger" onClick={() => onRemove?.(current)}>🗑️ Remover</Btn>
            </div>
          );
        },
      }}
      styles={{
        container: { backgroundColor: "rgba(0,0,0,0.85)" }, // backdrop
      }}
    />
  );
}
