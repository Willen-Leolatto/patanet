import React, { useEffect, useState } from "react";

/** Lê/normaliza feed do localStorage */
function loadFeed() {
  try {
    const raw = localStorage.getItem("patanet_feed_posts");
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    // ordena por data desc se existir
    return [...arr].sort((a, b) => {
      const da = +new Date(a.createdAt || a.date || 0);
      const db = +new Date(b.createdAt || b.date || 0);
      return db - da;
    });
  } catch {
    return [];
  }
}

function timeAgo(dateLike) {
  if (!dateLike) return "";
  const diff = Date.now() - new Date(dateLike).getTime();
  if (diff < 0) return "agora";
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mês`;
  const y = Math.floor(mo / 12);
  return `${y}a`;
}

function CardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200/40 bg-white p-4 shadow-sm dark:border-slate-700/40 dark:bg-[#2a3240]">
      <div className="mb-4 flex items-center gap-3">
        <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="h-3 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      </div>
      <div className="h-3 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      <div className="mt-4 h-40 w-full animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
      <div className="mt-4 flex gap-3">
        <div className="h-8 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-8 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      </div>
    </div>
  );
}

export default function FeedList() {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    // primeira carga
    setPosts(loadFeed());
    setLoading(false);

    // atualiza quando alguém publicar/editar
    const onUpd = () => setPosts(loadFeed());
    window.addEventListener("patanet:feed-updated", onUpd);
    window.addEventListener("storage", onUpd);
    return () => {
      window.removeEventListener("patanet:feed-updated", onUpd);
      window.removeEventListener("storage", onUpd);
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (!posts.length) {
    return (
      <div className="rounded-xl border border-slate-200/40 bg-white p-3 text-sm text-slate-600 shadow-sm dark:border-slate-700/40 dark:bg-[#2a3240] dark:text-slate-200">
        Ainda não há publicações.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((p) => {
        const author = p.author?.name || p.authorName || "Você";
        const avatar = p.author?.avatar || p.avatar;
        const media = p.media?.[0] || p.image || null; // compatível com estruturas simples
        const likes = p.likes ?? 0;
        const comments = p.comments?.length ?? p.commentsCount ?? 0;

        return (
          <article
            key={p.id || p._id || Math.random()}
            className="rounded-xl border border-slate-200/40 bg-white p-4 shadow-sm dark:border-slate-700/40 dark:bg-[#2a3240]"
          >
            {/* Cabeçalho */}
            <header className="mb-3 flex items-center gap-3">
              <img
                src={avatar || "https://placehold.co/64x64?text=🐾"}
                alt={author}
                className="h-9 w-9 rounded-full object-cover"
              />
              <div>
                <div className="text-sm font-medium text-slate-900 dark:text-white">
                  {author}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-300/80">
                  {timeAgo(p.createdAt || p.date)}
                </div>
              </div>
            </header>

            {/* Texto */}
            {p.text && (
              <p className="whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-100">
                {p.text}
              </p>
            )}

            {/* Mídia (imagem simples) */}
            {media && (
              <div className="mt-3 overflow-hidden rounded-lg border border-slate-200/40 dark:border-slate-700/40">
                <img
                  src={media.url || media.src || media}
                  alt="mídia do post"
                  className="max-h-[480px] w-full object-cover"
                  loading="lazy"
                />
              </div>
            )}

            {/* Rodapé */}
            <footer className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-md bg-[#f77904] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
                title="Curtir"
              >
                Curtir ({likes})
              </button>
              <button
                type="button"
                className="rounded-md bg-[#f77904] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
                title="Comentar"
              >
                Comentar ({comments})
              </button>
            </footer>
          </article>
        );
      })}
    </div>
  );
}
