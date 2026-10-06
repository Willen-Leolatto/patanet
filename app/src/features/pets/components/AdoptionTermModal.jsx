// src/features/pets/components/AdoptionTermModal.jsx
import React, { useEffect, useState } from "react";
import { X, Heart, Syringe, ShieldCheck, PenLine } from "lucide-react";

import { fetchVaccines } from "@/api/vaccines.api.js";
import { submitAdoptionApplication } from "@/api/animal.api.js";
import { useToast } from "@/components/ui/ToastProvider";

export const ADOPTION_TERM_VERSION = "2026-09-15";

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-BR");
  } catch {
    return iso;
  }
}

/**
 * Fluxo de candidatura à adoção: mostra o histórico de vacinas do pet e
 * exige a assinatura do Termo Digital de Adoção Responsável antes de
 * enviar a candidatura.
 */
export default function AdoptionTermModal({ pet, open, onClose, onCompleted }) {
  const toast = useToast();

  const [vaccines, setVaccines] = useState([]);
  const [loadingVaccines, setLoadingVaccines] = useState(false);
  const [message, setMessage] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [signature, setSignature] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !pet?.id) return;
    setMessage("");
    setAgreed(false);
    setSignature("");
    setLoadingVaccines(true);
    (async () => {
      try {
        const resp = await fetchVaccines({ animalId: pet.id, page: 1, perPage: 50 });
        const list =
          (resp && Array.isArray(resp.data) && resp.data) ||
          (Array.isArray(resp) && resp) ||
          (resp && Array.isArray(resp.items) && resp.items) ||
          [];
        setVaccines(list);
      } catch {
        setVaccines([]);
      } finally {
        setLoadingVaccines(false);
      }
    })();
  }, [open, pet?.id]);

  if (!open || !pet) return null;

  const canSubmit = agreed && signature.trim().length >= 3 && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const resp = await submitAdoptionApplication({
        animalId: pet.id,
        message: message.trim() || undefined,
        signatureName: signature.trim(),
        termVersion: ADOPTION_TERM_VERSION,
      });
      const isPending = String(resp?.status || "").toUpperCase() === "PENDING";
      toast.success(
        isPending
          ? "Candidatura enviada! A instituição/tutor vai avaliar seu pedido."
          : `Você agora é o tutor de ${pet.name || "este pet"}!`
      );
      onCompleted?.(pet, resp);
      onClose?.();
    } catch (e) {
      console.error(e);
      toast.error(
        e?.response?.data?.message || "Não foi possível enviar sua candidatura."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div className="inline-flex items-center gap-2 text-base font-semibold">
            <Heart className="h-5 w-5 text-[#f77904]" />
            Quero adotar {pet.name || "este pet"}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            title="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          {/* Carteira de vacinas */}
          <section>
            <div className="mb-2 inline-flex items-center gap-2 text-sm font-semibold">
              <Syringe className="h-4 w-4" /> Histórico de vacinas
            </div>
            {loadingVaccines ? (
              <div className="rounded-lg border border-zinc-200 p-3 text-sm opacity-70 dark:border-zinc-800">
                Carregando carteira de vacinas…
              </div>
            ) : vaccines.length === 0 ? (
              <div className="rounded-lg border border-zinc-200 p-3 text-sm opacity-70 dark:border-zinc-800">
                Nenhuma vacina registrada para este pet ainda.
              </div>
            ) : (
              <ul className="space-y-1.5">
                {vaccines.map((v) => (
                  <li
                    key={v.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"
                  >
                    <span className="font-medium">{v.name}</span>
                    <span className="flex items-center gap-2 text-xs opacity-80">
                      {formatDate(v.appliedAt || v.date)}
                      {v.crmv && v.crmvUf && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-100 px-2 py-0.5 font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                          <ShieldCheck className="h-3 w-3" /> CRMV {v.crmv}/{v.crmvUf}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Mensagem opcional ao tutor/instituição */}
          <section>
            <label className="mb-1 block text-sm font-medium">
              Conte um pouco sobre você (opcional)
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Rotina, espaço em casa, experiência com pets…"
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-800"
            />
          </section>

          {/* Termo Digital de Adoção Responsável */}
          <section className="rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="border-b border-zinc-200 px-4 py-2 text-sm font-semibold dark:border-zinc-800">
              Termo Digital de Adoção Responsável
            </div>
            <div className="max-h-40 overflow-y-auto px-4 py-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
              <p>
                Ao assinar este termo, declaro que desejo adotar {pet.name || "este pet"} de
                forma responsável e consciente, comprometendo-me a:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Prover alimentação, água, abrigo e cuidados veterinários adequados;</li>
                <li>Manter a carteira de vacinação e vermifugação em dia;</li>
                <li>Não abandonar, maltratar ou submeter o animal a maus-tratos;</li>
                <li>Comunicar à instituição/tutor anterior caso não possa mais cuidar do pet, buscando uma transferência responsável de tutoria;</li>
                <li>Fornecer um ambiente seguro, compatível com o porte e as necessidades da espécie.</li>
              </ul>
              <p className="mt-2">
                Este termo tem valor de compromisso pessoal e poderá ser usado como referência
                em caso de denúncia de maus-tratos.
              </p>
            </div>
            <div className="border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
              <label className="flex cursor-pointer items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 accent-orange-500"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
                Li e concordo com o Termo de Adoção Responsável.
              </label>

              <label className="mt-3 block text-xs font-medium opacity-80">
                <span className="inline-flex items-center gap-1">
                  <PenLine className="h-3.5 w-3.5" /> Assinatura (digite seu nome completo)
                </span>
              </label>
              <input
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Seu nome completo"
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-800"
              />
            </div>
          </section>
        </div>

        <div className="flex justify-end gap-2 border-t border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 rounded-lg bg-[#f77904] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Heart className="h-4 w-4" />
            {submitting ? "Enviando…" : "Assinar e confirmar candidatura"}
          </button>
        </div>
      </div>
    </div>
  );
}
