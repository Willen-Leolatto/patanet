// src/utils/jwt.js

// Decodifica payload de JWT (Base64URL) sem validar assinatura.
// Útil apenas para ler claims (ex.: role) quando a API ainda não expõe isso em /users/me.

function b64urlToJson(b64url) {
  try {
    const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
    const pad = "=".repeat((4 - (b64.length % 4)) % 4);
    const str = atob(b64 + pad);
    return JSON.parse(str);
  } catch {
    return null;
  }
}

export function getAccessToken() {
  try {
    return window.localStorage.getItem("patanet_auth_v1:access_token") || "";
  } catch {
    return "";
  }
}

export function getJwtPayload() {
  const token = getAccessToken();
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  return b64urlToJson(parts[1]);
}

export function getTokenRoles() {
  const p = getJwtPayload() || {};
  const roles = [];
  if (p.role) roles.push(p.role);
  if (p.roles) roles.push(...(Array.isArray(p.roles) ? p.roles : [p.roles]));
  return roles.map((r) => String(r).trim().toUpperCase()).filter(Boolean);
}
