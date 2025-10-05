// src/features/feed/pages/Feed.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, MoreHorizontal, CornerUpRight } from "lucide-react";
import FeedComposer from "@/components/FeedComposer";
import FeedPostActions from "@/components/FeedPostActions";
import Lightbox from "@/components/Lightbox";
import { useAuth } from "@/store/auth.jsx";
import {
  listPosts,
  toggleLike,
  addComment,
  replyComment,
  updatePost,
  deletePost,
} from "@/features/feed/services/feedStorage";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { useToast } from "@/components/ui/ToastProvider";
import EditPostModal from "@/components/EditPostModal";

/* --------- Colapse suave (sem libs) ---------- */
function Collapse({ open, children, duration = 320 }) {
  const innerRef = useRef(null);
  const [maxH, setMaxH] = useState(0);

  useEffect(() => {
    if (!innerRef.current) return;
    const h = innerRef.current.scrollHeight;
    setMaxH(open ? h : 0);
  }, [open, children]);

  return (
    <div
      className="overflow-hidden"
      style={{
        transitionProperty: "max-height, opacity",
        transitionTimingFunction: "ease",
        transitionDuration: `${duration}ms`,
        maxHeight: open ? maxH : 0,
        opacity: open ? 1 : 0.7,
      }}
    >
      <div ref={innerRef}>{children}</div>
    </div>
  );
}

/* --------- normalizador de imagens ---------- */
function normalizeImages(input) {
  const arr = Array.isArray(input) ? input : [];
  return arr
    .map((m, i) => {
      if (typeof m === "string") return { id: i, url: m, title: "" };
      const url = m?.url || m?.src || m?.path || m?.href || "";
      if (!url) return null;
      return { id: m?.id ?? i, url, title: m?.title || m?.caption || "" };
    })
    .filter(Boolean);
}

export default function Feed() {
  const user = useAuth((s) => s.user);
  const confirm = useConfirm();
  const toast = useToast();

  const [posts, setPosts] = useState([]);
  const [expanded, setExpanded] = useState(() => new Set());
  const [lb, setLb] = useState({ open: false, slides: [], idx: 0 });
  const [edit, setEdit] = useState({ open: false, post: null });

  const refresh = () => setPosts(listPosts());

  useEffect(() => {
    refresh();
    const onUpd = () => refresh();
    window.addEventListener("patanet:feed-updated", onUpd);
    return () => window.removeEventListener("patanet:feed-updated", onUpd);
  }, []);

  /* ------------ ações de post ------------ */
  function onLike(post) {
    toggleLike(post.id);
    refresh();
  }

  async function onAddComment(post) {
    const text = await confirm.prompt({
      title: "Escreva um comentário",
      placeholder: "Seu comentário…",
      confirmText: "Publicar",
    });
    if (text && text.trim()) {
      addComment(post.id, text.trim());
      refresh();
      setExpanded((s) => new Set(s).add(post.id));
    }
  }

  async function onReply(postId, commentId) {
    const text = await confirm.prompt({
      title: "Responder comentário",
      placeholder: "Sua resposta…",
      confirmText: "Responder",
    });
    if (text && text.trim()) {
      replyComment(postId, commentId, text.trim());
      refresh();
      setExpanded((s) => new Set(s).add(postId));
    }
  }

  // Substitua toda a função onPostMenu por esta:
  const onPostMenu = async (post) => {
    if (!post) return;

    // segurança: só o dono pode editar/excluir
    // const mine = post?.author?.id === user?.id || post?.mine === true;
    // if (!mine) return;

    // abre menu de ações
    const picked = await confirm.select({
      title: "Ações da postagem",
      options: [
        { id: "edit", label: "Editar texto e mídias" },
        { id: "delete", label: "Excluir postagem", tone: "danger" },
      ],
    });

    if (!picked) return; // fechou/cancelou

    if (picked.id === "edit") {
      setEdit({ open: true, post });
      return;
    }

    if (picked.id === "delete") {
      const ok = await confirm({
        title: "Excluir postagem?",
        description: "Esta ação não pode ser desfeita.",
        confirmText: "Excluir",
        tone: "danger",
      });
      if (!ok) return;

      deletePost(post.id); // <- usa o service correto
      toast.success("Post excluído.");
      refresh();
    }
  };

  function handleSaveEdit(payload) {
    // payload: { text, images }
    const images = (payload.images || []).map((m, i) => ({
      id: m.id ?? i,
      url: m.url || m.src,
      title: m.title || "",
    }));
    updatePost(edit.post.id, { text: payload.text ?? "", images });
    setEdit({ open: false, post: null });
    toast.success("Post atualizado.");
    refresh();
  }

  function openLightboxForPost(post, startIndex = 0) {
    const imgs = normalizeImages(post.images || post.media);
    if (!imgs.length) return;
    const slides = imgs.map((m, i) => ({
      id: m.id ?? i,
      src: m.url,
      title: post.author?.name || "Publicação",
      description: post.text || m.title || "",
    }));
    setLb({ open: true, slides, idx: startIndex });
  }

  const toggleExpanded = (id) =>
    setExpanded((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const feedClass =
    "mx-auto w-full max-w-3xl lg:max-w-4xl space-y-6 transition-[max-width]";

  return (
    <div className={feedClass}>
      <FeedComposer />

      {posts.length === 0 ? (
        <div className="card rounded-xl p-6 text-center opacity-80">
          Ainda não há publicações.
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const imgs = normalizeImages(post.images || post.media);
            const mine =
              post.author?.id && user?.id
                ? post.author.id === user.id
                : post.mine === true;

            return (
              <article key={post.id} className="card rounded-xl p-4 sm:p-5">
                {/* header */}
                <header className="mb-3 flex items-center gap-3">
                  <img
                    src={
                      post.author?.avatar ||
                      "https://avatars.githubusercontent.com/u/1?v=4"
                    }
                    alt=""
                    className="h-9 w-9 rounded-full object-cover ring-2 ring-slate-300/30 dark:ring-slate-700/50"
                    loading="lazy"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="truncate font-medium">
                        {user && mine ? "Você" : post.author?.name || "Usuário"}
                      </span>
                      <span className="opacity-60">
                        ·{" "}
                        {new Date(post.createdAt).toLocaleString(undefined, {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {post.updatedAt ? " · editado" : ""}
                      </span>
                    </div>
                    {mine && (
                      <span className="mt-0.5 inline-block rounded bg-slate-500/10 px-2 py-0.5 text-[11px] leading-none text-slate-500 dark:text-slate-300">
                        sua publicação
                      </span>
                    )}
                  </div>
                  {(post?.author?.id === "me" || post?.mine === true) && (
                    <button
                      className="rounded p-1 hover:bg-black/5 dark:hover:bg-white/10"
                      title="Mais ações"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onPostMenu(post);
                      }}
                      onContextMenu={(e) => {
                        // evita abrir menu do navegador e qualquer interferência
                        e.preventDefault();
                      }}
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  )}
                </header>

                {/* texto */}
                {post.text && (
                  <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
                    {post.text}
                  </p>
                )}

                {/* imagens */}
                {imgs.length > 0 && (
                  <div className="mt-3">
                    {imgs.length === 1 ? (
                      <button
                        type="button"
                        className="block overflow-hidden rounded-lg"
                        onClick={() => openLightboxForPost(post, 0)}
                        title="Ampliar"
                        style={{ cursor: "zoom-in" }}
                      >
                        <img
                          src={imgs[0].url}
                          alt={imgs[0].title || ""}
                          className="w-full max-h-[70vh] object-contain"
                          loading="lazy"
                        />
                      </button>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {imgs.map((im, i) => (
                          <button
                            key={im.id ?? i}
                            type="button"
                            className="group relative overflow-hidden rounded-md"
                            onClick={() => openLightboxForPost(post, i)}
                            title="Ampliar"
                          >
                            <img
                              src={im.url}
                              alt={im.title || ""}
                              className="aspect-[4/3] w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                              loading="lazy"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ações */}
                <FeedPostActions
                  liked={!!post.liked}
                  likes={post.likes || 0}
                  comments={post.commentsCount || post.comments?.length || 0}
                  onLike={() => onLike(post)}
                  onComment={() => toggleExpanded(post.id)}
                />

                {/* comentários (com transição) */}
                <Collapse open={expanded.has(post.id)}>
                  <div className="mt-3 rounded-lg border border-slate-200/60 p-3 dark:border-slate-700/60">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <MessageCircle className="h-4 w-4 opacity-70" />
                        Comentários
                      </div>
                      <button
                        className="text-sm opacity-70 hover:opacity-100"
                        onClick={() => onAddComment(post)}
                      >
                        Adicionar comentário
                      </button>
                    </div>

                    {post.comments?.length ? (
                      <ul className="space-y-4">
                        {post.comments.map((c) => (
                          <li key={c.id} className="flex gap-3">
                            <img
                              src={
                                c.author?.avatar ||
                                "https://avatars.githubusercontent.com/u/2?v=4"
                              }
                              alt=""
                              className="mt-1 h-7 w-7 flex-none rounded-full object-cover"
                              loading="lazy"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-[13px]">
                                <span className="font-medium">
                                  {c.author?.name || "Usuário"}
                                </span>{" "}
                                <span className="opacity-60">
                                  ·{" "}
                                  {new Date(c.createdAt).toLocaleString(
                                    undefined,
                                    {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                </span>
                              </div>
                              <div className="mt-0.5 whitespace-pre-wrap text-[14px] leading-relaxed">
                                {c.text}
                              </div>

                              {/* replies */}
                              {c.replies?.length ? (
                                <ul className="mt-2 space-y-3 pl-4 border-l border-slate-200/60 dark:border-slate-700/60">
                                  {c.replies.map((r) => (
                                    <li key={r.id} className="flex gap-3">
                                      <img
                                        src={
                                          r.author?.avatar ||
                                          "https://avatars.githubusercontent.com/u/3?v=4"
                                        }
                                        alt=""
                                        className="mt-1 h-6 w-6 flex-none rounded-full object-cover"
                                        loading="lazy"
                                      />
                                      <div className="min-w-0 flex-1">
                                        <div className="text-[12px]">
                                          <span className="font-medium">
                                            {r.author?.name || "Usuário"}
                                          </span>{" "}
                                          <span className="opacity-60">
                                            ·{" "}
                                            {new Date(
                                              r.createdAt
                                            ).toLocaleString(undefined, {
                                              day: "2-digit",
                                              month: "2-digit",
                                              year: "numeric",
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            })}
                                          </span>
                                        </div>
                                        <div className="mt-0.5 whitespace-pre-wrap text-[13px] leading-relaxed">
                                          {r.text}
                                        </div>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              ) : null}

                              <button
                                className="mt-2 inline-flex items-center gap-1 text-xs opacity-70 hover:opacity-100"
                                onClick={() => onReply(post.id, c.id)}
                                title="Responder"
                              >
                                <CornerUpRight className="h-3.5 w-3.5" />
                                Responder
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm opacity-70">
                        Nenhum comentário ainda.
                      </p>
                    )}
                  </div>
                </Collapse>
              </article>
            );
          })}
        </div>
      )}

      {/* LIGHTBOX */}
      {lb.open && (
        <Lightbox
          open={lb.open}
          slides={lb.slides}
          index={lb.idx}
          onIndexChange={(i) => setLb((s) => ({ ...s, idx: i }))}
          onClose={() => setLb((s) => ({ ...s, open: false }))}
        />
      )}
      {edit.open && edit.post && (
        <EditPostModal
          open={edit.open}
          post={edit.post}
          onClose={() => setEdit({ open: false, post: null })}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}
