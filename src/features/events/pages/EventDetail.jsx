// src/features/events/pages/EventDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Clock, MapPin, Link as LinkIcon } from "lucide-react";

import { fetchEventById, deleteEvent, repostEvent } from "@/api/events.api.js";
import { getMyProfile } from "@/api/user.api";
import { useToast } from "@/components/ui/ToastProvider";

const isNotImplemented = (err) => {
  const s = err?.response?.status;
  return s === 404 || s === 405 || s === 501;
};

export default function EventDetail() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [me, setMe] = useState(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      try {
        // tenta pegar o usuário logado (para habilitar ações de dono)
        try {
          const u = await getMyProfile();
          if (!cancel) setMe(u || null);
        } catch {
          // ok: página pode ser acessada sem sessão
        }

        const resp = await fetchEventById(eventId);
        const ev = resp?.data || resp || null;
        if (!cancel) setEvent(ev);
      } catch (e) {
        console.error(e);
        if (isNotImplemented(e)) toast.info("Este item será habilitado em breve");
        if (!cancel) setEvent(null);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [eventId]);

  const cover = useMemo(
    () => event?.imageUrl || event?.image?.url || event?.image || "",
    [event]
  );

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-3xl p-4 md:p-6">
        <div className="h-6 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-4 h-56 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-4 space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto w-full max-w-3xl p-4 md:p-6">
        <button
          type="button"
          onClick={() => navigate("/feed")}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>

        <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          Evento não encontrado.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate("/feed")}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
        <div className="text-base font-semibold">Evento</div>
        </div>

        {(() => {
          const ownerId =
            event?.author?.id ??
            event?.authorId ??
            event?.owner?.id ??
            event?.ownerId ??
            event?.user?.id ??
            event?.userId ??
            null;
          const isMine = me?.id && ownerId && String(me.id) === String(ownerId);
          if (!isMine) return null;
          return (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate(`/eventos/${eventId}/editar`)}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              >
                Editar evento
              </button>
              <button
                type="button"
                onClick={async () => {
                  // Recria o post vinculado caso tenha sido removido do feed
                  const ok = window.confirm(
                    "Repostar este evento no feed?\n\nIsso não cria um evento novo, apenas recria o post vinculado."
                  );
                  if (!ok) return;
                  try {
                    await repostEvent(eventId);
                    toast.success("Evento repostado no feed.");
                  } catch (e) {
                    console.error(e);
                    if (isNotImplemented(e)) toast.info("Este item será habilitado em breve");
                    else toast.error("Não foi possível repostar o evento.");
                  }
                }}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              >
                Repostar no feed
              </button>

              <button
                type="button"
                onClick={async () => {
                  const ok = window.confirm(
                    "Remover este evento?\n\nIsso também deve remover o item relacionado no feed."
                  );
                  if (!ok) return;
                  try {
                    await deleteEvent(eventId);
                    toast.success("Evento removido.");
                    navigate("/eventos");
                  } catch (e) {
                    console.error(e);
                    if (isNotImplemented(e)) toast.info("Este item será habilitado em breve");
                    else toast.error("Não foi possível remover o evento.");
                  }
                }}
                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                Remover evento
              </button>
            </div>
          );
        })()}
      </div>

      <article className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="relative h-60 w-full bg-zinc-100 dark:bg-zinc-800">
          {cover ? (
            <img src={cover} alt={event?.title || "Evento"} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-zinc-400">
              <CalendarDays className="h-12 w-12 opacity-50" />
            </div>
          )}
        </div>

        <div className="p-5">
          <h1 className="text-xl font-bold leading-tight">{event?.title || "Evento"}</h1>

          <div className="mt-3 grid gap-2 text-sm text-zinc-600 dark:text-zinc-300">
            {event?.date && (
              <div className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                <span>{new Date(event.date).toLocaleDateString("pt-BR")}</span>
              </div>
            )}
            {event?.time && (
              <div className="inline-flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{event.time}</span>
              </div>
            )}
            {event?.locationText && (
              <div className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{event.locationText}</span>
              </div>
            )}
          </div>

          {event?.description && (
            <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">{event.description}</div>
          )}

          {/* Caso o backend queira expor algum link externo no futuro */}
          {event?.link && (
            <a
              href={event.link}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            >
              <LinkIcon className="h-4 w-4" /> Acessar link
            </a>
          )}
        </div>
      </article>
    </div>
  );
}
