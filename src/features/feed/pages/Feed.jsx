// src/features/feed/pages/Feed.jsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import {
  CornerUpRight,
  BarChart3,
  MoreHorizontal,
  X,
  Pencil,
  Check,
  Image as ImageIcon,
} from "lucide-react";
import FeedComposer from "@/components/FeedComposer";
import FeedPostActions from "@/components/FeedPostActions";
import Lightbox from "@/components/Lightbox";

import { getMyProfile } from "@/api/user.api.js";
import {
  fetchMyFeed,
  updatePost as apiUpdatePost,
  deletePost as apiDeletePost,
} from "@/api/post.api.js";
import { addLikePost, removeLikePost } from "@/api/like.api.js";
import { addCommentPost, updateCommentPost } from "@/api/comment.api.js";

/* -------------------- utils: compress image (same idea as register) -------------------- */
async function compressImage(
  file,
  { maxW = 1600, maxH = 1600, quality = 0.85 } = {}
) {
  if (!(file instanceof File)) return file;
  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;
  const ratio = Math.min(maxW / width, maxH / height, 1);
  const w = Math.round(width * ratio);
  const h = Math.round(height * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, w, h);

  const blob = await new Promise((res) =>
    canvas.toBlob(res, "image/jpeg", quality)
  );
  if (!blob) return file;
  return new File(
    [blob],
    file.name.replace(/\.(png|webp|gif|heic|heif)$/i, ".jpg"),
    { type: "image/jpeg" }
  );
}

async function fileToDataURL(file) {
  if (!file) return "";
  const buf = await file.arrayBuffer();
  const blob = new Blob([buf], { type: file.type || "image/jpeg" });
  return await new Promise((res) => {
    const fr = new FileReader();
    fr.onload = () => res(String(fr.result || ""));
    fr.readAsDataURL(blob);
  });
}

/* -------------------- Normalizadores -------------------- */
const normAuthor = (a) => ({
  id: a?.id ?? "",
  username: a?.username ?? "",
  name: a?.name ?? "",
  email: (a?.email || "").toLowerCase(),
  avatar: a?.image ?? "",
});

const normLikes = (likes) =>
  (Array.isArray(likes) ? likes : []).map((l) => ({
    id: l?.user?.id ?? "",
    username: l?.user?.username ?? "",
    name: l?.user?.name ?? "",
    email: (l?.user?.email || "").toLowerCase(),
    avatar: l?.user?.image ?? "",
  }));

const normComment = (c) => ({
  id: c?.id ?? String(Math.random()),
  text: c?.message ?? "",
  createdAt: Date.parse(c?.createdAt) || Date.now(),
  updatedAt: Date.parse(c?.updatedAt) || Date.parse(c?.createdAt) || Date.now(),
  author: normAuthor(c?.user ?? {}),
  replies: (Array.isArray(c?.replies) ? c.replies : []).map((r) => ({
    id: r?.id ?? String(Math.random()),
    text: r?.message ?? "",
    createdAt: Date.parse(r?.createdAt) || Date.now(),
    updatedAt:
      Date.parse(r?.updatedAt) || Date.parse(r?.createdAt) || Date.now(),
    author: normAuthor(r?.user ?? {}),
  })),
});

const mediaUrl = (m) => {
  if (!m) return "";
  if (typeof m === "string") return m;
  return m.url || m.path || m.file || "";
};

const normPost = (p) => ({
  id: p?.id ?? String(Math.random()),
  text: p?.subtitle ?? "",
  images: Array.isArray(p?.medias)
    ? p.medias.map(mediaUrl).filter(Boolean)
    : [],
  createdAt: Date.parse(p?.createdAt) || Date.now(),
  updatedAt: Date.parse(p?.updatedAt) || Date.parse(p?.createdAt) || Date.now(),
  author: normAuthor(p?.author ?? {}),
  likes: normLikes(p?.likes),
  comments: (Array.isArray(p?.comments) ? p.comments : []).map(normComment),
  taggedPets: Array.isArray(p?.pets)
    ? p.pets.map((x) => String(x?.id ?? x))
    : [],
});

const byDescDate = (a, b) => (b?.createdAt || 0) - (a?.createdAt || 0);

/* Avatar seguro */
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

/* -------------------- Modais -------------------- */
function EditPostModal({ open, post, onClose, onSave }) {
  const [text, setText] = useState(post?.text || "");
  const [gallery, setGallery] = useState(
    Array.isArray(post?.images) ? post.images.slice() : []
  );
  const [filesNew, setFilesNew] = useState([]);

  const fileInputRef = useRef(null);

  useEffect(() => {
    setText(post?.text || "");
    setGallery(Array.isArray(post?.images) ? post.images.slice() : []);
    setFilesNew([]);
  }, [post]);

  if (!open || !post) return null;

  function removeImage(idx) {
    setGallery((g) => g.filter((_, i) => i !== idx));
  }

  async function onPickFiles(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = ""; // reset
    if (!files.length) return;

    // compress + previews
    const compressed = [];
    const previews = [];
    for (const f of files) {
      const c = await compressImage(f);
      compressed.push(c);
      previews.push(await fileToDataURL(c));
    }

    setFilesNew((curr) => [...curr, ...compressed]);
    setGallery((g) => [...g, ...previews]);
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
                <div
                  key={`${post.id}-edit-img-${i}`}
                  className="relative overflow-hidden rounded-lg"
                >
                  <img
                    src={src || null}
                    alt=""
                    className="aspect-video w-full object-cover"
                  />
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

          {/* Botão padrão para selecionar mídias */}
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-[#f77904] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="h-4 w-4" />
              Selecionar mídias
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={onPickFiles}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
            onClick={() => onSave({ ...post, text, filesNew, gallery })}
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
            <div className="text-2xl font-bold">
              {(post.comments || []).length +
                (post.comments || []).reduce(
                  (acc, c) => acc + (c.replies?.length || 0),
                  0
                )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-semibold text-white dark:bg-zinc-700"
            onClick={onClose}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ⋯ Menu */
function DotsMenu({ onEdit, onStats, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        className="rounded-md p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        title="Mais ações"
        onClick={() => setOpen((v) => !v)}
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 w-40 overflow-hidden rounded-lg border border-zinc-200 bg-white text-sm shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          <button
            className="block w-full px-3 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800"
            onClick={() => (setOpen(false), onEdit?.())}
          >
            Editar
          </button>
          <button
            className="block w-full px-3 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800"
            onClick={() => (setOpen(false), onStats?.())}
          >
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

/* -------------------- Página Feed -------------------- */
export default function Feed() {
  const [me, setMe] = useState(null);

  // feed + paginação
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const sentinelRef = useRef(null);
  const loadingRef = useRef(false);

  const [lightbox, setLightbox] = useState({
    open: false,
    slides: [],
    index: 0,
  });
  const [edit, setEdit] = useState({ open: false, post: null });
  const [stats, setStats] = useState({ open: false, post: null });
  const [openComments, setOpenComments] = useState({});

  // pegar usuário logado
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const u = await getMyProfile();
        if (!cancel) setMe(u || null);
      } catch {
        // AppShell deve redirecionar se não logado
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  // carregar página do feed
  const loadPage = useCallback(
    async (reqPage) => {
      if (loadingRef.current) return;
      if (reqPage > pages) return;
      loadingRef.current = true;
      setLoading(true);
      try {
        const resp = await fetchMyFeed({ page: reqPage, perPage: 10 });
        const data = Array.isArray(resp?.data) ? resp.data : [];
        const pag = resp?.pagination || resp?.paginatio || {};
        const nextPages = Number(pag?.pages || pages || 1);

        const normalized = data.map(normPost);

        // dedupe
        setPosts((curr) => {
          const byId = new Map(curr.map((p) => [p.id, p]));
          normalized.forEach((p) => {
            if (!byId.has(p.id)) byId.set(p.id, p);
          });
          return Array.from(byId.values()).sort(byDescDate);
        });

        setPages(nextPages);
        setPage(reqPage);
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [pages]
  );

  // primeira página
  useEffect(() => {
    loadPage(1);
  }, [loadPage]);

  useEffect(() => {
    function onNew(e) {
      const created = e.detail; // pode vir undefined; trate se precisar
      if (created?.data || created?.id) {
        // normaliza e preprende
        const payload = created?.data || created;
        const p = normPost(payload);
        setPosts((curr) => [p, ...curr.filter((x) => x.id !== p.id)]);
      } else {
        // fallback: recarregar a primeira página
        setPosts([]);
        setPage(0);
        loadPage(1);
      }
    }
    window.addEventListener("patanet:feed-new-post", onNew);
    return () => window.removeEventListener("patanet:feed-new-post", onNew);
  }, [loadPage]);

  // infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        if (loadingRef.current) return;
        const next = page + 1;
        if (next <= pages) loadPage(next);
      });
    });
    io.observe(el);
    return () => io.disconnect();
  }, [page, pages, loadPage]);

  // like
  const handleToggleLike = useCallback(
    async (postId) => {
      setPosts((curr) =>
        curr.map((p) => {
          if (p.id !== postId) return p;
          const already = (p.likes || []).some((l) => l.id === me?.id);
          const likes = already
            ? p.likes.filter((l) => l.id !== me?.id)
            : [...p.likes, { id: me?.id }];
          return { ...p, likes };
        })
      );
      try {
        const target = posts.find((p) => p.id === postId);
        const already = (target?.likes || []).some((l) => l.id === me?.id);
        if (already) {
          await removeLikePost({ postId });
        } else {
          await addLikePost({ postId });
        }
      } catch {
        // rollback simples
        setPosts((curr) =>
          curr.map((p) => {
            if (p.id !== postId) return p;
            const already = (p.likes || []).some((l) => l.id === me?.id);
            const likes = already
              ? p.likes.filter((l) => l.id !== me?.id)
              : [...p.likes, { id: me?.id }];
            return { ...p, likes };
          })
        );
      }
    },
    [me?.id, posts]
  );

  // comentar novo
  const handleAddComment = useCallback(async (postId, text) => {
    const message = String(text || "").trim();
    if (!message) return;
    const created = await addCommentPost({ postId, message });
    const newC = normComment(created);
    setPosts((curr) =>
      curr.map((p) =>
        p.id === postId ? { ...p, comments: [newC, ...(p.comments || [])] } : p
      )
    );
  }, []);

  // responder
  const handleReplyComment = useCallback(
    async (postId, parentCommentId, text) => {
      const message = String(text || "").trim();
      if (!message) return;
      const created = await addCommentPost({
        postId,
        message,
        parentId: parentCommentId,
      });
      const reply = normComment(created);
      setPosts((curr) =>
        curr.map((p) => {
          if (p.id !== postId) return p;
          const comments = (p.comments || []).map((c) =>
            c.id === parentCommentId
              ? { ...c, replies: [...(c.replies || []), reply] }
              : c
          );
          return { ...p, comments };
        })
      );
    },
    []
  );

  // editar comentário
  const handleEditComment = useCallback(
    async (postId, commentId, newText, isReply = false) => {
      const message = String(newText || "").trim();
      if (!message) return;
      const updated = await updateCommentPost({ postId, commentId, message });
      const up = normComment(updated);

      setPosts((curr) =>
        curr.map((p) => {
          if (p.id !== postId) return p;
          const comments = (p.comments || []).map((c) => {
            if (!isReply && c.id === commentId)
              return { ...c, text: up.text, updatedAt: Date.now() };
            if (isReply && Array.isArray(c.replies)) {
              const replies = c.replies.map((r) =>
                r.id === commentId
                  ? { ...r, text: up.text, updatedAt: Date.now() }
                  : r
              );
              return { ...c, replies };
            }
            return c;
          });
          return { ...p, comments };
        })
      );
    },
    []
  );

  // editar postagem
  const handleOpenEdit = (post) => {
    if (!me || me.id !== post?.author?.id) return;
    setEdit({ open: true, post });
  };

  const handleSaveEdit = async ({ id, text, filesNew, gallery }) => {
    if (!id) return;
    await apiUpdatePost({
      postId: id,
      subtitle: String(text || ""),
      medias: filesNew || [],
    });

    // Refresh local imediato: atualiza texto + imagens do post com a galeria atual
    setPosts((curr) =>
      curr.map((p) =>
        p.id === id
          ? {
              ...p,
              text,
              images: Array.isArray(gallery) ? gallery.slice() : p.images,
              updatedAt: Date.now(),
            }
          : p
      )
    );

    setEdit({ open: false, post: null });
  };

  // remover postagem
  const handleDelete = async (post) => {
    if (!me || me.id !== post?.author?.id) return;
    const ok = window.confirm("Remover esta postagem?");
    if (!ok) return;
    await apiDeletePost({ postId: post.id });
    setPosts((curr) => curr.filter((p) => p.id !== post.id));
  };

  const handleOpenStats = (post) => setStats({ open: true, post });
  const toggleComments = (postId) =>
    setOpenComments((m) => ({ ...m, [postId]: !m[postId] }));

  /* -------------------- Render -------------------- */
  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Dica: se o FeedComposer emitir um evento custom "feed:new-post" com o novo post,
          podemos escutar aqui e prepend: */}
      {/* 
        useEffect(() => {
          const onNew = (e) => {
            const p = normPost(e.detail);
            setPosts((curr) => [p, ...curr.filter(x => x.id !== p.id)]);
          };
          document.addEventListener('feed:new-post', onNew);
          return () => document.removeEventListener('feed:new-post', onNew);
        }, []);
      */}

      <FeedComposer user={me} />

      <div className="mt-6 space-y-4">
        {posts.map((post) => {
          const likesArr = normLikes(post.likes);
          const likedByMe = !!likesArr.find((l) => l.id === me?.id);
          const isMine = me && me.id === post?.author?.id;
          const isEdited = (post.updatedAt || 0) > (post.createdAt || 0);
          const commentsCount = (post.comments && post.comments.length) || 0;
          const showComments = !!openComments[post.id];

          return (
            <article
              key={post.id}
              className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              {/* Cabeçalho */}
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Link
                    to={`/usuario/${post.author?.id}`}
                    className="shrink-0"
                    title={`Ver perfil de ${
                      post.author?.username || post.author?.name || "usuário"
                    }`}
                  >
                    <AvatarCircle
                      src={post.author?.avatar || ""}
                      alt={
                        post.author?.username || post.author?.name || "Autor"
                      }
                      size={40}
                    />
                  </Link>

                  <Link
                    to={`/perfil/${post.author?.id}`}
                    className="leading-tight hover:opacity-90"
                    title={`Ver perfil de ${
                      post.author?.username || post.author?.name || "usuário"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-semibold">
                        {post.author?.username || post.author?.name || "user"}
                      </div>
                      {isEdited && (
                        <span className="text-xs text-zinc-500">(editado)</span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {new Date(post.createdAt).toLocaleString()}
                    </div>
                  </Link>
                </div>

                {isMine && (
                  <DotsMenu
                    onEdit={() => handleOpenEdit(post)}
                    onStats={() => handleOpenStats(post)}
                    onDelete={() => handleDelete(post)}
                  />
                )}
              </div>

              {/* Texto */}
              {post.text && (
                <p className="mb-3 whitespace-pre-wrap text-sm">{post.text}</p>
              )}

              {/* Mídias */}
              {!!post.images?.length && (
                <div
                  className={`mb-2 grid gap-2 ${
                    post.images.length > 1 ? "grid-cols-2" : ""
                  }`}
                >
                  {post.images.map((src, i) => {
                    const title =
                      (post.text || "").trim().slice(0, 80) ||
                      `${
                        post.author?.username || post.author?.name || "Post"
                      } • ${new Date(post.createdAt).toLocaleString()}`;

                    return (
                      <div
                        key={`${post.id}-img-${i}`}
                        className="overflow-hidden rounded-xl"
                      >
                        <img
                          src={src || undefined}
                          alt=""
                          className="max-h-[520px] w-full cursor-zoom-in object-cover"
                          onClick={() => {
                            const slides = (post.images || []).map(
                              (u, idx) => ({
                                id: `${post.id}-img-${idx}`,
                                url: u,
                                title,
                              })
                            );
                            setLightbox({ open: true, slides, index: i });
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Ações */}
              <FeedPostActions
                liked={likedByMe}
                likes={likesArr.length}
                comments={commentsCount}
                onLike={() => handleToggleLike(post.id)}
                onComment={() => toggleComments(post.id)}
                onStats={() => handleOpenStats(post)}
              />

              {/* Comentários */}
              {showComments && (
                <CommentsBlock
                  post={post}
                  user={me}
                  onAddComment={(text) => handleAddComment(post.id, text)}
                  onReply={(parentId, text) =>
                    handleReplyComment(post.id, parentId, text)
                  }
                  onEditComment={(commentId, newText, isReply) =>
                    handleEditComment(post.id, commentId, newText, isReply)
                  }
                />
              )}
            </article>
          );
        })}

        {/* Sentinel */}
        <div ref={sentinelRef} className="h-8 w-full" />
        {loading && (
          <div className="py-6 text-center text-sm text-zinc-500">
            Carregando…
          </div>
        )}
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

      {/* Edição */}
      <EditPostModal
        open={edit.open}
        post={edit.post}
        onClose={() => setEdit({ open: false, post: null })}
        onSave={handleSaveEdit}
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

/* -------------------- Bloco de comentários -------------------- */
function CommentsBlock({ post, user, onAddComment, onReply, onEditComment }) {
  const [text, setText] = useState("");
  const [editing, setEditing] = useState(null); // { id, isReply }
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
    const t = String(editingText || "").trim();
    if (!t) return;
    onEditComment?.(editing.id, t, !!editing.isReply);
    setEditing(null);
    setEditingText("");
  };

  return (
    <div className="mt-3">
      {canComment && (
        <div className="mb-2 flex items-start gap-2">
          <AvatarCircle
            src={user?.image || ""}
            alt={user?.username || user?.name || user?.email}
            size={32}
          />
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
                  const t = String(text || "").trim();
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

      {/* Lista de comentários (1 nível de respostas) */}
      <ul className="space-y-3">
        {(post.comments || []).map((c) => {
          const isMine = user && user.id === c.author?.id;
          const isEditingThis = editing?.id === c.id && !editing?.isReply;

          return (
            <li
              key={c.id}
              className="rounded-lg bg-zinc-50 p-2 dark:bg-zinc-800/50"
            >
              <div className="flex items-start gap-2">
                <Link
                  to={`/perfil/${c.author?.id}`}
                  className="shrink-0"
                  title={`Ver perfil de ${
                    c.author?.username || c.author?.name || "usuário"
                  }`}
                >
                  <AvatarCircle
                    src={c.author?.avatar || ""}
                    alt={
                      c.author?.username || c.author?.name || c.author?.email
                    }
                    size={32}
                  />
                </Link>

                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2 text-xs text-zinc-500">
                    <Link
                      to={`/perfil/${c.author?.id}`}
                      className="font-medium text-zinc-700 hover:opacity-90 dark:text-zinc-300"
                      title={`Ver perfil de ${
                        c.author?.username || c.author?.name || "usuário"
                      }`}
                    >
                      {c.author?.username || c.author?.name || c.author?.email}
                    </Link>
                    <span>
                      · {new Date(c.createdAt).toLocaleString?.() || ""}
                    </span>
                    {(c.updatedAt || 0) > (c.createdAt || 0) && (
                      <span>(editado)</span>
                    )}
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
                        <button
                          className="inline-flex items-center gap-1 rounded-md bg-orange-500 px-2 py-1 text-xs font-semibold text-white"
                          onClick={saveEdit}
                        >
                          <Check className="h-3.5 w-3.5" /> Salvar
                        </button>
                        <button
                          className="inline-flex items-center gap-1 rounded-md border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700"
                          onClick={cancelEdit}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mt-1 flex items-center gap-2">
                    {user && (
                      <button
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700/60"
                        onClick={() => {
                          const replyText = prompt("Responder:");
                          const t =
                            typeof replyText === "string"
                              ? replyText.trim()
                              : "";
                          if (t) onReply(c.id, t);
                        }}
                      >
                        <CornerUpRight className="h-3.5 w-3.5" /> Responder
                      </button>
                    )}
                    {isMine && !isEditingThis && (
                      <button
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700/60"
                        onClick={() =>
                          setEditing({ id: c.id, isReply: false }) ||
                          setEditingText(c.text || "")
                        }
                      >
                        <Pencil className="h-3.5 w-3.5" /> Editar
                      </button>
                    )}
                  </div>

                  {/* replies */}
                  {!!c.replies?.length && (
                    <ul className="mt-2 space-y-2 pl-6">
                      {c.replies.map((r) => {
                        const isMineR = user && user.id === r.author?.id;
                        const isEditingR =
                          editing?.id === r.id && editing?.isReply;
                        return (
                          <li key={r.id}>
                            <div className="flex items-start gap-2">
                              <Link
                                to={`/perfil/${r.author?.id}`}
                                className="shrink-0"
                                title={`Ver perfil de ${
                                  r.author?.username ||
                                  r.author?.name ||
                                  "usuário"
                                }`}
                              >
                                <AvatarCircle
                                  src={r.author?.avatar || ""}
                                  alt={
                                    r.author?.username ||
                                    r.author?.name ||
                                    r.author?.email
                                  }
                                  size={28}
                                />
                              </Link>
                              <div className="flex-1 rounded-lg bg-zinc-50 p-2 text-sm dark:bg-zinc-800/50">
                                <div className="mb-1 text-xs text-zinc-500">
                                  <Link
                                    to={`/perfil/${r.author?.id}`}
                                    className="font-medium text-zinc-700 hover:opacity-90 dark:text-zinc-300"
                                    title={`Ver perfil de ${
                                      r.author?.username ||
                                      r.author?.name ||
                                      "usuário"
                                    }`}
                                  >
                                    {r.author?.username ||
                                      r.author?.name ||
                                      r.author?.email}
                                  </Link>{" "}
                                  ·{" "}
                                  {new Date(r.createdAt).toLocaleString?.() ||
                                    ""}{" "}
                                  {(r.updatedAt || 0) > (r.createdAt || 0) && (
                                    <span>(editado)</span>
                                  )}
                                </div>
                                {!isEditingR ? (
                                  <div className="whitespace-pre-wrap">
                                    {r.text}
                                  </div>
                                ) : (
                                  <div className="mt-1">
                                    <textarea
                                      className="w-full rounded-lg border border-zinc-300 bg-white/80 p-2 text-sm outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-900/60"
                                      rows={2}
                                      value={editingText}
                                      onChange={(e) =>
                                        setEditingText(e.target.value)
                                      }
                                    />
                                    <div className="mt-1 flex gap-2">
                                      <button
                                        className="inline-flex items-center gap-1 rounded-md bg-orange-500 px-2 py-1 text-xs font-semibold text-white"
                                        onClick={() => setEditing(null)}
                                      >
                                        <Check className="h-3.5 w-3.5" /> Salvar
                                      </button>
                                      <button
                                        className="inline-flex items-center gap-1 rounded-md border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700"
                                        onClick={() => setEditing(null)}
                                      >
                                        Cancelar
                                      </button>
                                    </div>
                                  </div>
                                )}
                                {isMineR && !isEditingR && (
                                  <div className="mt-1">
                                    <button
                                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700/60"
                                      onClick={() =>
                                        setEditing({
                                          id: r.id,
                                          isReply: true,
                                        }) || setEditingText(r.text || "")
                                      }
                                    >
                                      <Pencil className="h-3.5 w-3.5" /> Editar
                                    </button>
                                  </div>
                                )}
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
