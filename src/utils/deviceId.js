const KEY = 'patanet:device-id'

export function getDeviceId() {
  try {
    const existing = window.localStorage.getItem(KEY)
    if (existing) return existing

    const id = (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`)
      .toString()
      .replace(/[^a-zA-Z0-9_-]/g, '')

    window.localStorage.setItem(KEY, id)
    return id
  } catch {
    return 'unknown-device'
  }
}
