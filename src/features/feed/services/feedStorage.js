// src/features/feed/services/feedStorage.js

const STORAGE_KEY = "patanet_feed_v3";

import {
  mediaSaveBlob,
} from "@/features/pets/services/petsStorage";

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
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list || []));
  } catch (err) {
    // Evita crash por quota — mantém último estado válido
    console.warn("feedStorage saveAllRaw failed:", err?.name || err);
    // estratégia leve: se estourar, tenta remover posts muito antigos sem mídia grande
    try {
      const trimmed = (Array.isArray(list) ? list : []).slice(-200); // mantém os 200 mais recentes
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch (e2) {
      // se ainda estourar, não faz nada além de logar
      console.warn("feedStorage emergency trim failed:", e2?.name || e2);
    }
  } finally {
    window.dispatchEvent(new Event("patanet:feed-updated"));
  }
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
function normComment(c) {
  if (!c || typeof c !== "object") c = {};
  return {
    id: c.id ?? genId(),
    text: typeof c.text === "string" ? c.text : "",
    createdAt: typeof c.createdAt === "number" ? c.createdAt : Date.now(),
    updatedAt: typeof c.updatedAt === "number" ? c.updatedAt : c.createdAt ?? Date.now(),
    author: normAuthor(c.author),
    replies: (c.replies ? toArray(c.replies) : []).map(normReply),
  };
}

// imagens no feed agora são objetos compactos
// { id: string, storage: 'idb', kind: 'image' }
function normImageEntry(it) {
  if (!it) return null;
  if (typeof it === "string") {
    // strings antigas (http/dataURL) não persistimos mais como string para não estourar quota.
    // Elas devem ser convertidas na criação/atualização via saveImagesToIDB.
    return { id: it, storage: "legacy", kind: "image" };
  }
  if (typeof it === "object") {
    return {
      id: String(it.id || it.url || genId()),
      storage: it.storage === "idb" ? "idb" : (it.storage || "legacy"),
      kind: it.kind || "image",
    };
  }
  return null;
}

function normPost(p) {
  if (!p || typeof p !== "object") p = {};
  const images = Array.isArray(p.images) ? p.images.map(normImageEntry).filter(Boolean) : [];

  return {
    id: p.id ?? genId(),
    text: typeof p.text === "string" ? p.text : "",
    images,
    createdAt: typeof p.createdAt === "number" ? p.createdAt : Date.now(),
    updatedAt: typeof p.updatedAt === "number" ? p.updatedAt : p.createdAt ?? Date.now(),
    author: normAuthor(p.author),
    likes: toArray(p.likes).map(normLikeUser),
    comments: (p.comments ? toArray(p.comments) : []).map(normComment),
    taggedPets: Array.isArray(p.taggedPets)
      ? p.taggedPets.map((v) => String(v))
      : [],
  };
}

/* ------------------ Helpers de imagem ------------------ */
async function dataUrlToBlob(dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string") return null;
  if (!dataUrl.startsWith("data:")) return null;
  const res = await fetch(dataUrl);
  return await res.blob();
}

/**
 * Recebe uma lista de entradas (strings DataURL/URL, ou objetos) e
 * retorna uma lista compacta [{id, storage:'idb', kind:'image'}], salvando blobs no IDB.
 */
async function saveImagesToIDB(inputs) {
  const out = [];
  for (const it of inputs || []) {
    if (!it) continue;

    if (typeof it === "string") {
      if (it.startsWith("data:")) {
        const blob = await dataUrlToBlob(it);
        if (blob) {
          const id = await mediaSaveBlob(blob);
          if (id) out.push({ id, storage: "idb", kind: "image" });
        }
      } else {
        // URL http(s): opcionalmente poderíamos baixar e converter, mas para não estourar quota,
        // apenas descartar strings longas/externas. Se necessário, pode ser salvo como 'legacy'.
        out.push({ id: it, storage: "legacy", kind: "image" });
      }
    } else if (typeof it === "object") {
      // já veio normalizado?
      if (it.storage === "idb" && it.id) out.push({ id: String(it.id), storage: "idb", kind: it.kind || "image" });
      else if (it.url && typeof it.url === "string") out.push({ id: it.url, storage: "legacy", kind: it.kind || "image" });
    }
  }
  return out;
}

/* ------------------ Carga/Migração leve ------------------ */
function loadAll() {
  const arr = loadAllRaw();
  return (Array.isArray(arr) ? arr : []).map(normPost);
}
function saveAll(posts) {
  const normalized = (Array.isArray(posts) ? posts : []).map(normPost);
  saveAllRaw(normalized);
}

/* ------------------ API Pública ------------------ */
export function listPosts() {
  const list = loadAll();
  return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

/**
 * Cria um novo post.
 * @param {object} author { id, username, name, email, avatar }
 * @param {string} text
 * @param {Array<string|object>} images  — DataURLs/URLs/objetos
 * @param {string[]} taggedPets
 */
export async function addPost(author, text, images = [], taggedPets = []) {
  const t = typeof text === "string" ? text.trim() : "";
  if (!author || !author.id || !t) return null;

  const compactImages = await saveImagesToIDB(Array.isArray(images) ? images : [images]);

  const tags =
    Array.isArray(taggedPets) ? taggedPets.map((v) => String(v)) : [];

  const all = loadAll();
  const post = {
    id: genId(),
    text: t,
    images: compactImages, // agora só refs compactas
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: normAuthor(author),
    likes: [],
    comments: [],
    taggedPets: tags,
  };

  all.push(post);
  saveAll(all);
  return post;
}

/**
 * Atualiza um post.
 * @param {string} id
 * @param {{ text?: string, images?: Array<string|object>|string, taggedPets?: string[]|null, updatedAt?: number }} patch
 */
export async function updatePost(id, patch = {}) {
  if (!id) return;

  const all = loadAll();
  const idx = all.findIndex((p) => p.id === id);
  if (idx === -1) return;

  const post = normPost(all[idx]);
  const next = { ...post };

  if (typeof patch.text === "string") {
    next.text = patch.text;
  }

  if (patch.images != null) {
    const list =
      typeof patch.images === "string" ? [patch.images] : Array.isArray(patch.images) ? patch.images : [];
    next.images = await saveImagesToIDB(list);
  }

  if (patch.taggedPets != null) {
    next.taggedPets = Array.isArray(patch.taggedPets)
      ? patch.taggedPets.map((v) => String(v))
      : [];
  }

  next.updatedAt = typeof patch.updatedAt === "number" ? patch.updatedAt : Date.now();

  all[idx] = next;
  saveAll(all);
}

export function deletePost(id) {
  if (!id) return;
  const all = loadAll();
  const next = all.filter((p) => p.id !== id);
  saveAll(next);
}

export function toggleLike(postId, user) {
  if (!postId || !user || !user.id) return;

  const all = loadAll();
  const idx = all.findIndex((p) => p.id === postId);
  if (idx === -1) return;

  const post = normPost(all[idx]);
  const likes = post.likes || [];
  const myId = user.id;
  const exists = likes.find((u) => u.id === myId);

  const newLikes = exists
    ? likes.filter((u) => u.id !== myId)
    : [...likes, normLikeUser(user)];

  all[idx] = { ...post, likes: newLikes, updatedAt: Date.now() };
  saveAll(all);
}

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

  all[idx] = { ...post, comments: [...(post.comments || []), newComment], updatedAt: Date.now() };
  saveAll(all);
}

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

  all[idx] = { ...post, comments: nextComments, updatedAt: Date.now() };
  saveAll(all);
}

/* --------- (Opcional) edição de comentários --------- */
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

export function updateReply(postId, parentCommentId, replyId, newText) {
  const t = typeof newText === "string" ? newText.trim() : "";
  if (!postId || !parentCommentId || !replyId || !t) return;

  const all = loadAll();
  const idx = all.findIndex((p) => p.id === postId);
  if (idx === -1) return;

  const post = normPost(all[idx]);
  const nextComments = (post.comments || []).map((c) => {
    if (c.id === parentCommentId) {
      const nextReplies = (c.replies || []).map((r) =>
        r.id === replyId ? { ...r, text: t, updatedAt: Date.now() } : r
      );
      return { ...c, replies: nextReplies, updatedAt: Date.now() };
    }
    return c;
  });

  all[idx] = { ...post, comments: nextComments, updatedAt: Date.now() };
  saveAll(all);
}


/**
 * Migra mídia legada (strings/DataURL) para IndexedDB e substitui por refs compactas.
 * Executa uma única vez no carregamento do app/Feed. É idempotente.
 */
export async function runFeedMediaMigration() {
  const raw = safeParse(localStorage.getItem(STORAGE_KEY), []);
  if (!Array.isArray(raw) || raw.length === 0) return;

  let changed = false;

  async function normalizeImages(images) {
    const out = [];
    for (const it of images || []) {
      if (!it) continue;

      // Já está normalizado?
      if (typeof it === "object" && it.storage === "idb" && it.id) {
        out.push({ id: String(it.id), storage: "idb", kind: it.kind || "image" });
        continue;
      }

      // String legada (DataURL ou http/https)
      if (typeof it === "string") {
        if (it.startsWith("data:")) {
          try {
            const blob = await dataUrlToBlob(it);
            if (blob) {
              const id = await mediaSaveBlob(blob);
              if (id) {
                out.push({ id, storage: "idb", kind: "image" });
                changed = true;
              }
              continue;
            }
          } catch {}
        }
        // http/https — mantém como "legacy" (pode migrar depois se quiser)
        out.push({ id: it, storage: "legacy", kind: "image" });
        continue;
      }

      // Objeto legado sem storage/id
      if (typeof it === "object") {
        if (it.url && typeof it.url === "string") {
          out.push({ id: it.url, storage: "legacy", kind: it.kind || "image" });
        }
      }
    }
    return out;
  }

  // Monta lista migrada
  const migrated = [];
  for (const p of raw) {
    const imgs = Array.isArray(p?.images) ? p.images : (p?.image ? [p.image] : []);
    const compact = await normalizeImages(imgs);
    migrated.push({
      ...p,
      images: compact,
      image: undefined, // remove antigo "image"
    });
  }

  // Tenta salvar tudo; se ainda assim estourar, salva em lotes
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
  } catch (err) {
    console.warn("feedStorage migration full save failed:", err?.name || err);
    // salva apenas os últimos N (em lotes decrescentes)
    let N = Math.min(200, migrated.length);
    let ok = false;
    while (N > 0 && !ok) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated.slice(-N)));
        ok = true;
      } catch (e) {
        N = Math.floor(N / 2);
      }
    }
    if (!ok) {
      // como último recurso, limpa a lista para não travar curtidas/comentários
      console.warn("feedStorage migration emergency clear");
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    }
  } finally {
    if (changed) {
      window.dispatchEvent(new Event("patanet:feed-updated"));
    }
  }
}
