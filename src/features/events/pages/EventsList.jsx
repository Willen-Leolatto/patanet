// src/features/events/pages/EventsList.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Search } from "lucide-react";

import { fetchEvents } from "@/api/events.api.js";
import { useToast } from "@/components/ui/ToastProvider";
import EventCard from "@/features/events/components/EventCard";
import { eventToDate, isPastEvent } from "@/features/events/utils/eventDate";

const isNotImplemented = (err) => {
  const s = err?.response?.status;
  return s === 404 || s === 405 || s === 501;
};

function TabButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm transition ${
        active
          ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
          : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
      }`}
    >
      {children}
    </button>
  );
}

export default function EventsList() {
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [tab, setTab] = useState("upcoming"); // upcoming | past | all
  const [q, setQ] = useState("");

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      try {
        // carrega uma primeira página "grande" (front faz filtro/sort local)
        const resp = await fetchEvents({ page: 1, perPage: 50 });
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
  }, [toast]);

  const normalized = useMemo(() => {
    const now = new Date();

    const withMeta = (Array.isArray(events) ? events : []).map((ev) => {
      const dt = eventToDate(ev);
      const past = isPastEvent(ev, now);
      return { ev, dt, past };
    });

    const needle = q.trim().toLowerCase();
    const filteredByQuery = needle
      ? withMeta.filter(({ ev }) => {
          const title = String(ev?.title || "").toLowerCase();
          const desc = String(ev?.description || "").toLowerCase();
          const loc = String(ev?.locationText || "").toLowerCase();
          return (
            title.includes(needle) ||
            desc.includes(needle) ||
            loc.includes(needle)
          );
        })
      : withMeta;

    const upcoming = filteredByQuery
      .filter((x) => !x.past)
      .sort((a, b) => {
        const ta = a.dt ? a.dt.getTime() : Number.POSITIVE_INFINITY;
        const tb = b.dt ? b.dt.getTime() : Number.POSITIVE_INFINITY;
        return ta - tb;
      });

    const past = filteredByQuery
      .filter((x) => x.past)
      .sort((a, b) => {
        const ta = a.dt ? a.dt.getTime() : 0;
        const tb = b.dt ? b.dt.getTime() : 0;
        return tb - ta;
      });

    const all = [...upcoming, ...past];

    return { upcoming, past, all };
  }, [events, q]);

  const list = tab === "past" ? normalized.past : tab === "all" ? normalized.all : normalized.upcoming;

  return (
    <div className="mx-auto w-full max-w-5xl p-4 md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate("/feed")}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao feed
        </button>

        <div className="min-w-[180px] text-center">
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

      {/* filtros */}
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center gap-2">
          <TabButton active={tab === "upcoming"} onClick={() => setTab("upcoming")}>
            Próximos ({normalized.upcoming.length})
          </TabButton>
          <TabButton active={tab === "past"} onClick={() => setTab("past")}>
            Passados ({normalized.past.length})
          </TabButton>
          <TabButton active={tab === "all"} onClick={() => setTab("all")}>
            Todos ({normalized.all.length})
          </TabButton>
        </div>

        <label className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
          <Search className="h-4 w-4 text-zinc-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filtrar por título, local ou descrição…"
            className="w-full bg-transparent outline-none"
          />
        </label>

        <div className="text-xs text-zinc-500">
          Eventos passados aparecem como *encerrados* e ficam bloqueados para abrir.
        </div>
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
      ) : list.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          Nenhum evento encontrado.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {list.map(({ ev }) => (
            <EventCard key={ev.id} event={ev} disabledPast />
          ))}
        </div>
      )}
    </div>
  );
}
