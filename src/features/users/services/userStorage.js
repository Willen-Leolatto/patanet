// src/features/users/services/userStorage.js

/* ============================================================
 * Users + Follows (localStorage)
 *  - auth continua responsável por session/validação
 *  - aqui mantemos catálogo de usuários e relações de follow
 * ============================================================ */

const USERS_KEY = "patanet_users";
const FOLLOWS_KEY = "patanet_follows";
const FOLLOWS_EVENT = "patanet:follows-updated";

/* -------------------------- utils de storage -------------------------- */
function safeParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}
function emitFollowsEvent() {
  try {
    window.dispatchEvent(new Event(FOLLOWS_EVENT));
  } catch {}
}
function ensureId(u) {
  return (
    u?.id || u?.uid || u?.email || u?.username || null
  );
}

/* ============================== USERS =============================== */

export function listUsers() {
  const raw = localStorage.getItem(USERS_KEY);
  const arr = safeParse(raw, []);
  return Array.isArray(arr) ? arr : [];
}

export function getUserById(id) {
  if (!id) return null;
  const all = listUsers();
  return (
    all.find(
      (u) =>
        u.id === id ||
        u.uid === id ||
        u.email === id ||
        u.username === id
    ) || null
  );
}

/** Upsert simples — útil se você quiser espelhar o cadastro da auth aqui. */
export function upsertUser(userLike) {
  const id = ensureId(userLike);
  if (!id) return null;

  const all = listUsers();
  const idx = all.findIndex(
    (u) =>
      u.id === id || u.uid === id || u.email === id || u.username === id
  );

  const current = idx >= 0 ? all[idx] : {};
  const merged = {
    ...current,
    // campos comuns
    id: id,
    name: userLike?.name ?? current?.name ?? "",
    username: userLike?.username ?? current?.username ?? "",
    email: userLike?.email ?? current?.email ?? "",
    image: userLike?.image ?? userLike?.avatar ?? current?.image ?? "",
    createdAt: userLike?.createdAt ?? current?.createdAt ?? Date.now(),
  };

  if (idx >= 0) all[idx] = merged;
  else all.push(merged);

  localStorage.setItem(USERS_KEY, JSON.stringify(all));
  return merged;
}

/* ============================= FOLLOWS ============================== */
/** Estrutura: { edges: [{ followerId, followingId, createdAt }] } */
function readFollows() {
  const raw = localStorage.getItem(FOLLOWS_KEY);
  const obj = safeParse(raw, { edges: [] });
  if (!obj || !Array.isArray(obj.edges)) return { edges: [] };
  return obj;
}
function writeFollows(obj) {
  localStorage.setItem(FOLLOWS_KEY, JSON.stringify(obj || { edges: [] }));
  emitFollowsEvent();
}

/** IDs de quem SEGUE o userId (followers) */
export function listFollowersIds(userId) {
  const { edges } = readFollows();
  return edges
    .filter((e) => e.followingId === userId)
    .map((e) => e.followerId);
}

/** IDs que o userId SEGUE (following) */
export function listFollowingIds(userId) {
  const { edges } = readFollows();
  return edges
    .filter((e) => e.followerId === userId)
    .map((e) => e.followingId);
}

export function countFollowers(userId) {
  return listFollowersIds(userId).length;
}
export function countFollowing(userId) {
  return listFollowingIds(userId).length;
}

export function isFollowing(followerId, followingId) {
  if (!followerId || !followingId) return false;
  const { edges } = readFollows();
  return edges.some(
    (e) => e.followerId === followerId && e.followingId === followingId
  );
}

export function follow(followerId, followingId) {
  if (!followerId || !followingId || followerId === followingId) return;
  const data = readFollows();
  if (
    data.edges.some(
      (e) => e.followerId === followerId && e.followingId === followingId
    )
  ) {
    return;
  }
  data.edges.push({ followerId, followingId, createdAt: Date.now() });
  writeFollows(data);
}

export function unfollow(followerId, followingId) {
  if (!followerId || !followingId) return;
  const data = readFollows();
  const i = data.edges.findIndex(
    (e) => e.followerId === followerId && e.followingId === followingId
  );
  if (i >= 0) {
    data.edges.splice(i, 1);
    writeFollows(data);
  }
}

export function toggleFollow(followerId, followingId) {
  if (!followerId || !followingId) return;
  if (isFollowing(followerId, followingId)) {
    unfollow(followerId, followingId);
  } else {
    follow(followerId, followingId);
  }
}

/* -------------------------- Conveniências (opcional) -------------------------- */
/** Retorna objetos de usuários a partir dos IDs de followers/following */
export function listFollowers(userId) {
  const ids = listFollowersIds(userId);
  const all = listUsers();
  return ids
    .map((id) => all.find((u) => ensureId(u) === id))
    .filter(Boolean);
}
export function listFollowing(userId) {
  const ids = listFollowingIds(userId);
  const all = listUsers();
  return ids
    .map((id) => all.find((u) => ensureId(u) === id))
    .filter(Boolean);
}
