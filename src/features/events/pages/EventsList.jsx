// src/features/events/pages/EventsList.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarDays, Clock, MapPin, Plus } from "lucide-react";

import { fetchEvents } from "@/api/events.api.js";
import { useToast } from "@/components/ui/ToastProvider";

const isNotImplemented = (err) => {
  const s = err?.response?.status;
  return s === 404 || s === 405 || s === 501;
};

function EventCard({ event, onClick }) {
  const cover = event?.image?.url || event?.image || "";
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white text-left shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="relative h-40 w-full bg-zinc-100 dark:bg-zinc-800">
        {cover ? (
          <img
            src={cover}
            alt={event?.title || "Evento"}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="grid h-full place-items-center text-zinc-400">
            <CalendarDays className="h-10 w-10 opacity-50" />
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="text-base font-semibold leading-tight">
          {event?.title || "Evento"}
        </div>
        {event?.description && (
          <div className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-300">
            {event.description}
          </div>
        )}

        <div className="mt-3 grid gap-1 text-xs text-zinc-500">
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
              <span className="line-clamp-1">{event.locationText}</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

export default function EventsList() {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      try {
        const resp = await fetchEvents({ page: 1, perPage: 20 });
        const list = Array.isArray(resp)
          ? resp
          : Array.isArray(resp?.data)
          ? resp.data
          : [];
        if (!cancel) setEvents(list);
      } catch (e) {
        console.error(e);
        if (isNotImplemented(e)) toast.info("Este item será habilitado em breve");
        if (!cancel) setEvents([]);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-5xl p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate("/feed")}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao feed
        </button>
        <div>
          <div className="text-base font-semibold">Eventos</div>
          <div className="text-xs text-zinc-500">Encontros, feiras e atividades</div>
        </div>

        <button
          type="button"
          onClick={() => navigate("/eventos/novo")}
          className="inline-flex items-center gap-2 rounded-lg bg-[#f77904] px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Criar
        </button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-60 animate-pulse rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
            />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          Nenhum evento disponível no momento.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {events.map((ev) => (
            <EventCard key={ev.id} event={ev} onClick={() => navigate(`/eventos/${ev.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}
