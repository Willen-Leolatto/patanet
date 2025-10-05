// src/features/feed/services/feedStorage.js
const KEY = "patanet_feed_posts";
const SEED_FLAG = "patanet_feed_seeded_demo_v2";

/* ------------ util ------------- */
function now() {
  return Date.now();
}
function loadFeed() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
  catch { return []; }
}
function saveFeed(arr) {
  localStorage.setItem(KEY, JSON.stringify(arr));
  window.dispatchEvent(new Event("patanet:feed-updated"));
}
function countAllComments(post) {
  const direct = post.comments?.length || 0;
  const nested = post.comments?.reduce((sum, c) => sum + (c.replies?.length || 0), 0) || 0;
  return direct + nested;
}
const isMine = (p) => p?.mine === true || p?.author?.id === "me" || !p?.author?.id;

/* ------------ seed inicial se vazio ------------- */
function seedIfEmpty() {
  const cur = loadFeed();
  if (cur.length > 0) return;

  const base = [
    {
      id: crypto.randomUUID(),
      createdAt: now() - 1000 * 60 * 60 * 6,
      author: {
        id: "u-ana",
        name: "Ana",
        avatar:
          "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=120&h=120&fit=crop&crop=faces",
      },
      text: "Domingo de sol com o Thor no parque ☀️🐶",
      images: [
        {
          id: crypto.randomUUID(),
          url: "https://images.unsplash.com/photo-1507149833265-60c372daea22?w=1200&q=80&auto=format&fit=crop",
          title: "Correndo atrás da bolinha",
        },
      ],
      likes: 3,
      liked: false,
      comments: [
        {
          id: crypto.randomUUID(),
          text: "Que lindo! 🧡",
          createdAt: now() - 1000 * 60 * 60 * 5,
          author: { id: "u-joao", name: "João" },
          replies: [
            {
              id: crypto.randomUUID(),
              text: "Obrigada! 😄",
              createdAt: now() - 1000 * 60 * 60 * 4,
              author: { id: "u-ana", name: "Ana" },
            },
          ],
        },
      ],
    },
    {
      id: crypto.randomUUID(),
      createdAt: now() - 1000 * 60 * 60 * 26,
      author: {
        id: "u-joao",
        name: "João",
        avatar:
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop&crop=faces",
      },
      text: "Primeiro banho da Luna depois da tosa ✂️🐾",
      images: [
        {
          id: crypto.randomUUID(),
          url: "https://images.unsplash.com/photo-1521673461164-de300ebcfb29?w=1200&q=80&auto=format&fit=crop",
        },
        {
          id: crypto.randomUUID(),
          url: "https://images.unsplash.com/photo-1558944351-c0e0451d1d87?w=1200&q=80&auto=format&fit=crop",
        },
      ],
      likes: 8,
      liked: false,
      comments: [],
    },
  ];

  base.forEach((p) => (p.commentsCount = countAllComments(p)));
  saveFeed(base);
}

/* ------------ seed v2: garante “outros usuários” ------------- */
function seedOthersIfOnlyMine(force = false) {
  if (!force && localStorage.getItem(SEED_FLAG) === "1") return;

  const arr = loadFeed();
  if (arr.length === 0) return; // seedIfEmpty vai cobrir

  // agora consideramos posts sem author como "meus", para que o seeder ainda rode
  const hasOthers = arr.some((p) => !isMine(p));
  if (hasOthers) return;

  const more = [
    {
      id: crypto.randomUUID(),
      createdAt: now() - 1000 * 60 * 45,
      author: {
        id: "u-larissa",
        name: "Larissa",
        avatar:
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop&crop=faces",
      },
      text: "Passeio com o Max hoje — ele amou a praça nova! 💚",
      images: [
        {
          id: crypto.randomUUID(),
          url: "https://images.unsplash.com/photo-1484249170766-998fa6efe3c0?w=1200&q=80&auto=format&fit=crop",
          title: "Hora do passeio",
        },
      ],
      likes: 1,
      liked: false,
      comments: [],
    },
    {
      id: crypto.randomUUID(),
      createdAt: now() - 1000 * 60 * 120,
      author: {
        id: "u-matheus",
        name: "Matheus",
        avatar:
          "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=120&h=120&fit=crop&crop=faces",
      },
      text: "Consulta do Bolt foi ótima, vet disse que está tudo certo! 🩺🐕",
      images: [],
      likes: 0,
      liked: false,
      comments: [],
    },
  ];

  const next = [...arr, ...more];
  next.forEach((p) => (p.commentsCount = countAllComments(p)));
  saveFeed(next);
  localStorage.setItem(SEED_FLAG, "1");
}

/* ------------ API pública ------------- */
export function listPosts() {
  seedIfEmpty();
  seedOthersIfOnlyMine();
  return loadFeed().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}
export function addPost(partial) {
  const post = {
    id: crypto.randomUUID(),
    createdAt: now(),
    updatedAt: null,
    author: { id: "me", name: "Você" },
    text: "",
    images: [],
    likes: 0,
    liked: false,
    comments: [],
    commentsCount: 0,
    ...partial,
  };
  const arr = loadFeed();
  arr.unshift(post);
  saveFeed(arr);
  return post;
}
export function updatePost(id, patch = {}) {
  const arr = loadFeed();
  const i = arr.findIndex((p) => p.id === id);
  if (i < 0) return null;
  arr[i] = { ...arr[i], ...patch, updatedAt: Date.now() };
  if (patch.comments) {
    arr[i].commentsCount = countAllComments(arr[i]);
  }
  saveFeed(arr);
  return arr[i];
}
export function deletePost(id) {
  const arr = loadFeed();
  saveFeed(arr.filter((p) => p.id !== id));
  return true;
}
export function toggleLike(id) {
  const arr = loadFeed();
  const i = arr.findIndex((p) => p.id === id);
  if (i >= 0) {
    const liked = !arr[i].liked;
    arr[i].liked = liked;
    arr[i].likes = Math.max(0, (arr[i].likes || 0) + (liked ? 1 : -1));
    saveFeed(arr);
    return arr[i];
  }
  return null;
}
export function addComment(postId, text) {
  const t = (text || "").trim();
  if (!t) return null;
  const arr = loadFeed();
  const i = arr.findIndex((p) => p.id === postId);
  if (i < 0) return null;

  if (!arr[i].comments) arr[i].comments = [];
  arr[i].comments.push({
    id: crypto.randomUUID(),
    text: t,
    createdAt: now(),
    author: { id: "me", name: "Você" },
    replies: [],
  });
  arr[i].commentsCount = countAllComments(arr[i]);
  saveFeed(arr);
  return arr[i];
}
export function replyComment(postId, commentId, text) {
  const t = (text || "").trim();
  if (!t) return null;
  const arr = loadFeed();
  const i = arr.findIndex((p) => p.id === postId);
  if (i < 0) return null;

  const c = arr[i].comments?.find((c) => c.id === commentId);
  if (!c) return null;
  if (!c.replies) c.replies = [];
  c.replies.push({
    id: crypto.randomUUID(),
    text: t,
    createdAt: now(),
    author: { id: "me", name: "Você" },
  });
  arr[i].commentsCount = countAllComments(arr[i]);
  saveFeed(arr);
  return arr[i];
}

/* --------- util para forçar semeadura via console --------- */
export function forceSeedOthers() {
  localStorage.removeItem(SEED_FLAG);
  seedOthersIfOnlyMine(true);
  return listPosts();
}
// expõe no window pra facilitar em dev
try { window.patanetForceSeed = forceSeedOthers; } catch {}
