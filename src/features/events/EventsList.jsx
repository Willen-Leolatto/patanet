import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, MapPin, Clock } from "lucide-react";

import { fetchEvents } from "../api/events.api";
import PageHeader from "@/components/PageHeader";
import Loading from "@/components/Loading";

export default function EventsList() {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    try {
      setLoading(true);
      const response = await fetchEvents({ page: 1, perPage: 20 });

      // Aceita tanto array direto quanto { data }
      const list = Array.isArray(response)
        ? response
        : response?.data ?? [];

      setEvents(list);
    } catch (err) {
      console.error("Erro ao carregar eventos:", err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="flex flex-col gap-6 px-4 pb-10 max-w-5xl mx-auto">
      <PageHeader
        title="Eventos"
        subtitle="Encontros, feiras e atividades para a comunidade"
      />

      {events.length === 0 ? (
        <div className="text-center text-muted-foreground py-20">
          <Calendar className="mx-auto mb-4 h-10 w-10 opacity-50" />
          <p>Nenhum evento disponível no momento.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {events.map((event) => (
            <div
              key={event.id}
              onClick={() => navigate(`/eventos/${event.id}`)}
              className="group cursor-pointer overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:shadow-md"
            >
              {/* Imagem */}
              <div className="relative h-40 w-full bg-muted">
                {event.image ? (
                  <img
                    src={event.image}
                    alt={event.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <Calendar className="h-10 w-10 opacity-40" />
                  </div>
                )}
              </div>

              {/* Conteúdo */}
              <div className="flex flex-col gap-3 p-4">
                <h3 className="text-lg font-semibold leading-tight">
                  {event.title || "Evento sem título"}
                </h3>

                {event.description && (
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {event.description}
                  </p>
                )}

                <div className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
                  {event.date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(event.date).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  )}

                  {event.time && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{event.time}</span>
                    </div>
                  )}

                  {event.locationText && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span className="line-clamp-1">
                        {event.locationText}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
