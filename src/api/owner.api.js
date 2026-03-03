import { http } from './axios.js'

export async function addOwner({ ownerId, animalId }) {
  const response = await http.post(`/animals/${animalId}/owner/${ownerId}`)
  return response.data
}

export async function removeOwner({ ownerId, animalId }) {
  const response = await http.delete(`/animals/${animalId}/owner/${ownerId}`)
  return response.data
}



export async function transferPrimaryOwner({ animalId, ownerId }) {
  const response = await http.patch(`/animals/${animalId}/owner/${ownerId}/primary`)
  return response.data
}

// Ocultar pet para mim (delete lógico por usuário)
export async function hidePetForMe({ animalId }) {
  const response = await http.post(`/animals/${animalId}/hide`)
  return response.data
}

export async function unhidePetForMe({ animalId }) {
  const response = await http.post(`/animals/${animalId}/unhide`)
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