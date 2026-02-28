import { Calendar, Clock, MapPin, Ban } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { eventToDate, isPastEvent } from "@/features/events/utils/eventDate";

export default function EventCard({
  event,
  compact = false, // usado no feed futuramente
  disabledPast = false,
}) {
  const navigate = useNavigate();

  if (!event) return null;

  const dt = eventToDate(event);
  const past = isPastEvent(event);
  const blocked = disabledPast && past;

  return (
    <div
      onClick={() => {
        if (blocked) return;
        navigate(`/eventos/${event.id}`);
      }}
      className={`group overflow-hidden rounded-2xl border bg-card shadow-sm transition ${
        blocked ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:shadow-md"
      } ${compact ? "flex gap-4 p-4" : ""}`}
      aria-disabled={blocked ? "true" : "false"}
      title={blocked ? "Evento encerrado" : "Abrir evento"}
    >
      {/* Imagem */}
      <div
        className={`relative bg-muted ${
          compact ? "h-20 w-20 rounded-xl" : "h-40 w-full"
        }`}
      >
        {event.imageUrl || event.image ? (
          <img
            src={event.imageUrl || event.image}
            alt={event.title || "Evento"}
            className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
              compact ? "rounded-xl" : ""
            }`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Calendar className="h-8 w-8 opacity-40" />
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div
        className={`flex flex-col justify-center gap-2 ${
          compact ? "flex-1" : "p-4"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <h3
            className={`font-semibold leading-tight ${
              compact ? "text-sm" : "text-lg"
            }`}
          >
            {event.title || "Evento sem título"}
          </h3>

          {blocked && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-zinc-200 px-2 py-0.5 text-[11px] font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
              <Ban className="h-3.5 w-3.5" /> Encerrado
            </span>
          )}
        </div>

        {!compact && event.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {event.description}
          </p>
        )}

        <div className="mt-1 flex flex-col gap-1 text-xs text-muted-foreground">
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
  );
}
