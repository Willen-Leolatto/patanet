// src/features/events/utils/eventDate.js

/**
 * Converte (date + time) do evento em Date.
 * - date: 'YYYY-MM-DD'
 * - time: 'HH:mm' (opcional)
 */
export function eventToDate(ev) {
  const date = ev?.date
  if (!date) return null

  // Se vier ISO completo, Date() resolve; mas mantemos compatibilidade com 'YYYY-MM-DD'
  if (typeof date === 'string' && date.includes('T')) {
    const d = new Date(date)
    return Number.isNaN(d.getTime()) ? null : d
  }

  const time = ev?.time
  const hhmm = typeof time === 'string' && /^\d{1,2}:\d{2}/.test(time) ? time : '00:00'
  const iso = `${String(date).slice(0, 10)}T${hhmm}:00`
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

export function isPastEvent(ev, now = new Date()) {
  const d = eventToDate(ev)
  if (!d) return false
  return d.getTime() < now.getTime()
}
