// src/features/feed/services/feedStorage.js
const KEY = "patanet_feed_posts";

export function loadFeed() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function saveFeed(arr) {
  localStorage.setItem(KEY, JSON.stringify(arr));
  // notifica a UI para recarregar
  window.dispatchEvent(new Event("patanet:feed-updated"));
}

export function listPosts() {
  return loadFeed().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export function addPost(partial) {
  const post = {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    author: { name: "Você" },
    text: "",
    images: [], // [{ url }]
    likes: 0,
    liked: false,
    comments: [], // [{id, text, createdAt, author}]
    commentsCount: 0,
    ...partial,
  };
  const arr = loadFeed();
  arr.unshift(post);
  saveFeed(arr);
  return post;
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

export function addComment(id, text) {
  const t = (text || "").trim();
  if (!t) return null;
  const arr = loadFeed();
  const i = arr.findIndex((p) => p.id === id);
  if (i >= 0) {
    if (!arr[i].comments) arr[i].comments = [];
    arr[i].comments.push({
      id: crypto.randomUUID(),
      text: t,
      createdAt: Date.now(),
      author: { name: "Você" },
    });
    arr[i].commentsCount = (arr[i].commentsCount || 0) + 1;
    saveFeed(arr);
    return arr[i];
  }
  return null;
}
