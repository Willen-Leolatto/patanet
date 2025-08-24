import { getSession } from './authStorage'
import { loadSettings } from './userSettings'

export function getCurrentUser() {
  const sess = getSession()
  if (sess?.user) return sess.user // {id:'me', name, email, avatar}

  // fallback: usa Settings (mantém compatibilidade)
  const s = loadSettings()
  return {
    id: 'me',
    name: s.displayName?.trim() || 'Você',
    email: s.email?.trim() || 'voce@exemplo.com',
    avatar: null,
  }
}
