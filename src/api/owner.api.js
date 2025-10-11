import { http } from './axios.js'

export async function addOwner({ ownerId, animalId }) {
  const response = await http.post(`/animals/${animalId}/owner/${ownerId}`)
  return response.data
}

export async function removeOwner({ ownerId, animalId }) {
  const response = await http.delete(`/animals/${animalId}/owner/${ownerId}`)
  return response.data
}

export async function fetchAnimalsByOwner({ userId, query, page = 1, perPage = 10 }) {
  const response = await http.get(`/animals/owners/${userId}`, {
    params: {
      query,
    }
  })
  return response.data
}