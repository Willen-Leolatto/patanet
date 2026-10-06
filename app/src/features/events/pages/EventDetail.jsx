// src/features/events/pages/EventDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, CalendarDays, Clock, MapPin, Link as LinkIcon, Users, Heart, UserPlus, X, Search } from "lucide-react";

import {
  fetchEventById,
  deleteEvent,
  repostEvent,
  attendEvent,
  cancelEventAttendance,
  fetchEventAttendees,
  fetchMyAttendance,
  registerAdoptableAnimal,
  transferAdoptionTutorship,
} from "@/api/events.api.js";
import { fetchAdoptableAnimals, adoptAnimal } from "@/api/animal.api.js";
import { getMyProfile, fetchUsersProfile } from "@/api/user.api";
import { useToast } from "@/components/ui/ToastProvider";
import { useConfirm } from "@/components/ui/ConfirmProvider";

const isNotImplemented = (err) => {
  const s = err?.response?.status;
  return s === 404 || s === 405 || s === 501;
};

export default function EventDetail() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [me, setMe] = useState(null);
  const [attending, setAttending] = useState(false);
  const [waitlisted, setWaitlisted] = useState(false);
  const [waitlistPosition, setWaitlistPosition] = useState(null);
  const [attendLoading, setAttendLoading] = useState(false);
  const [attendeesCount, setAttendeesCount] = useState(0);
  const [attendees, setAttendees] = useState([]);

  // Adoção — pets vinculados a este evento (instituições)
  const [adoptableAnimals, setAdoptableAnimals] = useState([]);
  const [loadingAdoptable, setLoadingAdoptable] = useState(false);
  const [adoptingId, setAdoptingId] = useState(null);

  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkableAnimals, setLinkableAnimals] = useState([]);
  const [loadingLinkable, setLoadingLinkable] = useState(false);
  const [linkingId, setLinkingId] = useState(null);

  const [transferAnimal, setTransferAnimal] = useState(null);
  const [transferQuery, setTransferQuery] = useState("");
  const [transferResults, setTransferResults] = useState([]);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferring, setTransferring] = useState(false);

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
        if (!cancel) setAttendeesCount(ev?.attendeesCount ?? 0);

        try {
          const attResp = await fetchEventAttendees(eventId, { page: 1, perPage: 10 });
          const list = attResp?.data || [];
          if (!cancel) setAttendees(list);
        } catch {
          // lista de participantes é opcional; ignora falha silenciosamente
        }
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

  useEffect(() => {
    let cancel = false;
    if (!me?.id || !eventId) {
      setAttending(false);
      setWaitlisted(false);
      setWaitlistPosition(null);
      return;
    }
    (async () => {
      try {
        const resp = await fetchMyAttendance(eventId);
        if (cancel) return;
        setAttending(Boolean(resp?.attending));
        // Backend esperado: fetchMyAttendance pode retornar também
        // { waitlisted, waitlistPosition } quando o evento está lotado.
        setWaitlisted(Boolean(resp?.waitlisted));
        setWaitlistPosition(
          Number.isFinite(resp?.waitlistPosition) ? resp.waitlistPosition : null
        );
      } catch {
        // ok: endpoint pode não estar disponível ainda
      }
    })();
    return () => {
      cancel = true;
    };
  }, [me, eventId]);

  // Autor do evento / instituição (para gerenciar pets de adoção)
  const eventOwnerId =
    event?.author?.id ??
    event?.authorId ??
    event?.owner?.id ??
    event?.ownerId ??
    event?.user?.id ??
    event?.userId ??
    null;
  const isMine = Boolean(
    me?.id && eventOwnerId && String(me.id) === String(eventOwnerId)
  );
  const isInstitution = String(me?.role || "").toUpperCase() === "INSTITUTION";
  const canManageAdoption = isMine && isInstitution;

  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!eventId) return;
      setLoadingAdoptable(true);
      try {
        const resp = await fetchAdoptableAnimals({ eventId, page: 1, perPage: 50 });
        const list =
          (resp && Array.isArray(resp.data) && resp.data) ||
          (Array.isArray(resp) && resp) ||
          (resp && Array.isArray(resp.items) && resp.items) ||
          [];
        if (!cancel) setAdoptableAnimals(list);
      } catch {
        if (!cancel) setAdoptableAnimals([]);
      } finally {
        if (!cancel) setLoadingAdoptable(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [eventId]);

  async function handleAdoptFromEvent(animal) {
    if (!animal?.id) return;
    setAdoptingId(animal.id);
    try {
      await adoptAnimal({ animalId: animal.id });
      toast.success(`Você agora é o tutor de ${animal.name || "este pet"}!`);
      setAdoptableAnimals((list) => list.filter((x) => x.id !== animal.id));
    } catch (e) {
      console.error(e);
      if (isNotImplemented(e)) toast.info("Este item será habilitado em breve");
      else
        toast.error(
          e?.response?.data?.message || "Não foi possível adotar este pet."
        );
    } finally {
      setAdoptingId(null);
    }
  }

  async function openLinkModal() {
    setLinkModalOpen(true);
    setLoadingLinkable(true);
    try {
      const resp = await fetchAdoptableAnimals({ page: 1, perPage: 100 });
      const list =
        (resp && Array.isArray(resp.data) && resp.data) ||
        (Array.isArray(resp) && resp) ||
        (resp && Array.isArray(resp.items) && resp.items) ||
        [];
      setLinkableAnimals(list.filter((a) => !a.adoptionEventId));
    } catch {
      setLinkableAnimals([]);
    } finally {
      setLoadingLinkable(false);
    }
  }

  async function handleLinkAnimal(animal) {
    if (!animal?.id) return;
    setLinkingId(animal.id);
    try {
      await registerAdoptableAnimal(eventId, animal.id);
      toast.success(`${animal.name || "Pet"} vinculado ao evento.`);
      setAdoptableAnimals((list) => [...list, animal]);
      setLinkableAnimals((list) => list.filter((x) => x.id !== animal.id));
    } catch (e) {
      console.error(e);
      toast.error(
        e?.response?.data?.message || "Não foi possível vincular este pet."
      );
    } finally {
      setLinkingId(null);
    }
  }

  function openTransferModal(animal) {
    setTransferAnimal(animal);
    setTransferQuery("");
    setTransferResults([]);
  }

  async function runTransferSearch(q) {
    const query = q.trim();
    if (!query) {
      setTransferResults([]);
      return;
    }
    setTransferLoading(true);
    try {
      const resp = await fetchUsersProfile({ query, page: 1, perPage: 10 });
      const list =
        (resp && Array.isArray(resp.data) && resp.data) ||
        (Array.isArray(resp) && resp) ||
        (resp && Array.isArray(resp.items) && resp.items) ||
        [];
      setTransferResults(list);
    } catch {
      setTransferResults([]);
    } finally {
      setTransferLoading(false);
    }
  }

  useEffect(() => {
    if (!transferAnimal) return;
    if (!transferQuery) {
      setTransferResults([]);
      return;
    }
    const t = setTimeout(() => runTransferSearch(transferQuery), 350);
    return () => clearTimeout(t);
  }, [transferQuery, transferAnimal]);

  async function handleTransfer(user) {
    if (!transferAnimal?.id || !user?.id) return;
    setTransferring(true);
    try {
      await transferAdoptionTutorship(eventId, transferAnimal.id, user.id);
      toast.success(
        `Tutoria de ${transferAnimal.name || "pet"} transferida para ${
          user.username ? `@${user.username}` : user.name || "o novo tutor"
        }.`
      );
      setAdoptableAnimals((list) => list.filter((x) => x.id !== transferAnimal.id));
      setTransferAnimal(null);
    } catch (e) {
      console.error(e);
      toast.error(
        e?.response?.data?.message || "Não foi possível transferir a tutoria."
      );
    } finally {
      setTransferring(false);
    }
  }

  const isFull =
    Boolean(event?.capacity) && attendeesCount >= event?.capacity && !attending;

  const handleToggleAttendance = async () => {
    setAttendLoading(true);
    try {
      if (attending || waitlisted) {
        const resp = await cancelEventAttendance(eventId);
        setAttending(false);
        setWaitlisted(false);
        setWaitlistPosition(null);
        if (!waitlisted) {
          setAttendeesCount(resp?.attendeesCount ?? Math.max(0, attendeesCount - 1));
        }
        toast.success(waitlisted ? "Você saiu da lista de espera." : "Presença cancelada.");
      } else {
        // Backend esperado: quando o evento está lotado, attendEvent deve
        // colocar o usuário na fila e responder
        // { attending: false, waitlisted: true, waitlistPosition: n }
        // em vez de erro; caso contrário, confirma a presença normalmente.
        const resp = await attendEvent(eventId);
        if (resp?.waitlisted) {
          setAttending(false);
          setWaitlisted(true);
          setWaitlistPosition(
            Number.isFinite(resp?.waitlistPosition) ? resp.waitlistPosition : null
          );
          toast.success(
            resp?.waitlistPosition
              ? `Vagas esgotadas. Você entrou na lista de espera (posição ${resp.waitlistPosition}).`
              : "Vagas esgotadas. Você entrou na lista de espera."
          );
        } else {
          setAttending(true);
          setWaitlisted(false);
          setWaitlistPosition(null);
          setAttendeesCount(resp?.attendeesCount ?? attendeesCount + 1);
          toast.success("Vaga garantida!");
        }
      }
    } catch (e) {
      console.error(e);
      if (isNotImplemented(e)) toast.info("Este item será habilitado em breve");
      else
        toast.error(
          e?.response?.data?.message || "Não foi possível atualizar sua presença."
        );
    } finally {
      setAttendLoading(false);
    }
  };

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
                  const ok = await confirm({
                    title: "Repostar este evento no feed?",
                    description: "Isso não cria um evento novo, apenas recria o post vinculado.",
                    confirmText: "Repostar",
                    tone: "confirm",
                  });
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
                  const ok = await confirm({
                    title: "Remover este evento?",
                    description: "Isso também deve remover o item relacionado no feed.",
                    confirmText: "Remover",
                    tone: "danger",
                  });
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

          <div className="mt-5 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Users className="h-4 w-4" />
                <span>
                  {attendeesCount} confirmado{attendeesCount === 1 ? "" : "s"}
                  {event?.capacity ? ` de ${event.capacity} vagas` : ""}
                </span>
              </div>

              {me && (
                <div className="flex items-center gap-2">
                  {waitlisted && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                      {waitlistPosition ? `#${waitlistPosition} na fila` : "Na lista de espera"}
                    </span>
                  )}
                  <button
                    type="button"
                    disabled={attendLoading}
                    onClick={handleToggleAttendance}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-50 ${
                      attending || waitlisted
                        ? "border border-zinc-300 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                        : "bg-emerald-600 text-white hover:opacity-90"
                    }`}
                  >
                    {attendLoading
                      ? "Aguarde..."
                      : attending
                      ? "Cancelar presença"
                      : waitlisted
                      ? "Sair da lista de espera"
                      : isFull
                      ? "Entrar na Lista de Espera"
                      : "Garantir Vaga"}
                  </button>
                </div>
              )}
            </div>

            {attendees.length > 0 && (
              <ul className="mt-3 flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-300">
                {attendees.map((a) => (
                  <li key={a.id} className="flex items-center gap-2">
                    {a.image ? (
                      <img src={a.image} alt={a.name} className="h-6 w-6 rounded-full object-cover" />
                    ) : (
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-zinc-200 text-[10px] font-semibold dark:bg-zinc-800">
                        {(a.name || "?").charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span>{a.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Pets para adoção deste evento (instituições) */}
          {(adoptableAnimals.length > 0 || canManageAdoption) && (
            <div className="mt-5 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Heart className="h-4 w-4" />
                  <span>Pets para adoção</span>
                </div>
                {canManageAdoption && (
                  <button
                    type="button"
                    onClick={openLinkModal}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#f77904] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                  >
                    <UserPlus className="h-3.5 w-3.5" /> Vincular pet
                  </button>
                )}
              </div>

              {loadingAdoptable ? (
                <div className="mt-3 text-sm opacity-70">Carregando…</div>
              ) : adoptableAnimals.length === 0 ? (
                <div className="mt-3 text-sm opacity-70">
                  Nenhum pet vinculado a este evento ainda.
                </div>
              ) : (
                <ul className="mt-3 space-y-2">
                  {adoptableAnimals.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center justify-between gap-3 rounded-xl bg-[var(--chip-bg)] px-3 py-2 ring-1 ring-black/5 dark:ring-white/5"
                    >
                      <Link
                        to={`/pets/${a.id}`}
                        className="flex min-w-0 items-center gap-3 hover:opacity-90"
                      >
                        <img
                          src={
                            a?.image?.url ||
                            a?.image ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              a?.name || "Pet"
                            )}`
                          }
                          alt={a?.name || "Pet"}
                          className="h-9 w-9 rounded-full object-cover bg-zinc-200 dark:bg-zinc-700"
                        />
                        <span className="truncate text-sm font-semibold">
                          {a?.name || "Pet"}
                        </span>
                      </Link>

                      <div className="flex items-center gap-2">
                        {me && (
                          <button
                            type="button"
                            onClick={() => handleAdoptFromEvent(a)}
                            disabled={adoptingId === a.id}
                            className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                          >
                            <Heart className="h-3.5 w-3.5" />{" "}
                            {adoptingId === a.id ? "Adotando..." : "Adotar"}
                          </button>
                        )}
                        {canManageAdoption && (
                          <button
                            type="button"
                            onClick={() => openTransferModal(a)}
                            className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                          >
                            Transferir tutoria
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
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

      {linkModalOpen && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/55 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-xl ring-1 ring-black/10 dark:bg-zinc-900 dark:ring-white/10">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 text-sm font-semibold">
                <Heart className="h-4 w-4" /> Vincular pet sem dono
              </div>
              <button
                className="rounded-md p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                onClick={() => setLinkModalOpen(false)}
                title="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[50vh] overflow-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
              {loadingLinkable ? (
                <div className="p-4 text-sm opacity-70">Carregando…</div>
              ) : linkableAnimals.length === 0 ? (
                <div className="p-4 text-sm opacity-70">
                  Nenhum pet sem dono disponível para vincular.
                </div>
              ) : (
                <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {linkableAnimals.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-3 p-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <img
                          src={
                            a?.image?.url ||
                            a?.image ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              a?.name || "Pet"
                            )}`
                          }
                          alt={a?.name || "Pet"}
                          className="h-10 w-10 rounded-full object-cover bg-zinc-200 dark:bg-zinc-700"
                        />
                        <div className="truncate text-sm font-semibold">
                          {a?.name || "Pet"}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleLinkAnimal(a)}
                        disabled={linkingId === a.id}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#f77904] px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
                      >
                        {linkingId === a.id ? "Vinculando..." : "Vincular"}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setLinkModalOpen(false)}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {transferAnimal && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/55 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-xl ring-1 ring-black/10 dark:bg-zinc-900 dark:ring-white/10">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 text-sm font-semibold">
                <UserPlus className="h-4 w-4" /> Transferir tutoria de{" "}
                {transferAnimal?.name || "pet"}
              </div>
              <button
                className="rounded-md p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                onClick={() => setTransferAnimal(null)}
                title="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                value={transferQuery}
                onChange={(e) => setTransferQuery(e.target.value)}
                placeholder="Buscar por nome ou @username…"
                className="w-full rounded-lg border border-zinc-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>

            <div className="mt-3 max-h-[50vh] overflow-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
              {transferLoading ? (
                <div className="p-4 text-sm opacity-70">Buscando…</div>
              ) : transferQuery && transferResults.length === 0 ? (
                <div className="p-4 text-sm opacity-70">Nenhum perfil encontrado.</div>
              ) : transferResults.length === 0 ? (
                <div className="p-4 text-sm opacity-70">Digite para buscar o novo tutor.</div>
              ) : (
                <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {transferResults.map((u) => (
                    <li key={u.id} className="flex items-center justify-between gap-3 p-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <img
                          src={
                            u?.image?.url ||
                            u?.image ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              u?.name || u?.username || "User"
                            )}`
                          }
                          alt={u?.name || u?.username || "Usuário"}
                          className="h-10 w-10 rounded-full object-cover bg-zinc-200 dark:bg-zinc-700"
                        />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold">
                            {u?.username ? `@${u.username}` : u?.name || "usuário"}
                          </div>
                          {u?.name && (
                            <div className="truncate text-xs opacity-70">{u.name}</div>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleTransfer(u)}
                        disabled={transferring}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#f77904] px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
                      >
                        {transferring ? "Transferindo..." : "Transferir"}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setTransferAnimal(null)}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
