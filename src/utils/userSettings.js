// src/utils/userSettings.js
const KEY = 'patanet_settings'

const DEFAULTS = {
  displayName: '',
  bio: '',
  email: '',
  theme: 'auto', // 'auto' | 'light' | 'dark'
  notifications: { email: true, push: false },
  privacy: { feedPublic: true, photosPublic: false },
}

export function loadSettings() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}')
    return {
      ...DEFAULTS,
      ...raw,
      notifications: { ...DEFAULTS.notifications, ...(raw?.notifications || {}) },
      privacy: { ...DEFAULTS.privacy, ...(raw?.privacy || {}) },
    }
  } catch {
    return { ...DEFAULTS }
  }
}

export function saveSettings(s) {
  localStorage.setItem(KEY, JSON.stringify(s))
  window.dispatchEvent(new Event('patanet:settings-updated'))
}
