// src/components/ReportModal.jsx
import React, { useMemo, useState } from "react";
import { X, ShieldAlert } from "lucide-react";
import { createReport } from "@/api/reports.api";
import { useToast } from "@/components/ui/ToastProvider";

const categoryLabels = {
  GENERAL: "Geral",
  CSAE: "Segurança Infantil (CSAE)",
  PET_ABUSE: "Maus-tratos a animais",
};

const typeLabels = {
  POST: "Post",
  USER: "Usuário",
  ANIMAL: "Pet",
  OTHER: "Outro",
};

export default function ReportModal({
  open,
  onClose,
  initialType = "POST",
  initialCategory = "GENERAL",
  targetId,
  contextText = "",
}) {
  const toast = useToast();
  const [type, setType] = useState(initialType);
  const [category, setCategory] = useState(initialCategory);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  React.useEffect(() => {
    if (!open) return;
    setType(initialType);
    setCategory(initialCategory);
    setMessage("");
    setBusy(false);
  }, [open, initialType, initialCategory]);

  const title = useMemo(() => {
    return `Denunciar ${typeLabels[type] || "conteúdo"}`;
  }, [type]);

  if (!open) return null;

  async function submit() {
    if (!targetId) {
      toast.error("Não foi possível identificar o item para denúncia.");
      return;
    }
    if (!String(message || "").trim()) {
      toast.info("Descreva o motivo da denúncia.");
      return;
    }

    try {
      setBusy(true);
      await createReport({
        type,
        category,
        targetId: String(targetId),
        message: String(message).trim(),
      });
      toast.success("Denúncia enviada. Obrigado por ajudar a manter a comunidade segura.");
      onClose?.();
    } catch (e) {
      console.error(e);
      toast.error("Não foi possível enviar a denúncia agora. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-800">
          <div className="inline-flex items-center gap-2 text-sm font-semibold">
            <ShieldAlert className="h-4 w-4" /> {title}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 p-4">
          {contextText ? (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
              {contextText}
            </div>
          ) : null}

          <div className="grid gap-2">
            <div className="text-xs font-medium text-zinc-600 dark:text-zinc-300">O que você quer denunciar?</div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCategory("GENERAL")}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                  category === "GENERAL"
                    ? "bg-orange-600 text-white"
                    : "bg-orange-50 text-orange-800 hover:bg-orange-100 dark:bg-orange-950/20 dark:text-orange-200 dark:hover:bg-orange-950/30"
                }`}
              >
                Denúncia (geral)
              </button>

              <button
                type="button"
                onClick={() => {
                  setType("ANIMAL");
                  setCategory("PET_ABUSE");
                }}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                  category === "PET_ABUSE"
                    ? "bg-rose-600 text-white"
                    : "bg-rose-50 text-rose-800 hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-200 dark:hover:bg-rose-950/30"
                }`}
                title="Denúncia de maus-tratos a animais"
              >
                Maus-tratos (pet)
              </button>

              <button
                type="button"
                onClick={() => setCategory("CSAE")}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                  category === "CSAE"
                    ? "bg-red-700 text-white"
                    : "bg-red-50 text-red-800 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-200 dark:hover:bg-red-950/30"
                }`}
                title="Segurança infantil (CSAE)"
              >
                CSAE (infantil)
              </button>
            </div>

            <div className="text-[11px] text-zinc-500">
              {category === "PET_ABUSE"
                ? "Use este botão para denunciar possíveis maus-tratos, abandono ou violência contra animais."
                : category === "CSAE"
                ? "CSAE: conteúdo envolvendo exploração/abuso sexual infantil. Em caso de risco imediato, procure as autoridades locais."
                : "Use Denúncia (geral) para spam, golpes, assédio e outras violações das diretrizes."}
            </div>
          </div>

          <label className="grid gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-300">
            Descrição (obrigatória)
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="Explique o que aconteceu e por quê isso viola as diretrizes…"
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-300 dark:border-zinc-800 dark:bg-zinc-950"
            />
          </label>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={submit}
              className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${
                category === "CSAE" ? "bg-red-600 hover:bg-red-700" : "bg-[#f77904] hover:opacity-90"
              } ${busy ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {busy ? "Enviando…" : "Enviar denúncia"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
