// src/features/feed/services/feedStorage.js

/* =========================================================
 *  feedStorage v3 — posts com múltiplas mídias, stats e comentários
 * ========================================================= */

const STORAGE_KEY = "patanet_feed_v3";

/* ------------------ Utils base ------------------ */
function safeParse(json, fallback) {
  try {
    const v = JSON.parse(json);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

function loadAllRaw() {
  return safeParse(localStorage.getItem(STORAGE_KEY), []);
}

function saveAllRaw(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list || []));
  // Notifica a UI (Feed usa este evento para atualizar)
  window.dispatchEvent(new Event("patanet:feed-updated"));
}

function genId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return String(Date.now() + Math.random());
}

const toArray = (v) => (Array.isArray(v) ? v : Object.values(v || {}));

/* ------------------ Normalização ------------------ */
function normAuthor(a) {
  if (!a || typeof a !== "object") a = {};
  return {
    id: a.id ?? a.uid ?? a.email ?? a.username ?? "",
    username: a.username ?? "",
    name: a.name ?? "",
    email: (a.email || "").toLowerCase(),
    avatar: a.avatar ?? a.image ?? "",
  };
}

function normLikeUser(u) {
  if (!u || typeof u !== "object") u = {};
  return {
    id: u.id ?? u.uid ?? u.email ?? u.username ?? String(u),
    username: u.username ?? "",
    name: u.name ?? "",
    email: (u.email || "").toLowerCase(),
    avatar: u.avatar ?? u.image ?? "",
  };
}

function normComment(c) {
  if (!c || typeof c !== "object") c = {};
  // Apenas 1 nível de replies (filhas)
  return {
    id: c.id ?? genId(),
    text: typeof c.text === "string" ? c.text : "",
    createdAt: typeof c.createdAt === "number" ? c.createdAt : Date.now(),
    updatedAt: typeof c.updatedAt === "number" ? c.updatedAt : c.createdAt ?? Date.now(),
    author: normAuthor(c.author),
    replies: (c.replies ? toArray(c.replies) : []).map(normReply),
  };
}
function normReply(r) {
  if (!r || typeof r !== "object") r = {};
  return {
    id: r.id ?? genId(),
    text: typeof r.text === "string" ? r.text : "",
    createdAt: typeof r.createdAt === "number" ? r.createdAt : Date.now(),
    updatedAt: typeof r.updatedAt === "number" ? r.updatedAt : r.createdAt ?? Date.now(),
    author: normAuthor(r.author),
  };
}

function normPost(p) {
  if (!p || typeof p !== "object") p = {};
  const hasImagesArray = Array.isArray(p.images);
  const hasImageString = typeof p.image === "string" && p.image.length > 0;

  return {
    id: p.id ?? genId(),
    text: typeof p.text === "string" ? p.text : "",
    // suporte a legado: image (string) vira images [string]
    images: hasImagesArray ? p.images.slice(0) : hasImageString ? [p.image] : [],
    createdAt: typeof p.createdAt === "number" ? p.createdAt : Date.now(),
    updatedAt: typeof p.updatedAt === "number" ? p.updatedAt : p.createdAt ?? Date.now(),
    author: normAuthor(p.author),
    likes: toArray(p.likes).map(normLikeUser),
    comments: (p.comments ? toArray(p.comments) : []).map(normComment),
  };
}

/* ------------------ Carga/Migração leve ------------------ */
function loadAll() {
  // A partir do v3, garantimos shape único ao listar/salvar
  const arr = loadAllRaw();
  return (Array.isArray(arr) ? arr : []).map(normPost);
}

function saveAll(posts) {
  // Salva já normalizado
  const normalized = (Array.isArray(posts) ? posts : []).map(normPost);
  saveAllRaw(normalized);
}

/* ------------------ API Pública ------------------ */

/**
 * Lista todos os posts (normalizados e ordenados desc por createdAt).
 */
export function listPosts() {
  const list = loadAll();
  return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

/**
 * Cria um novo post.
 * @param {object} author { id, username, name, email, avatar }
 * @param {string} text
 * @param {string|string[]} images  (opcional) — aceita DataURL única ou array
 */
export function addPost(author, text, images = []) {
  const t = typeof text === "string" ? text.trim() : "";
  if (!author || !author.id || !t) return null;

  let imgs = images;
  if (typeof images === "string") imgs = images ? [images] : [];
  if (!Array.isArray(imgs)) imgs = [];

  const all = loadAll();
  const post = {
    id: genId(),
    text: t,
    images: imgs.filter((s) => typeof s === "string" && s.length > 0),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: normAuthor(author),
    likes: [],
    comments: [],
  };

  all.push(post);
  saveAll(all);
  return post;
}

/**
 * Atualiza um post (texto/mídias/updatedAt).
 * @param {string} id
 * @param {{ text?: string, images?: string[]|string, updatedAt?: number }} patch
 */
export function updatePost(id, patch = {}) {
  if (!id) return;

  const all = loadAll();
  const idx = all.findIndex((p) => p.id === id);
  if (idx === -1) return;

  const post = normPost(all[idx]);
  const next = { ...post };

  if (typeof patch.text === "string") {
    next.text = patch.text;
  }
  if (typeof patch.images === "string") {
    next.images = patch.images ? [patch.images] : [];
  } else if (Array.isArray(patch.images)) {
    next.images = patch.images.filter((s) => typeof s === "string" && s.length > 0);
  }
  next.updatedAt = typeof patch.updatedAt === "number" ? patch.updatedAt : Date.now();

  all[idx] = next;
  saveAll(all);
}

/**
 * Exclui um post.
 * @param {string} id
 */
export function deletePost(id) {
  if (!id) return;
  const all = loadAll();
  const next = all.filter((p) => p.id !== id);
  saveAll(next);
}

/**
 * Alterna curtida do usuário no post.
 * @param {string} postId
 * @param {object} user  { id, username, name, email, avatar }
 */
export function toggleLike(postId, user) {
  if (!postId || !user || !user.id) return;

  const all = loadAll();
  const idx = all.findIndex((p) => p.id === postId);
  if (idx === -1) return;

  const post = normPost(all[idx]);
  const likes = post.likes || [];
  const exists = likes.find((u) => u.id === user.id);

  const newLikes = exists ? likes.filter((u) => u.id !== user.id) : [...likes, normLikeUser(user)];

  all[idx] = { ...post, likes: newLikes };
  saveAll(all);
}

/**
 * Adiciona comentário no post (comentário pai).
 * @param {string} postId
 * @param {string} text
 * @param {object} author
 */
export function addComment(postId, text, author) {
  const t = typeof text === "string" ? text.trim() : "";
  if (!postId || !t || !author || !author.id) return;

  const all = loadAll();
  const idx = all.findIndex((p) => p.id === postId);
  if (idx === -1) return;

  const post = normPost(all[idx]);

  const newComment = {
    id: genId(),
    text: t,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: normAuthor(author),
    replies: [],
  };

  all[idx] = { ...post, comments: [...(post.comments || []), newComment] };
  saveAll(all);
}

/**
 * Responde a um comentário (apenas 1 nível — resposta filha).
 * @param {string} postId
 * @param {string} parentCommentId
 * @param {string} text
 * @param {object} author
 */
export function replyComment(postId, parentCommentId, text, author) {
  const t = typeof text === "string" ? text.trim() : "";
  if (!postId || !parentCommentId || !t || !author || !author.id) return;

  const all = loadAll();
  const idx = all.findIndex((p) => p.id === postId);
  if (idx === -1) return;

  const post = normPost(all[idx]);

  const newReply = {
    id: genId(),
    text: t,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: normAuthor(author),
  };

  const nextComments = (post.comments || []).map((c) => {
    if (c.id === parentCommentId) {
      return { ...c, replies: [...(c.replies || []), newReply], updatedAt: Date.now() };
    }
    return c;
  });

  all[idx] = { ...post, comments: nextComments };
  saveAll(all);
}

/* --------- Edição de comentários (para quando ligar na UI) --------- */

/**
 * Atualiza o texto de um comentário pai.
 * @param {string} postId
 * @param {string} commentId
 * @param {string} newText
 */
export function updateComment(postId, commentId, newText) {
  const t = typeof newText === "string" ? newText.trim() : "";
  if (!postId || !commentId || !t) return;

  const all = loadAll();
  const idx = all.findIndex((p) => p.id === postId);
  if (idx === -1) return;

  const post = normPost(all[idx]);
  const nextComments = (post.comments || []).map((c) => {
    if (c.id === commentId) {
      return { ...c, text: t, updatedAt: Date.now() };
    }
    return c;
  });

  all[idx] = { ...post, comments: nextComments, updatedAt: Date.now() };
  saveAll(all);
}

/**
 * Atualiza o texto de uma resposta filha.
 * @param {string} postId
 * @param {string} parentCommentId
 * @param {string} replyId
 * @param {string} newText
 */
export function updateReply(postId, parentCommentId, replyId, newText) {
  const t = typeof newText === "string" ? newText.trim() : "";
  if (!postId || !parentCommentId || !replyId || !t) return;

  const all = loadAll();
  const idx = all.findIndex((p) => p.id === postId);
  if (idx === -1) return;

  const post = normPost(all[idx]);
  const nextComments = (post.comments || []).map((c) => {
    if (c.id === parentCommentId) {
      const nextReplies = (c.replies || []).map((r) => (r.id === replyId ? { ...r, text: t, updatedAt: Date.now() } : r));
      return { ...c, replies: nextReplies, updatedAt: Date.now() };
    }
    return c;
  });

  all[idx] = { ...post, comments: nextComments, updatedAt: Date.now() };
  saveAll(all);
}

/* ------------------ (Opcional) Seeder p/ debug ------------------ */
// Descomente para popular dados quando vazio.
/*
if (listPosts().length === 0) {
  const demo = { id: "u1", username: "maxi", name: "Maxi", email: "maxi@patanet.local", avatar: "" };
  addPost(demo, "Bem-vindo à PataNet 🐾", []);
}
*/
