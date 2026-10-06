import { http } from './axios.js'

// Campos da Carteira Clínica (selo "Validado por Médico Veterinário").
// Backend esperado: o modelo de vacina deve aceitar/persistir e devolver
// vetName, crmv, crmvUf e batchNumber (lote) junto dos demais campos.
// Enquanto o backend não suportar, o próprio Nest tende a descartar
// silenciosamente campos desconhecidos do payload (class-validator
// whitelist) — a UI trata a ausência desses campos na resposta como
// "não validado por veterinário" (ver PetDetail.jsx).
export async function addVaccine({
  animalId, name, observations, clinic, appliedAt, nextDose,
  vetName, crmv, crmvUf, batchNumber,
}) {
  const response = await http.post(`/animals/vaccines/${animalId}`, {
    name, observations, clinic, appliedAt, nextDose,
    vetName, crmv, crmvUf, batchNumber,
  })
  return response.data
}

export async function fetchVaccines({ animalId, page = 1, perPage = 10 }) {
  const response = await http.get(`/animals/vaccines/${animalId}`, { params: { page, perPage } })
  return response.data
}

export async function deleteVaccines({ animalId, vaccineId }) {
  const response = await http.delete(`/animals/${animalId}/vaccines/${vaccineId}`)
  return response.data
}

export async function updateVaccine({
  vaccineId, animalId, name, observations, clinic, appliedAt, nextDose,
  vetName, crmv, crmvUf, batchNumber,
}) {
  const response = await http.patch(`/animals/${animalId}/vaccines/${vaccineId}`, {
    name, observations, clinic, appliedAt, nextDose,
    vetName, crmv, crmvUf, batchNumber,
  })
  return response.data
}