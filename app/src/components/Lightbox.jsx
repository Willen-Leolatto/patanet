// src/components/Lightbox.jsx
import React, { useEffect, useMemo, useState } from "react";
import YaLightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";

// 👇 importado do AppShell
import { registerBackHandler } from "@/layouts/AppShell";

/**
 * slides: [{ id, url|src, title|description }]
 * open, index, onClose, onIndexChange
 * onSetCover(item), onEditTitle(item), onRemove(item)
 */
export default function Lightbox({
  slides = [],
  assets = [],
  open = false,
  index = 0,
  onClose,
  onIndexChange,
  onSetCover,
  onEditTitle,
  onRemove,
}) {
  // Map para o formato exigido pela lib
  const lbSlides = useMemo(() => {
    const base = slides?.length ? slides : assets || [];
    return base
      .map((s) => ({
        src: s.src ?? s.url,
        description: s.description ?? s.title ?? s.caption ?? "",
        alt: s.alt ?? s.title ?? "",
        id: s.id ?? s.src ?? s.url,
        title: s.title ?? s.description ?? "",
      }))
      .filter((s) => !!s.src);
  }, [slides, assets]);

  // Dica de zoom para dispositivos touch (some depois de alguns segundos)
  const [showHint, setShowHint] = useState(false);
  useEffect(() => {
    const isTouch =
      typeof window !== "undefined" &&
      ("ontouchstart" in window || navigator.maxTouchPoints > 0);
    if (open && isTouch) {
      setShowHint(true);
      const t = setTimeout(() => setShowHint(false), 3000);
      return () => clearTimeout(t);
    } else {
      setShowHint(false);
    }
  }, [open]);

  // 👇 registra um handler de back enquanto o lightbox está aberto
  useEffect(() => {
    if (!open) return;
    const unregister = registerBackHandler(() => {
      onClose?.();
      return true; // tratou o back
    });
    return unregister;
  }, [open, onClose]);

  return (
    <YaLightbox
      open={open}
      index={index}
      close={onClose}
      slides={lbSlides}
      plugins={[Captions, Zoom]}
      // Animações e comportamento
      animation={{ fade: 200, swipe: 400, zoom: 320 }}
      carousel={{ finite: true }}
      controller={{ closeOnBackdropClick: true }}
      on={{ view: ({ index: i }) => onIndexChange?.(i) }}
      // Config do Zoom (desktop: roda do mouse; mobile: pinch/duplo toque)
      zoom={{
        // limites e “passos” do zoom para suavizar
        maxZoomPixelRatio: 2.5, // limita o zoom máximo (evita “pulo”)
        zoomInMultiplier: 1.3, // antes era ~2; menor = passos mais curtos

        // mouse wheel: menos sensível e com passos menores
        wheelZoomSpeed: 0.08, // padrão ~0.1–0.2 (reduz para suavizar)
        wheelZoomDistanceFactor: 110, // maior = precisa “rolar” mais para o mesmo zoom

        // pinch (mobile): mais suave ao juntar/dedilhar
        pinchZoomDistanceFactor: 140, // maior = menos sensível, mais controle

        // duplo toque/clique: não “teletransporta” pro máximo
        doubleTapDelay: 300,
        doubleClickDelay: 300,
        doubleClickMaxStops: 2, // no máx. 2 “degraus” por duplo clique

        // evita scroll da página virar zoom em desktop (mais previsível)
        scrollToZoom: false,
      }}
      // Barra de ações personalizada (mantida)
      render={{
        toolbar: ({ index: i }) => {
          const current = lbSlides[i];
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
            <>
              {/* Dica de zoom para mobile */}
              {showHint && (
                <div
                  className="pointer-events-none fixed top-5 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1.5 text-xs text-white backdrop-blur"
                  style={{ zIndex: 1000000001 }}
                >
                  Toque duplo ou “pinça” para dar zoom
                </div>
              )}

              {/* Barra de ações */}
              <div
                className="pointer-events-auto fixed left-1/2 -translate-x-1/2 bottom-6
                           flex items-center gap-2 rounded-xl border border-slate-700
                           bg-slate-900/85 backdrop-blur px-3 py-2"
                style={{ zIndex: 1000000000 }}
              >
                <span className="text-slate-200 text-sm max-w-[40vw] truncate overflow-auto">
                  {current.title || ""}
                </span>
                <div className="w-px h-5 bg-slate-700 mx-2" />
                <Btn variant="primary" onClick={() => onSetCover?.(slides[i])}>
                  ⭐ Capa
                </Btn>
                <Btn onClick={() => onEditTitle?.(slides[i])}>✏️ Título</Btn>
                <Btn variant="danger" onClick={() => onRemove?.(slides[i])}>
                  🗑️ Remover
                </Btn>
              </div>
            </>
          );
        },
      }}
      styles={{
        container: { backgroundColor: "rgba(0,0,0,0.85)" },
      }}
    />
  );
}
