// src/utils/role.js

export function normalizeRoles(me) {
  if (!me || typeof me !== "object") return [];

  const roles = [];

  // formatos comuns
  if (me.role) roles.push(me.role);
  if (me.type) roles.push(me.type);
  if (me.userType) roles.push(me.userType);

  // array de strings
  if (Array.isArray(me.roles)) roles.push(...me.roles);

  // array de objetos { name }
  if (Array.isArray(me.permissions)) roles.push(...me.permissions);

  // normaliza
  return roles
    .flatMap((r) => {
      if (!r) return [];
      if (typeof r === "string") return [r];
      if (typeof r === "object") {
        if (r.name) return [r.name];
        if (r.role) return [r.role];
        if (r.type) return [r.type];
      }
      return [];
    })
    .map((r) => String(r).trim().toUpperCase())
    .filter(Boolean);
}

export function canUseVetMode(me) {
  const roles = normalizeRoles(me);
  return roles.includes("VET") || roles.includes("STAFF") || roles.includes("ADMIN");
}
