import { Calendar, Clock, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function EventCard({
  event,
  compact = false, // usado no feed futuramente
}) {
  const navigate = useNavigate();

  if (!event) return null;

  return (
    <div
      onClick={() => navigate(`/eventos/${event.id}`)}
      className={`group cursor-pointer overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:shadow-md ${
        compact ? "flex gap-4 p-4" : ""
      }`}
    >
      {/* Imagem */}
      <div
        className={`relative bg-muted ${
          compact ? "h-20 w-20 rounded-xl" : "h-40 w-full"
        }`}
      >
        {event.image ? (
          <img
            src={event.image}
            alt={event.title}
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
        <h3
          className={`font-semibold leading-tight ${
            compact ? "text-sm" : "text-lg"
          }`}
        >
          {event.title || "Evento sem título"}
        </h3>

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
