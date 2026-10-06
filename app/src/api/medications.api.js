import { http } from "./axios.js";

/**
 * Medicamentos (tabela/coleção por animal)
 *
 * Backend esperado (sugestão):
 * - POST   /animals/medications/:animalId
 * - GET    /animals/medications/:animalId
 * - PATCH  /animals/:animalId/medications/:medicationId
 * - DELETE /animals/:animalId/medications/:medicationId
 *
 * Payload sugerido:
 * {
 *   name: string,
 *   startAt: string (YYYY-MM-DD),
 *   endAt?: string (YYYY-MM-DD),
 *   dosage?: string,
 *   frequency?: string,
 *   clinic?: string,
 *   observations?: string
 * }
 */

export async function addMedication({
  animalId,
  name,
  startAt,
  endAt,
  dosage,
  frequency,
  clinic,
  observations,
}) {
  const response = await http.post(`/animals/medications/${animalId}`, {
    name,
    startAt,
    endAt,
    dosage,
    frequency,
    clinic,
    observations,
  });
  return response.data;
}

export async function fetchMedications({ animalId, page = 1, perPage = 10 } = {}) {
  // page/perPage ficam prontos para o backend (se quiser paginar)
  const response = await http.get(`/animals/medications/${animalId}`, {
    params: { page, perPage },
  });
  return response.data;
}

export async function deleteMedication({ animalId, medicationId }) {
  const response = await http.delete(`/animals/${animalId}/medications/${medicationId}`);
  return response.data;
}

export async function updateMedication({
  medicationId,
  animalId,
  name,
  startAt,
  endAt,
  dosage,
  frequency,
  clinic,
  observations,
}) {
  const response = await http.patch(`/animals/${animalId}/medications/${medicationId}`, {
    name,
    startAt,
    endAt,
    dosage,
    frequency,
    clinic,
    observations,
  });
  return response.data;
}
