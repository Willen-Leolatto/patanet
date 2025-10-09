import { http } from './axios.js'


export async function addVaccine({ animalId, name, observations, clinic, appliedAt, nextDose }) {
  const response = await http.post(`/animals/medias/${animalId}`, {
    name, observations, clinic, appliedAt, nextDose
  })
  return response.data
}

export async function fetchVaccines({ animalId, page = 1, perPage = 10 }) {
  const response = await http.get(`/animals/vaccines/${animalId}`, {
    params: {
      page, perPage
    }
  })
  return response.data
}

export async function deleteVaccines({ animalId, vaccineId }) {
  const response = await http.delete(`/animals/${animalId}/vaccines/${vaccineId}`)
  return response.data
}