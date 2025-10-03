// src/features/feed/pages/Feed.jsx
import React, { useEffect, useState } from "react";
import FeedComposer from "@/components/FeedComposer";
import FeedPostActions from "@/components/FeedPostActions";
import Lightbox from "@/components/Lightbox";
import { listPosts, toggleLike, addComment } from "@/features/feed/services/feedStorage";

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [lb, setLb] = useState({ open: false, imgs: [], idx: 0 });

  function refresh() {
    setPosts(listPosts());
  }

  useEffect(() => {
    refresh();
    const onUpd = () => refresh();
    window.addEventListener("patanet:feed-updated", onUpd);
    return () => window.removeEventListener("patanet:feed-updated", onUpd);
  }, []);

  function onLike(post) {
    toggleLike(post.id);
    refresh();
  }

  function onComment(post) {
    const t = prompt("Escreva seu comentário:");
    if (t && t.trim()) {
      addComment(post.id, t.trim());
      refresh();
    }
  }

  function openLightbox(images, idx) {
    setLb({ open: true, imgs: images, idx });
  }

  return (
    <div className="space-y-6">
      <FeedComposer />

      {posts.length === 0 ? (
        <div className="card rounded-xl p-6 text-center opacity-80">
          Ainda não há publicações.
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const imgs = Array.isArray(post.images) ? post.images : [];

            return (
              <article key={post.id} className="card rounded-xl p-4">
                <header className="mb-2 text-sm opacity-80">
                  <span className="font-medium">{post.author?.name ?? "Usuário"}</span>{" "}
                  <span className="opacity-70">
                    · {new Date(post.createdAt).toLocaleString()}
                  </span>
                </header>

                {post.text && (
                  <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-slate-900 dark:text-white">
                    {post.text}
                  </p>
                )}

                {/* Imagens */}
                {imgs.length === 1 && (
                  <div className="mt-3">
                    <img
                      src={imgs[0].url}
                      alt=""
                      className="w-full max-h-[520px] rounded-lg object-cover"
                      loading="lazy"
                      onClick={() => openLightbox(imgs, 0)}
                      style={{ cursor: "zoom-in" }}
                    />
                  </div>
                )}

                {imgs.length > 1 && (
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {imgs.map((im, i) => (
                      <img
                        key={i}
                        src={im.url}
                        alt=""
                        className="h-40 w-full rounded-md object-cover"
                        loading="lazy"
                        onClick={() => openLightbox(imgs, i)}
                        style={{ cursor: "zoom-in" }}
                      />
                    ))}
                  </div>
                )}

                <FeedPostActions
                  liked={!!post.liked}
                  likes={post.likes || 0}
                  comments={post.commentsCount || (post.comments?.length ?? 0)}
                  onLike={() => onLike(post)}
                  onComment={() => onComment(post)}
                />
              </article>
            );
          })}
        </div>
      )}

      {lb.open && (
        <Lightbox
          images={lb.imgs}
          index={lb.idx}
          onClose={() => setLb((s) => ({ ...s, open: false }))}
        />
      )}
    </div>
  );
}
