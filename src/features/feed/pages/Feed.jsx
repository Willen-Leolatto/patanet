// src/features/feed/pages/Feed.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CornerUpRight, BarChart3, MoreHorizontal, X, Pencil, Check } from "lucide-react";

import FeedComposer from "@/components/FeedComposer";
import FeedPostActions from "@/components/FeedPostActions";
import Lightbox from "@/components/Lightbox";
import { useConfirm } from "@/components/ui/ConfirmProvider";

// APIs
import { fetchMyFeed, deletePost as apiDeletePost } from "@/api/post.api.js";
import { addLikePost, removeLikePost } from "@/api/like.api.js";
import { addCommentPost } from "@/api/comment.api.js";
import { getMyProfile } from "@/api/user.api.js";
import { fetchAnimalsById } from "@/api/animal.api.js";

// =====================
// Cache de módulo (persiste entre remontagens do componente)
// =====================
const PER_PAGE = 10;
const FEED_CACHE = {
  items: /** @type any[] */ ([]),
  nextPage: 1,
  done: false,          // true => sem mais páginas
  inflight: false,      // true => há requisição em voo
};

// =====================
// Normalização / helpers
// =====================
const toArray = (v) => (Array.isArray(v) ? v : Object.values(v || {}));

const normAuthor = (a) => {
  const u = a || {};
  return {
    id: u.id ?? u.uid ?? u.email ?? u.username ?? "",
    username: u.username ?? "",
    name: u.name ?? "",
    email: (u.email || "").toLowerCase(),
    avatar: u.avatar ?? u.image ?? "",
  };
};

// likes do backend chegam como array de likes com { user: {...} }
const normLikes = (likes) =>
  toArray(likes).map((lk) => {
    const u = lk?.user || lk || {};
    return {
      id: u.id ?? u.uid ?? u.email ?? u.username ?? String(Math.random()),
      username: u.username ?? "",
      name: u.name ?? "",
      email: (u.email || "").toLowerCase(),
      avatar: u.image ?? u.avatar ?? "",
    };
  });

const normComment = (c) => ({
  id: c?.id ?? crypto.randomUUID?.() ?? String(Date.now() + Math.random()),
  text: typeof c?.text === "string" ? c.text : c?.message || "",
  createdAt: c?.createdAt ? new Date(c.createdAt).getTime() : Date.now(),
  updatedAt: c?.updatedAt ? new Date(c.updatedAt).getTime() : c?.createdAt ? new Date(c.createdAt).getTime() : Date.now(),
  author: normAuthor(c?.user || c?.author),
  replies: (c?.replies ? toArray(c.replies) : []).map((r) => ({
    id: r?.id ?? crypto.randomUUID?.() ?? String(Date.now() + Math.random()),
    text: typeof r?.text === "string" ? r.text : r?.message || "",
    createdAt: r?.createdAt ? new Date(r.createdAt).getTime() : Date.now(),
    updatedAt: r?.updatedAt ? new Date(r.updatedAt).getTime() : r?.createdAt ? new Date(r.createdAt).getTime() : Date.now(),
    author: normAuthor(r?.user || r?.author),
  })),
});

const normPost = (p) => ({
  id: p?.id ?? p?._id ?? String(p?.uuid || ""),
  text: typeof p?.text === "string" ? p.text : p?.subtitle || "",
  // medias do backend podem ser [], manteremos como array de urls se houver
  images: Array.isArray(p?.medias)
    ? p.medias.map((m) => (typeof m === "string" ? m : m?.url || "")).filter(Boolean)
    : Array.isArray(p?.images)
    ? p.images
    : p?.image
    ? [p.image]
    : [],
  createdAt: p?.createdAt ? new Date(p.createdAt).getTime() : Date.now(),
  updatedAt: p?.updatedAt ? new Date(p.updatedAt).getTime() : p?.createdAt ? new Date(p.createdAt).getTime() : Date.now(),
  author: normAuthor(p?.author ?? p?.user ?? {}),
  likes: normLikes(p?.likes ?? []),
  comments: (p?.comments ? toArray(p.comments) : []).map(normComment),
  taggedPets: Array.isArray(p?.pets) ? p.pets.map((pet) => String(pet?.id ?? pet)) : [],
});

const byDescDate = (a, b) => (b?.createdAt || 0) - (a?.createdAt || 0);

function AvatarCircle({ src, alt, size = 40, className = "" }) {
  if (!src) {
    return (
      <div
        className={`rounded-full bg-zinc-200 dark:bg-zinc-700 ${className}`}
        style={{ width: size, height: size }}
        aria-label={alt}
        title={alt}
      />
    );
  }
  return (
    <img
      src={src || null}
      alt={alt}
      className={`rounded-full object-cover ring-1 ring-zinc-200 dark:ring-zinc-800 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

// =====================
// Modais (layout intacto)
// =====================
function EditPostModal({ open, post, onClose, onSave }) {
  const [text, setText] = useState(post?.text || "");
  const [gallery, setGallery] = useState(Array.isArray(post?.images) ? post.images.slice() : []);
  useEffect(() => {
    setText(post?.text || "");
    setGallery(Array.isArray(post?.images) ? post.images.slice() : []);
  }, [post]);
  if (!open || !post) return null;

  function removeImage(idx) {
    setGallery((g) => g.filter((_, i) => i !== idx));
  }
  function onPickFiles(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    Promise.all(
      files.map(
        (f) =>
          new Promise((res, rej) => {
            const fr = new FileReader();
            fr.onload = () => res(fr.result);
            fr.onerror = rej;
            fr.readAsDataURL(f);
          })
      )
    )
      .then((arr) => setGallery((g) => [...g, ...arr]))
      .catch(() => {});
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50">
      <div className="w-full max-w-2xl rounded-xl bg-white p-4 shadow-xl dark:bg-zinc-900">
        <h3 className="mb-2 text-lg font-semibold">Editar postagem</h3>

        <textarea
          className="min-h-[120px] w-full rounded-lg border border-zinc-300 bg-white/80 p-3 text-sm outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-800/60"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Atualize seu texto…"
        />

        <div className="mt-3">
          <div className="mb-2 text-sm font-medium">Mídias</div>
          {gallery.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {gallery.map((src, i) => (
                <div key={i} className="relative overflow-hidden rounded-lg">
                  <img src={src || null} alt="" className="aspect-video w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute right-1 top-1 rounded-md bg-black/50 p-1 text-white"
                    title="Remover"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 dark:border-zinc-700">
              Sem mídias anexadas.
            </div>
          )}

          <div className="mt-2">
            <input type="file" accept="image/*" multiple onChange={onPickFiles} />
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Você pode adicionar uma ou mais imagens.</p>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button className="rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
            onClick={() => {
              console.info("Editar post: aguardando endpoint PATCH /posts/:id");
              onSave?.({ ...post, text, images: gallery });
            }}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

function StatsModal({ open, post, onClose }) {
  if (!open || !post) return null;
  const likes = normLikes(post.likes);

  const flatComments = (() => {
    const out = [];
    for (const c of post.comments || []) {
      out.push(c);
      for (const r of c.replies || []) out.push(r);
    }
    return out;
  })();

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50">
      <div className="w-full max-w-xl rounded-xl bg-white p-4 shadow-xl dark:bg-zinc-900">
        <div className="mb-3 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Estatísticas da postagem</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
            <div className="text-sm text-zinc-500">Curtidas</div>
            <div className="text-2xl font-bold">{likes.length}</div>
          </div>
          <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
            <div className="text-sm text-zinc-500">Comentários</div>
            <div className="text-2xl font-bold">{flatComments.length}</div>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-semibold text-white dark:bg-zinc-700" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

function DotsMenu({ onEdit, onStats, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" className="rounded-md p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800" title="Mais ações" onClick={() => setOpen((v) => !v)}>
        <MoreHorizontal className="h-5 w-5" />
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 w-40 overflow-hidden rounded-lg border border-zinc-200 bg-white text-sm shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          <button className="block w-full px-3 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => (setOpen(false), onEdit?.())}>
            Editar
          </button>
          <button className="block w-full px-3 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => (setOpen(false), onStats?.())}>
            Estatísticas
          </button>
          <button
            className="block w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            onClick={() => (setOpen(false), onDelete?.())}
          >
            Remover
          </button>
        </div>
      )}
    </div>
  );
}

function TaggedPetsBar({ petIds = [], petThumbs = {} }) {
  if (!Array.isArray(petIds) || petIds.length === 0) return null;
  return (
    <div className="mb-2 -mx-2 px-2">
      <div className="flex items-center gap-3 overflow-x-auto scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">
        {petIds.map((pid) => {
          const meta = petThumbs[pid] || {};
          const src = meta.avatarUrl || meta.coverUrl || undefined;
          const name = meta.name || "Pet";
          return (
            <Link
              key={pid}
              to={`/pets/${pid}`}
              title={name}
              className="group inline-flex items-center gap-2 rounded-full bg-zinc-50 px-2 py-1 text-xs ring-1 ring-zinc-200 hover:bg-zinc-100 dark:bg-zinc-800 dark:ring-zinc-700 dark:hover:bg-zinc-700"
            >
              <AvatarCircle src={src || undefined} alt={name} size={26} />
              <span className="pr-1">{name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// =====================
// Página Feed
// =====================
export default function Feed() {
  const confirm = useConfirm?.() || null;
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [loadingMe, setLoadingMe] = useState(true);

  const [posts, setPosts] = useState(FEED_CACHE.items.slice()); // inicia com cache se houver

  const [lightbox, setLightbox] = useState({ open: false, slides: [], index: 0 });
  const [edit, setEdit] = useState({ open: false, post: null });
  const [stats, setStats] = useState({ open: false, post: null });
  const [openComments, setOpenComments] = useState({});

  const sentinelRef = useRef(null);
  const [petThumbs, setPetThumbs] = useState({});

  // --- Perfil
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoadingMe(true);
        const u = await getMyProfile();
        if (!cancel) {
          setMe({
            id: u?.id ?? u?._id ?? u?.email ?? u?.username,
            username: u?.username,
            name: u?.name,
            email: u?.email,
            avatar: u?.image,
          });
        }
      } catch {
        if (!cancel) navigate("/login", { replace: true });
      } finally {
        if (!cancel) setLoadingMe(false);
      }
    })();
    return () => { cancel = true; };
  }, [navigate]);

  // --- Busca página (usa e atualiza FEED_CACHE; SEM depender de state)
  const fetchPage = useCallback(async (page) => {
    const resp = await fetchMyFeed({ page, perPage: PER_PAGE });
    // shape real do backend:
    // { data: [...], paginatio: { page, perPage, pages, total } }
    const list = Array.isArray(resp?.data) ? resp.data : Array.isArray(resp?.items) ? resp.items : Array.isArray(resp) ? resp : [];
    const meta = resp?.paginatio || resp?.pagination || resp?.meta || {};
    const pages = Number(meta.pages ?? 0) || null;
    const total = Number(meta.total ?? 0) || null;

    const normalized = list.map(normPost).sort(byDescDate);
    return { rows: normalized, pages, total };
  }, []);

  const loadNext = useCallback(async () => {
    if (FEED_CACHE.inflight || FEED_CACHE.done) return;
    FEED_CACHE.inflight = true;
    try {
      const pg = FEED_CACHE.nextPage || 1;
      const { rows, pages } = await fetchPage(pg);

      // atualiza cache
      if (pg === 1) {
        FEED_CACHE.items = rows;
      } else {
        FEED_CACHE.items = [...FEED_CACHE.items, ...rows];
      }
      setPosts(FEED_CACHE.items.slice());

      // decide "has more"
      let hasMore;
      if (pages != null) {
        hasMore = pg < pages;
      } else {
        hasMore = rows.length >= PER_PAGE;
      }
      FEED_CACHE.done = !hasMore;
      FEED_CACHE.nextPage = pg + 1;
    } catch (e) {
      // em erro, interrompe para não entrar em loop de retry
      FEED_CACHE.done = true;
      console.error("Erro ao carregar feed:", e);
    } finally {
      FEED_CACHE.inflight = false;
    }
  }, [fetchPage]);

  // --- Boot inicial: se não tiver cache, carrega p.1. Nunca re-chama p.1 em remount.
  useEffect(() => {
    if (FEED_CACHE.items.length === 0 && !FEED_CACHE.done && !FEED_CACHE.inflight) {
      FEED_CACHE.nextPage = 1;
      loadNext();
    } else {
      // sincroniza UI com cache atual (caso tenha remontado)
      setPosts(FEED_CACHE.items.slice());
    }
  }, [loadNext]);

  // --- Novo post publicado: limpa cache e recarrega p.1 (controle explícito)
  useEffect(() => {
    function onNewPost() {
      FEED_CACHE.items = [];
      FEED_CACHE.nextPage = 1;
      FEED_CACHE.done = false;
      FEED_CACHE.inflight = false;
      loadNext();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    window.addEventListener("patanet:feed-new-post", onNewPost);
    return () => window.removeEventListener("patanet:feed-new-post", onNewPost);
  }, [loadNext]);

  // --- Observer: criado uma única vez; só chama loadNext se não terminou
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        if (FEED_CACHE.done || FEED_CACHE.inflight) return;
        // regra: se p.1 veio com < PER_PAGE, FEED_CACHE.done já terá sido setado e não chama
        loadNext();
      });
    });

    io.observe(el);
    return () => io.disconnect();
  }, [loadNext]);

  const items = useMemo(() => posts, [posts]);

  // --- Lazy thumbs dos pets marcados
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ids = new Set();
      for (const p of items) (p.taggedPets || []).forEach((id) => ids.add(String(id)));

      const missing = Array.from(ids).filter((id) => !petThumbs[id]);
      if (missing.length === 0) return;

      const entries = await Promise.all(
        missing.map(async (id) => {
          try {
            const pet = await fetchAnimalsById({ animalId: id });
            return [
              id,
              {
                name: pet?.name || "Pet",
                avatarUrl: pet?.image?.url || pet?.image || "",
                coverUrl: pet?.imageCover?.url || pet?.imageCover || "",
              },
            ];
          } catch {
            return [id, { name: "Pet", avatarUrl: "", coverUrl: "" }];
          }
        })
      );

      if (!cancelled) {
        setPetThumbs((m) => ({ ...m, ...Object.fromEntries(entries) }));
      }
    })();
    return () => { cancelled = true; };
  }, [items, petThumbs]);

  // =====================
  // Ações
  // =====================
  const handleToggleLike = useCallback(
    async (postId) => {
      if (!me) return;
      setPosts((rows) =>
        rows.map((p) => {
          if (p.id !== postId) return p;
          const liked = !!p.likes.find((l) => l.id === me.id);
          const nextLikes = liked
            ? p.likes.filter((l) => l.id !== me.id)
            : [...p.likes, { id: me.id, username: me.username, name: me.name, email: me.email, avatar: me.avatar }];
          return { ...p, likes: nextLikes };
        })
      );
      try {
        const target = posts.find((p) => p.id === postId);
        const liked = !!target?.likes?.find((l) => l.id === me.id);
        if (liked) await removeLikePost({ postId });
        else await addLikePost({ postId });
      } catch {
        // rollback
        setPosts((rows) =>
          rows.map((p) => {
            if (p.id !== postId) return p;
            const liked = !!p.likes.find((l) => l.id === me?.id);
            const nextLikes = liked
              ? p.likes.filter((l) => l.id !== me?.id)
              : [...p.likes, { id: me?.id, username: me?.username, name: me?.name, email: me?.email, avatar: me?.avatar }];
            return { ...p, likes: nextLikes };
          })
        );
      }
    },
    [me, posts]
  );

  const handleAddComment = useCallback(
    async (postId, text) => {
      const t = typeof text === "string" ? text.trim() : "";
      if (!me || !t) return;

      const temp = {
        id: "temp-" + Math.random().toString(36).slice(2),
        text: t,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        author: { id: me.id, username: me.username, name: me.name, email: me.email, avatar: me.avatar },
        replies: [],
      };
      setPosts((rows) => rows.map((p) => (p.id === postId ? { ...p, comments: [temp, ...(p.comments || [])] } : p)));

      try {
        await addCommentPost({ postId, message: t });
      } catch {
        setPosts((rows) =>
          rows.map((p) => (p.id === postId ? { ...p, comments: (p.comments || []).filter((c) => c.id !== temp.id) } : p))
        );
      }
    },
    [me]
  );

  const handleReplyComment = useCallback(
    async (postId, parentCommentId, text) => {
      const t = typeof text === "string" ? text.trim() : "";
      if (!me || !t) return;

      const temp = {
        id: "temp-r-" + Math.random().toString(36).slice(2),
        text: t,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        author: { id: me.id, username: me.username, name: me.name, email: me.email, avatar: me.avatar },
      };

      setPosts((rows) =>
        rows.map((p) => {
          if (p.id !== postId) return p;
          const next = (p.comments || []).map((c) =>
            c.id === parentCommentId ? { ...c, replies: [temp, ...(c.replies || [])] } : c
          );
          return { ...p, comments: next };
        })
      );

      try {
        await addCommentPost({ postId, message: t, parentId: parentCommentId });
      } catch {
        setPosts((rows) =>
          rows.map((p) => {
            if (p.id !== postId) return p;
            const next = (p.comments || []).map((c) =>
              c.id === parentCommentId ? { ...c, replies: (c.replies || []).filter((r) => r.id !== temp.id) } : c
            );
            return { ...p, comments: next };
          })
        );
      }
    },
    [me]
  );

  const handleDelete = async (post) => {
    let ok = true;
    if (confirm) {
      ok = await confirm({
        title: "Remover postagem",
        description: "Essa ação não pode ser desfeita. Confirmar exclusão?",
        confirmText: "Remover",
        tone: "danger",
      });
    } else {
      ok = window.confirm("Remover esta postagem?");
    }
    if (!ok) return;

    const prev = posts;
    setPosts((rows) => rows.filter((p) => p.id !== post.id));
    try {
      await apiDeletePost({ postId: post.id });
    } catch {
      setPosts(prev);
    }
  };

  const toggleComments = (postId) => setOpenComments((m) => ({ ...m, [postId]: !m[postId] }));

  // =====================
  // Render
  // =====================
  if (loadingMe) {
    return <div className="mx-auto w-full max-w-3xl">Carregando…</div>;
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <FeedComposer user={me} />

      <div className="mt-6 space-y-4">
        {posts.map((post) => {
          const likesArr = normLikes(post.likes);
          const likedByMe = !!likesArr.find((l) => l.id === me?.id);
          const isMine = me && me.id === post?.author?.id;
          const isEdited = (post.updatedAt || 0) > (post.createdAt || 0);
          const commentsCount = (post.comments && post.comments.length) || 0;
          const showComments = !!openComments[post.id];
          const taggedIds = Array.isArray(post.taggedPets) ? post.taggedPets : [];

          return (
            <article key={post.id} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              {/* Cabeçalho */}
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Link to={`/perfil/${post.author?.id}`} className="shrink-0" title={`Ver perfil de ${post.author?.username || post.author?.name || "usuário"}`}>
                    <AvatarCircle src={post.author?.avatar || post.author?.image || ""} alt={post.author?.username || post.author?.name || "Autor"} size={40} />
                  </Link>

                  <Link to={`/perfil/${post.author?.id}`} className="leading-tight hover:opacity-90" title={`Ver perfil de ${post.author?.username || post.author?.name || "usuário"}`}>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-semibold">{post.author?.username || post.author?.name || "user"}</div>
                      {isEdited && <span className="text-xs text-zinc-500">(editado)</span>}
                    </div>
                    <div className="text-xs text-zinc-500">{new Date(post.createdAt).toLocaleString()}</div>
                  </Link>
                </div>

                {isMine && (
                  <DotsMenu
                    onEdit={() => setEdit({ open: true, post })}
                    onStats={() => setStats({ open: true, post })}
                    onDelete={() => handleDelete(post)}
                  />
                )}
              </div>

              {/* Texto */}
              {post.text && <p className="mb-3 whitespace-pre-wrap text-sm">{post.text}</p>}

              {/* Mídias */}
              {!!post.images?.length && (
                <div className={`mb-2 grid gap-2 ${post.images.length > 1 ? "grid-cols-2" : ""}`}>
                  {post.images.map((src, i) => {
                    const title =
                      (post.text || "").trim().slice(0, 80) ||
                      `${post.author?.username || post.author?.name || "Post"} • ${new Date(post.createdAt).toLocaleString()}`;
                    return (
                      <div key={i} className="overflow-hidden rounded-xl">
                        <img
                          src={src || undefined}
                          alt=""
                          className="max-h-[520px] w-full cursor-zoom-in object-cover"
                          onClick={() => {
                            const slides = (post.images || []).map((u, idx) => ({ id: String(idx), url: u, title }));
                            setLightbox({ open: true, slides, index: i });
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pets marcados */}
              <TaggedPetsBar
                petIds={taggedIds}
                petThumbs={petThumbs}
              />

              {/* Ações */}
              <FeedPostActions
                liked={likedByMe}
                likes={likesArr.length}
                comments={commentsCount}
                onLike={() => handleToggleLike(post.id)}
                onComment={() => toggleComments(post.id)}
                onStats={() => setStats({ open: true, post })}
              />

              {/* Comentários */}
              {showComments && (
                <CommentsBlock
                  post={post}
                  user={me}
                  onAddComment={(text) => handleAddComment(post.id, text)}
                  onReply={(parentId, text) => handleReplyComment(post.id, parentId, text)}
                />
              )}
            </article>
          );
        })}

        {/* Sentinel: observer só chama loadNext se FEED_CACHE.done = false */}
        <div ref={sentinelRef} className="h-8 w-full" />
      </div>

      {/* Lightbox */}
      {lightbox.open && (
        <Lightbox
          open={lightbox.open}
          slides={lightbox.slides}
          index={lightbox.index}
          onIndexChange={(i) => setLightbox((s) => ({ ...s, index: i }))}
          onClose={() => setLightbox({ open: false, slides: [], index: 0 })}
        />
      )}

      {/* Editar */}
      <EditPostModal
        open={edit.open}
        post={edit.post}
        onClose={() => setEdit({ open: false, post: null })}
        onSave={() => setEdit({ open: false, post: null })}
      />

      {/* Estatísticas */}
      <StatsModal
        open={stats.open}
        post={stats.post}
        onClose={() => setStats({ open: false, post: null })}
      />
    </div>
  );
}

// =====================
// Comentários (layout intacto)
// =====================
function CommentsBlock({ post, user, onAddComment, onReply }) {
  const [text, setText] = useState("");
  const [editing, setEditing] = useState(null);
  const [editingText, setEditingText] = useState("");

  const canComment = !!user;

  const startEdit = (comment, isReply = false) => {
    setEditing({ id: comment.id, isReply });
    setEditingText(comment.text || "");
  };
  const cancelEdit = () => {
    setEditing(null);
    setEditingText("");
  };
  const saveEdit = () => {
    setEditing(null);
    setEditingText("");
  };

  return (
    <div className="mt-3">
      {canComment && (
        <div className="mb-2 flex items-start gap-2">
          <AvatarCircle src={user?.avatar || user?.image || ""} alt={user?.username || user?.name || user?.email} size={32} />
          <div className="flex-1">
            <textarea
              className="w-full rounded-lg border border-zinc-300 bg-white/80 p-2 text-sm outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-800/60"
              placeholder="Escreva um comentário…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={2}
            />
            <div className="mt-1 flex justify-end">
              <button
                className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                disabled={!text.trim()}
                onClick={() => {
                  const t = typeof text === "string" ? text.trim() : "";
                  if (!t) return;
                  onAddComment(t);
                  setText("");
                }}
              >
                Comentar
              </button>
            </div>
          </div>
        </div>
      )}

      <ul className="space-y-3">
        {(post.comments || []).map((c) => {
          const isMine = user && user.id === c.author?.id;
          const isEditingThis = editing?.id === c.id && !editing?.isReply;

          return (
            <li key={c.id} className="rounded-lg bg-zinc-50 p-2 dark:bg-zinc-800/50">
              <div className="flex items-start gap-2">
                <Link to={`/perfil/${c.author?.id}`} className="shrink-0" title={`Ver perfil de ${c.author?.username || c.author?.name || "usuário"}`}>
                  <AvatarCircle src={c.author?.avatar || ""} alt={c.author?.username || c.author?.name || c.author?.email} size={32} />
                </Link>

                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2 text-xs text-zinc-500">
                    <Link
                      to={`/perfil/${c.author?.id}`}
                      className="font-medium text-zinc-700 hover:opacity-90 dark:text-zinc-300"
                      title={`Ver perfil de ${c.author?.username || c.author?.name || "usuário"}`}
                    >
                      {c.author?.username || c.author?.name || c.author?.email}
                    </Link>
                    <span>· {new Date(c.createdAt).toLocaleString?.() || ""}</span>
                    {(c.updatedAt || 0) > (c.createdAt || 0) && <span>(editado)</span>}
                  </div>

                  {!isEditingThis ? (
                    <div className="whitespace-pre-wrap text-sm">{c.text}</div>
                  ) : (
                    <div className="mt-1">
                      <textarea
                        className="w-full rounded-lg border border-zinc-300 bg-white/80 p-2 text-sm outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-900/60"
                        rows={2}
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                      />
                      <div className="mt-1 flex gap-2">
                        <button className="inline-flex items-center gap-1 rounded-md bg-orange-500 px-2 py-1 text-xs font-semibold text-white" onClick={saveEdit}>
                          <Check className="h-3.5 w-3.5" /> Salvar
                        </button>
                        <button className="inline-flex items-center gap-1 rounded-md border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700" onClick={cancelEdit}>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mt-1 flex items-center gap-2">
                    {canComment && (
                      <button
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700/60"
                        onClick={() => {
                          const replyText = prompt("Responder:");
                          const t = typeof replyText === "string" ? replyText.trim() : "";
                          if (t) onReply(c.id, t);
                        }}
                      >
                        <CornerUpRight className="h-3.5 w-3.5" /> Responder
                      </button>
                    )}
                    {isMine && !isEditingThis && (
                      <button
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700/60"
                        onClick={() => setEditing({ id: c.id, isReply: false })}
                      >
                        <Pencil className="h-3.5 w-3.5" /> Editar
                      </button>
                    )}
                  </div>

                  {!!c.replies?.length && (
                    <ul className="mt-2 space-y-2 pl-6">
                      {c.replies.map((r) => {
                        const isMineR = user && user.id === r.author?.id;
                        const isEditingR = editing?.id === r.id && editing?.isReply;
                        return (
                          <li key={r.id}>
                            <div className="flex items-start gap-2">
                              <Link to={`/perfil/${r.author?.id}`} className="shrink-0" title={`Ver perfil de ${r.author?.username || r.author?.name || "usuário"}`}>
                                <AvatarCircle src={r.author?.avatar || ""} alt={r.author?.username || r.author?.name || r.author?.email} size={28} />
                              </Link>
                              <div className="flex-1 rounded-lg bg-zinc-50 p-2 text-sm dark:bg-zinc-800/50">
                                <div className="mb-1 text-xs text-zinc-500">
                                  <Link
                                    to={`/perfil/${r.author?.id}`}
                                    className="font-medium text-zinc-700 hover:opacity-90 dark:text-zinc-300"
                                    title={`Ver perfil de ${r.author?.username || r.author?.name || "usuário"}`}
                                  >
                                    {r.author?.username || r.author?.name || r.author?.email}
                                  </Link>{" "}
                                  · {new Date(r.createdAt).toLocaleString?.() || ""} {(r.updatedAt || 0) > (r.createdAt || 0) && <span>(editado)</span>}
                                </div>
                                <div className="whitespace-pre-wrap">{r.text}</div>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
