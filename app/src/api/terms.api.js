// src/api/terms.api.js
import { http } from "./axios.js";

// Versão vigente dos Termos de Uso / Política de Privacidade (LGPD).
// Atualize esta constante sempre que o texto legal mudar de forma
// relevante — usuários que aceitaram uma versão anterior serão
// bloqueados novamente até aceitar a nova.
export const CURRENT_TERMS_VERSION = "2026-09-15";

const LOCAL_KEY_PREFIX = "patanet:terms-accepted:";

function isNotImplemented(err) {
  const s = err?.response?.status;
  return s === 404 || s === 405 || s === 501;
}

/**
 * Backend esperado:
 *   GET /users/me/terms
 *   -> { currentVersion, acceptedVersion, requiresAcceptance, termsUrl }
 *
 * Enquanto o endpoint não estiver disponível, cai para um fallback
 * armazenado localmente por usuário (mantém o modal bloqueante funcional
 * mesmo sem suporte do backend ainda).
 */
export async function fetchTermsStatus({ userId } = {}) {
  try {
    const response = await http.get("/users/me/terms");
    return response.data;
  } catch (e) {
    if (isNotImplemented(e)) return fetchLocalTermsStatus({ userId });
    throw e;
  }
}

/**
 * Backend esperado:
 *   POST /users/me/terms/accept  { version }
 *   -> { acceptedVersion }
 */
export async function acceptTerms({ userId, version = CURRENT_TERMS_VERSION } = {}) {
  try {
    const response = await http.post("/users/me/terms/accept", { version });
    return response.data;
  } catch (e) {
    if (isNotImplemented(e)) return acceptLocalTerms({ userId, version });
    throw e;
  }
}

function fetchLocalTermsStatus({ userId }) {
  let accepted = null;
  try {
    accepted = userId
      ? window.localStorage.getItem(`${LOCAL_KEY_PREFIX}${userId}`)
      : null;
  } catch {
    // localStorage indisponível (modo privado etc.): trata como não aceito
  }
  return {
    currentVersion: CURRENT_TERMS_VERSION,
    acceptedVersion: accepted || null,
    requiresAcceptance: accepted !== CURRENT_TERMS_VERSION,
    termsUrl: "/privacidade",
  };
}

function acceptLocalTerms({ userId, version }) {
  try {
    if (userId) {
      window.localStorage.setItem(`${LOCAL_KEY_PREFIX}${userId}`, version);
    }
  } catch {
    // se não conseguir persistir localmente, o modal pode reaparecer
    // na próxima sessão — comportamento aceitável como fallback.
  }
  return { acceptedVersion: version };
}
