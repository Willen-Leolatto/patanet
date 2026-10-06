import { getCurrentUser as getStoredUser } from '@features/auth/services/authStorage'
import { loadSettings } from './userSettings'

export function getCurrentUser() {
  const user = getStoredUser()
  if (user) return user

  // fallback: usa Settings (mantém compatibilidade)
  const s = loadSettings()
  return {
    id: 'me',
    name: s.displayName?.trim() || 'Você',
    email: s.email?.trim() || 'voce@exemplo.com',
    avatar: null,
  }
}
