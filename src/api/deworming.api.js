import { http } from "./axios.js";

/**
 * Vermifugação (tabela/coleção por animal)
 *
 * Backend esperado (sugestão):
 * - POST   /animals/dewormings/:animalId
 * - GET    /animals/dewormings/:animalId
 * - PATCH  /animals/:animalId/dewormings/:dewormingId
 * - DELETE /animals/:animalId/dewormings/:dewormingId
 *
 * Payload sugerido:
 * {
 *   name: string,
 *   appliedAt: string (YYYY-MM-DD),
 *   nextDose?: string (YYYY-MM-DD),
 *   clinic?: string,
 *   observations?: string
 * }
 */

export async function addDeworming({
  animalId,
  name,
  observations,
  clinic,
  appliedAt,
  nextDose,
}) {
  const response = await http.post(`/animals/dewormings/${animalId}`, {
    name,
    observations,
    clinic,
    appliedAt,
    nextDose,
  });
  return response.data;
}

export async function fetchDewormings({ animalId, page = 1, perPage = 10 } = {}) {
  // page/perPage ficam prontos para o backend (se quiser paginar)
  const response = await http.get(`/animals/dewormings/${animalId}`, {
    params: { page, perPage },
  });
  return response.data;
}

export async function deleteDeworming({ animalId, dewormingId }) {
  const response = await http.delete(`/animals/${animalId}/dewormings/${dewormingId}`);
  return response.data;
}

export async function updateDeworming({
  dewormingId,
  animalId,
  name,
  observations,
  clinic,
  appliedAt,
  nextDose,
}) {
  const response = await http.patch(`/animals/${animalId}/dewormings/${dewormingId}`, {
    name,
    observations,
    clinic,
    appliedAt,
    nextDose,
  });
  return response.data;
}
