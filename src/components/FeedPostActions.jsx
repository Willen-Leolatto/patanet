// src/components/FeedPostActions.jsx
import React from "react";
import {
  Heart,
  MessageSquare,
  BarChart3,
  Edit3,
  Trash2,
} from "lucide-react";

/**
 * FeedPostActions
 *
 * Props:
 * - liked?: boolean
 * - likes?: number
 * - comments?: number
 * - onLike?: () => void
 * - onComment?: () => void
 * - onStats?: () => void
 * - onEdit?: () => void
 * - onDelete?: () => void
 *
 * Observações:
 * - Mantém uma linha simples de ações.
 * - "Editar" e "Remover" são opcionais (serão mostrados apenas para o dono do post).
 * - "Estatísticas" também é opcional.
 */
export default function FeedPostActions({
  liked = false,
  likes = 0,
  comments = 0,
  onLike,
  onComment,
  onStats,
  onEdit,
  onDelete,
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {/* Curtir */}
      <button
        type="button"
        onClick={onLike}
        className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm transition ${
          liked
            ? "bg-orange-500/10 text-orange-600 dark:text-orange-400"
            : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        }`}
        aria-pressed={liked}
        title={liked ? "Remover curtida" : "Curtir"}
      >
        <Heart className="h-4 w-4" />
        <span>{likes}</span>
      </button>

      {/* Comentar (abre/fecha collapse no Feed) */}
      <button
        type="button"
        onClick={onComment}
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        title="Comentários"
      >
        <MessageSquare className="h-4 w-4" />
        <span>{comments}</span>
      </button>

      {/* Estatísticas (opcional) */}
      {onStats && (
        <button
          type="button"
          onClick={onStats}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          title="Estatísticas"
        >
          <BarChart3 className="h-4 w-4" />
          <span className="sr-only">Estatísticas</span>
        </button>
      )}

      {/* Editar (apenas para dono) */}
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          title="Editar postagem"
        >
          <Edit3 className="h-4 w-4" />
          <span className="sr-only">Editar</span>
        </button>
      )}

      {/* Remover (apenas para dono) */}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          title="Remover postagem"
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Remover</span>
        </button>
      )}
    </div>
  );
}
