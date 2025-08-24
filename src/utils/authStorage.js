const KEY = 'patanet_auth_v1'

// normaliza "usuário atual" (mock)
function normalizeUser({ email, name }) {
  const display = (name || '').trim() || (email?.split('@')[0] || 'Você')
  return { id: 'me', email: (email || '').trim(), name: display, avatar: null }
}

export function getSession() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null')
    return s && s.user ? s : { user: null, token: null }
  } catch {
    return { user: null, token: null }
  }
}

export function setSession(session) {
  localStorage.setItem(KEY, JSON.stringify(session))
  window.dispatchEvent(new Event('patanet:auth-updated'))
}

export function clearSession() {
  localStorage.removeItem(KEY)
  window.dispatchEvent(new Event('patanet:auth-updated'))
}

// "login" mock
export async function loginMock({ email, password, name }) {
  const user = normalizeUser({ email, name })
  const token = 'mock-' + Date.now()
  setSession({ user, token, loggedAt: Date.now() })
  return { user, token }
}

export async function logoutMock() {
  clearSession()
}
