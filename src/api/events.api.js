// src/api/events.api.js
import { http } from "./axios.js";

function appendIfPresent(fd, key, val) {
  if (val === undefined || val === null) return;
  if (val instanceof File || val instanceof Blob) fd.append(key, val);
  else fd.append(key, String(val));
}

/**
 * Buscar lista de eventos
 * Backend esperado:
 * GET /events?page=&perPage=
 */
export async function fetchEvents({ page = 1, perPage = 10 } = {}) {
  const response = await http.get("/events", { params: { page, perPage } });
  return response.data;
}

/**
 * Buscar evento por ID
 * GET /events/:id
 */
export async function fetchEventById(eventId) {
  if (!eventId) return null;
  const response = await http.get(`/events/${eventId}`);
  return response.data;
}

/**
 * Criar evento
 * Backend esperado:
 * POST /events
 *
 * Payload sugerido:
 * {
 *   title,
 *   description,
 *   date,
 *   time,
 *   locationText,
 *   latitude,
 *   longitude,
 *   image
 * }
 *
 * Importante:
 * - O backend deve criar automaticamente um POST vinculado (aparecer no feed)
 */
export async function createEvent(payload = {}) {
  const fd = new FormData();
  appendIfPresent(fd, "title", payload.title);
  appendIfPresent(fd, "description", payload.description);
  appendIfPresent(fd, "date", payload.date);
  appendIfPresent(fd, "time", payload.time);
  appendIfPresent(fd, "locationText", payload.locationText);
  appendIfPresent(fd, "latitude", payload.latitude);
  appendIfPresent(fd, "longitude", payload.longitude);
  appendIfPresent(fd, "image", payload.image);

  const response = await http.post("/events", fd);
  return response.data;
}

/**
 * Atualizar evento
 * PUT /events/:id
 */
export async function updateEvent(eventId, payload = {}) {
  if (!eventId) return null;

  const fd = new FormData();
  appendIfPresent(fd, "title", payload.title);
  appendIfPresent(fd, "description", payload.description);
  appendIfPresent(fd, "date", payload.date);
  appendIfPresent(fd, "time", payload.time);
  appendIfPresent(fd, "locationText", payload.locationText);
  appendIfPresent(fd, "latitude", payload.latitude);
  appendIfPresent(fd, "longitude", payload.longitude);
  appendIfPresent(fd, "image", payload.image);

  const response = await http.put(`/events/${eventId}`, fd);
  return response.data;
}

/**
 * Remover evento
 * DELETE /events/:id
 */
export async function deleteEvent(eventId) {
  if (!eventId) return null;
  const response = await http.delete(`/events/${eventId}`);
  return response.data;
}

/**
 * (FUTURO) Confirmar presença
 * POST /events/:id/attend
 */
export async function attendEvent(eventId) {
  if (!eventId) return null;
  const response = await http.post(`/events/${eventId}/attend`);
  return response.data;
}

/**
 * (FUTURO) Cancelar presença
 * DELETE /events/:id/attend
 */
export async function cancelEventAttendance(eventId) {
  if (!eventId) return null;
  const response = await http.delete(`/events/${eventId}/attend`);
  return response.data;
}
