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
 *   image,
 *   capacity
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
  appendIfPresent(fd, "capacity", payload.capacity);

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
  appendIfPresent(fd, "capacity", payload.capacity);

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
 * Confirmar presença ("Garantir Vaga") ou entrar na lista de espera
 * quando o evento estiver lotado ("Entrar na Lista de Espera").
 * POST /events/:id/attend
 *
 * Backend esperado: se `capacity` já foi atingida, a API deve colocar o
 * usuário na fila de espera e responder
 *   { attending: false, waitlisted: true, waitlistPosition: number, attendeesCount }
 * em vez de confirmar presença ou retornar erro. Caso contrário, responde
 *   { attending: true, waitlisted: false, attendeesCount }
 */
export async function attendEvent(eventId) {
  if (!eventId) return null;
  const response = await http.post(`/events/${eventId}/attend`);
  return response.data;
}

/**
 * Cancelar presença ou sair da lista de espera.
 * DELETE /events/:id/attend
 *
 * Backend esperado: se havia alguém na fila de espera, remover o próximo
 * da fila e promovê-lo automaticamente (attendeesCount reflete isso).
 */
export async function cancelEventAttendance(eventId) {
  if (!eventId) return null;
  const response = await http.delete(`/events/${eventId}/attend`);
  return response.data;
}

/**
 * Verificar se o usuário logado confirmou presença (ou está na lista de
 * espera) no evento.
 * GET /events/:id/attend
 * Backend esperado: { attending, waitlisted, waitlistPosition }
 */
export async function fetchMyAttendance(eventId) {
  if (!eventId) return null;
  const response = await http.get(`/events/${eventId}/attend`);
  return response.data;
}

/**
 * Buscar lista de participantes confirmados
 * GET /events/:id/attendees?page=&perPage=
 */
export async function fetchEventAttendees(eventId, { page = 1, perPage = 10 } = {}) {
  if (!eventId) return null;
  const response = await http.get(`/events/${eventId}/attendees`, {
    params: { page, perPage },
  });
  return response.data;
}

/**
 * Repostar evento (cria novamente o post vinculado sem criar evento novo)
 * POST /events/:id/repost
 */
export async function repostEvent(eventId) {
  if (!eventId) return null;
  const response = await http.post(`/events/${eventId}/repost`);
  return response.data;
}

/**
 * Vincular um pet sem dono a este evento de adoção (somente a instituição autora do evento)
 * POST /events/:id/adoptable-animals
 */
export async function registerAdoptableAnimal(eventId, animalId) {
  if (!eventId || !animalId) return null;
  const response = await http.post(`/events/${eventId}/adoptable-animals`, { animalId });
  return response.data;
}

/**
 * Transferir a tutoria de um pet vinculado a este evento para o novo dono (somente a instituição autora do evento)
 * POST /events/:id/adoptable-animals/:animalId/transfer
 */
export async function transferAdoptionTutorship(eventId, animalId, newOwnerId) {
  if (!eventId || !animalId || !newOwnerId) return null;
  const response = await http.post(`/events/${eventId}/adoptable-animals/${animalId}/transfer`, { newOwnerId });
  return response.data;
}
