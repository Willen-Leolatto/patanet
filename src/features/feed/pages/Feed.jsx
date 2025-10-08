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
} from "lucide-react";
import FeedComposer from "@/components/FeedComposer";
import FeedPostActions from "@/components/FeedPostActions";
import Lightbox from "@/components/Lightbox";
import { useAuth } from "@/store/auth";
import { useConfirm } from "@/components/ui/ConfirmProvider";

import {
  listPosts,
  toggleLike,
  addComment,
  replyComment,
  updatePost,
  deletePost,
} from "@/features/feed/services/feedStorage";

/* -------------------- Normalizadores / utils -------------------- */
const toArray = (v) => (Array.isArray(v) ? v : Object.values(v || {}));
const normLikes = (likes) =>
  toArray(likes).map((u) => ({
    id: u?.id ?? u?.uid ?? u?.email ?? u?.username ?? String(u),
    username: u?.username ?? "",
    name: u?.name ?? "",
    email: (u?.email || "").toLowerCase(),
    avatar: u?.avatar ?? u?.image ?? "",
  }));

const normAuthor = (a) => ({
  id: a?.id ?? a?.uid ?? a?.email ?? a?.username ?? "",
  username: a?.username ?? "",
  name: a?.name ?? "",
  email: (a?.email || "").toLowerCase(),
  avatar: a?.avatar ?? a?.image ?? "",
});

const normComment = (c) => ({
  id: c?.id ?? crypto.randomUUID?.() ?? String(Date.now() + Math.random()),
  text: typeof c?.text === "string" ? c.text : "",
  createdAt: typeof c?.createdAt === "number" ? c.createdAt : Date.now(),
  updatedAt: typeof c?.updatedAt === "number" ? c.updatedAt : c?.createdAt,
  author: normAuthor(c?.author ?? {}),
  // apenas 1 nível de resposta (filhas)
  replies: (c?.replies ? toArray(c.replies) : []).map((r) => ({
    id: r?.id ?? crypto.randomUUID?.() ?? String(Date.now() + Math.random()),
    text: typeof r?.text === "string" ? r.text : "",
    createdAt: typeof r?.createdAt === "number" ? r.createdAt : Date.now(),
    updatedAt: typeof r?.updatedAt === "number" ? r.updatedAt : r?.createdAt,
    author: normAuthor(r?.author ?? {}),
  })),
});

const normPost = (p) => ({
  id: p?.id ?? crypto.randomUUID?.() ?? String(Date.now() + Math.random()),
  text: typeof p?.text === "string" ? p.text : "",
  // suporta image (string) OU images (array strings)
  image: typeof p?.image === "string" ? p.image : "",
  images: Array.isArray(p?.images)
    ? p.images
    : typeof p?.image === "string" && p.image
    ? [p.image]
    : [],
  createdAt: typeof p?.createdAt === "number" ? p.createdAt : Date.now(),
  updatedAt: typeof p?.updatedAt === "number" ? p.updatedAt : p?.createdAt,
  author: normAuthor(p?.author ?? {}),
  likes: normLikes(p?.likes),
  comments: (p?.comments ? toArray(p.comments) : []).map(normComment),
});

const byDescDate = (a, b) => (b?.createdAt || 0) - (a?.createdAt || 0);

/* avatar placeholder para evitar <img src=""> */
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
  const [gallery, setGallery] = useState(post?.images || []);

  useEffect(() => {
    setText(post?.text || "");
    setGallery(post?.images || []);
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

          <div className="mt-2">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={onPickFiles}
            />
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Você pode adicionar uma ou mais imagens.
            </p>
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
            onClick={() => onSave({ ...post, text, images: gallery })}
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

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div className="mb-1 text-sm font-medium">Quem curtiu</div>
            <ul className="space-y-1">
              {likes.length === 0 && (
                <li className="text-sm text-zinc-500">Ninguém curtiu ainda.</li>
              )}
              {likes.map((u) => (
                <li key={u.id} className="flex items-center gap-2 text-sm">
                  <AvatarCircle
                    src={u.avatar || ""}
                    alt={u.username || u.name || u.email}
                    size={24}
                    className="ring-0"
                  />
                  <span>{u.username || u.name || u.email}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="mb-1 text-sm font-medium">Quem comentou</div>
            <ul className="space-y-1">
              {flatComments.length === 0 && (
                <li className="text-sm text-zinc-500">Sem comentários.</li>
              )}
              {flatComments.map((c) => (
                <li key={c.id} className="flex items-center gap-2 text-sm">
                  <AvatarCircle
                    src={c.author?.avatar || ""}
                    alt={
                      c.author?.username || c.author?.name || c.author?.email
                    }
                    size={24}
                    className="ring-0"
                  />
                  <span>
                    {c.author?.username || c.author?.name || c.author?.email}
                    <span className="text-zinc-500">: {c.text}</span>
                  </span>
                </li>
              ))}
            </ul>
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

/* -------------------- Dropdown simples (⋯) -------------------- */
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
  const confirm = useConfirm?.() || null;
  const user = useAuth((s) => s.user);

  const [all, setAll] = useState([]);
  const [visible, setVisible] = useState(10);
  const [lightbox, setLightbox] = useState({
    open: false,
    slides: [],
    index: 0,
  });

  const [edit, setEdit] = useState({ open: false, post: null });
  const [stats, setStats] = useState({ open: false, post: null });

  const [openComments, setOpenComments] = useState({}); // { [postId]: boolean }

  const sentinelRef = useRef(null);

  const refresh = useCallback(() => {
    const raw = listPosts() || [];
    const normalized = raw.map(normPost).sort(byDescDate);
    setAll(normalized);
  }, []);

  useEffect(() => {
    refresh();
    const onUpdate = () => refresh();
    window.addEventListener("patanet:feed-updated", onUpdate);
    return () => window.removeEventListener("patanet:feed-updated", onUpdate);
  }, [refresh]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) setVisible((v) => Math.min(v + 10, all.length));
      });
    });
    io.observe(el);
    return () => io.disconnect();
  }, [all.length]);

  const items = useMemo(() => all.slice(0, visible), [all, visible]);

  const me = user
    ? {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        avatar: user.image,
      }
    : null;

  const handleToggleLike = useCallback(
    (postId) => {
      if (!me) return;
      toggleLike(postId, me);
      refresh();
    },
    [me, refresh]
  );

  const handleAddComment = useCallback(
    (postId, text) => {
      const t = typeof text === "string" ? text.trim() : "";
      if (!me || !t) return;
      addComment(postId, t, me);
      refresh();
    },
    [me, refresh]
  );

  const handleReplyComment = useCallback(
    (postId, parentCommentId, text) => {
      const t = typeof text === "string" ? text.trim() : "";
      if (!me || !t) return;
      replyComment(postId, parentCommentId, t, me);
      refresh();
    },
    [me, refresh]
  );

  const handleOpenEdit = (post) => {
    if (!me || me.id !== post?.author?.id) return;
    setEdit({ open: true, post });
  };

  const handleSaveEdit = (patched) => {
    if (!patched?.id) return;
    // envia texto e (futuramente) imagens; updatedAt para exibir "Editado"
    updatePost(patched.id, {
      text: patched.text,
      images: patched.images,
      updatedAt: Date.now(),
    });
    setEdit({ open: false, post: null });
    refresh();
  };

  const handleDelete = async (post) => {
    if (!me || me.id !== post?.author?.id) return;
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
    if (ok) {
      deletePost(post.id);
      refresh();
    }
  };

  const handleOpenStats = (post) => setStats({ open: true, post });

  const toggleComments = (postId) =>
    setOpenComments((m) => ({
      ...m,
      [postId]: !m[postId],
    }));

  /* -------------------- Render -------------------- */
  return (
    <div className="mx-auto w-full max-w-3xl">
      <FeedComposer user={user} />

      <div className="mt-6 space-y-4">
        {items.map((post) => {
          const likesArr = normLikes(post.likes);
          const likedByMe = !!likesArr.find((l) => l.id === user?.id);
          const isMine = user && user.id === post?.author?.id;
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
                  {/* Avatar clicável */}
                  <Link
                    to={`/perfil/${post.author?.id}`}
                    className="shrink-0"
                    title={`Ver perfil de ${post.author?.username || post.author?.name || "usuário"}`}
                  >
                    <AvatarCircle
                      src={post.author?.avatar || ""}
                      alt={post.author?.username || post.author?.name || "Autor"}
                      size={40}
                    />
                  </Link>

                  {/* Nome/data clicáveis (leva ao perfil) */}
                  <Link
                    to={`/perfil/${post.author?.id}`}
                    className="leading-tight hover:opacity-90"
                    title={`Ver perfil de ${post.author?.username || post.author?.name || "usuário"}`}
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

                {/* ⋯ menu (apenas para o dono do post) */}
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

              {/* Mídias: grid quando houver mais de 1 imagem */}
              {!!post.images?.length && (
                <div
                  className={`mb-3 grid gap-2 ${
                    post.images.length > 1 ? "grid-cols-2" : ""
                  }`}
                >
                  {post.images.map((src, i) => (
                    <div key={i} className="overflow-hidden rounded-xl">
                      <img
                        src={src || null}
                        alt=""
                        className="max-h-[520px] w-full cursor-zoom-in object-cover"
                        onClick={() => {
                          const title =
                            (post.text || "").trim().slice(0, 80) ||
                            `${
                              post.author?.username ||
                              post.author?.name ||
                              "Post"
                            } • ${new Date(post.createdAt).toLocaleString()}`;
                          const slides = (post.images || []).map((url) => ({
                            id: url,
                            url,
                            title,
                          }));
                          setLightbox({ open: true, slides, index: i });
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Ações (curtir/comentar toggle) */}
              <FeedPostActions
                liked={likedByMe}
                likes={likesArr.length}
                comments={commentsCount}
                onLike={() => handleToggleLike(post.id)}
                onComment={() => toggleComments(post.id)}
                onStats={() => handleOpenStats(post)}
                // edição/remoção ficam no menu ⋯
              />

              {/* Collapse de comentários */}
              {showComments && (
                <CommentsBlock
                  post={post}
                  user={user}
                  onAddComment={(text) => handleAddComment(post.id, text)}
                  onReply={(parentId, text) =>
                    handleReplyComment(post.id, parentId, text)
                  }
                />
              )}
            </article>
          );
        })}

        {/* Sentinel para carregar mais */}
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
function CommentsBlock({ post, user, onAddComment, onReply }) {
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
    // Por enquanto, o feedStorage ainda não expõe updateComment/updateReply.
    // Vamos só fechar o editor (persistência virá quando ajustarmos o storage).
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

      {/* Lista de comentários (somente 1 nível de replies) */}
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
                {/* Avatar do comentário clicável */}
                <Link
                  to={`/perfil/${c.author?.id}`}
                  className="shrink-0"
                  title={`Ver perfil de ${c.author?.username || c.author?.name || "usuário"}`}
                >
                  <AvatarCircle
                    src={c.author?.avatar || ""}
                    alt={c.author?.username || c.author?.name || c.author?.email}
                    size={32}
                  />
                </Link>

                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2 text-xs text-zinc-500">
                    {/* Nome clicável */}
                    <Link
                      to={`/perfil/${c.author?.id}`}
                      className="font-medium text-zinc-700 hover:opacity-90 dark:text-zinc-300"
                      title={`Ver perfil de ${c.author?.username || c.author?.name || "usuário"}`}
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
                        onClick={() => startEdit(c, false)}
                      >
                        <Pencil className="h-3.5 w-3.5" /> Editar
                      </button>
                    )}
                  </div>

                  {/* replies (filhas) */}
                  {!!c.replies?.length && (
                    <ul className="mt-2 space-y-2 pl-6">
                      {c.replies.map((r) => {
                        const isMineR = user && user.id === r.author?.id;
                        const isEditingR =
                          editing?.id === r.id && editing?.isReply;
                        return (
                          <li key={r.id}>
                            <div className="flex items-start gap-2">
                              {/* Avatar de resposta clicável */}
                              <Link
                                to={`/perfil/${r.author?.id}`}
                                className="shrink-0"
                                title={`Ver perfil de ${r.author?.username || r.author?.name || "usuário"}`}
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
                                  {/* Nome de resposta clicável */}
                                  <Link
                                    to={`/perfil/${r.author?.id}`}
                                    className="font-medium text-zinc-700 hover:opacity-90 dark:text-zinc-300"
                                    title={`Ver perfil de ${r.author?.username || r.author?.name || "usuário"}`}
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
                                {isMineR && !isEditingR && (
                                  <div className="mt-1">
                                    <button
                                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700/60"
                                      onClick={() => startEdit(r, true)}
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
