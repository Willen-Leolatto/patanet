// src/utils/moderation.js

const KEY_BLOCKED_USERS = "patanet:blocked-users"; // JSON string array
const KEY_ACCEPTED_POLICIES = "patanet:accepted-policies"; // JSON: { acceptedAt, version, scopes: {ugc:true} }

export const POLICY_VERSION = "2026-02-24";

export function getBlockedUserIds() {
  try {
    const raw = localStorage.getItem(KEY_BLOCKED_USERS);
    const arr = JSON.parse(raw || "[]");
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
}

export function isUserBlocked(userId) {
  if (!userId) return false;
  const set = new Set(getBlockedUserIds());
  return set.has(String(userId));
}

export function blockUser(userId) {
  if (!userId) return;
  const curr = new Set(getBlockedUserIds());
  curr.add(String(userId));
  localStorage.setItem(KEY_BLOCKED_USERS, JSON.stringify(Array.from(curr)));
  window.dispatchEvent(new Event("patanet:blocked-updated"));
}

export function unblockUser(userId) {
  if (!userId) return;
  const curr = new Set(getBlockedUserIds());
  curr.delete(String(userId));
  localStorage.setItem(KEY_BLOCKED_USERS, JSON.stringify(Array.from(curr)));
  window.dispatchEvent(new Event("patanet:blocked-updated"));
}

export function getAcceptedPolicies() {
  try {
    const raw = localStorage.getItem(KEY_ACCEPTED_POLICIES);
    const obj = JSON.parse(raw || "null");
    return obj && typeof obj === "object" ? obj : null;
  } catch {
    return null;
  }
}

export function hasAcceptedUGCPolicies() {
  const acc = getAcceptedPolicies();
  if (!acc) return false;
  if (acc.version !== POLICY_VERSION) return false;
  return Boolean(acc?.scopes?.ugc);
}

export function acceptUGCPolicies() {
  const next = {
    acceptedAt: new Date().toISOString(),
    version: POLICY_VERSION,
    scopes: { ugc: true },
  };
  localStorage.setItem(KEY_ACCEPTED_POLICIES, JSON.stringify(next));
  window.dispatchEvent(new Event("patanet:policies-accepted"));
}
