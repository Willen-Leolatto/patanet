// src/features/auth/services/authStorage.js
// Persistência simples em LocalStorage (apenas para demo)

const USERS_KEY = "pe_users";
const SESSION_KEY = "pe_session";

const read = (k) => {
  try { return JSON.parse(localStorage.getItem(k) || "null"); } catch { return null; }
};
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const uid = () => "u_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const normalizeEmail = (v="") => v.trim().toLowerCase();
const normalizeUser = (u) => ({
  id: u.id || uid(),
  name: (u.name || "").trim(),
  image: u.image || "",
  username: (u.username || "").trim(),
  email: normalizeEmail(u.email || ""),
  password: u.password || "", // (demo) – não use em produção
  createdAt: u.createdAt || Date.now(),
});

export function listUsers() {
  return read(USERS_KEY) || [];
}

export function findUserByEmailOrUsername(login) {
  const users = listUsers();
  const key = (login || "").trim();
  const email = normalizeEmail(key);
  return users.find(
    (u) => normalizeEmail(u.email) === email || u.username === key
  ) || null;
}

export function registerUser({ name, image, username, email, password }) {
  const users = listUsers();

  if (!name || !email || !password) {
    throw new Error("Preencha nome, email e senha.");
  }
  const exists =
    users.some((u) => normalizeEmail(u.email) === normalizeEmail(email)) ||
    users.some((u) => u.username === username && username);
  if (exists) throw new Error("Email ou usuário já cadastrado.");

  const user = normalizeUser({ name, image, username, email, password });
  users.push(user);
  write(USERS_KEY, users);
  // cria sessão
  write(SESSION_KEY, { userId: user.id, at: Date.now() });
  return user;
}

export function loginWithPassword({ login, password }) {
  const user = findUserByEmailOrUsername(login);
  if (!user || user.password !== password) {
    throw new Error("Credenciais inválidas.");
  }
  write(SESSION_KEY, { userId: user.id, at: Date.now() });
  return user;
}

export function getCurrentUser() {
  const session = read(SESSION_KEY);
  if (!session) return null;
  const users = listUsers();
  return users.find((u) => u.id === session.userId) || null;
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function updateUser(partial) {
  const users = listUsers();
  const idx = users.findIndex((u) => u.id === partial.id);
  if (idx === -1) return null;
  users[idx] = { ...users[idx], ...partial };
  write(USERS_KEY, users);
  // mantém a sessão apontando pro mesmo id
  return users[idx];
}
