import { http } from './axios.js'

export async function uploadAnimalMedias({ animalId, media }) {
  const formData = new FormData()
  formData.append('media', media)
  const response = await http.post(`/animals/medias/${animalId}`, formData)
  return response.data
}

export async function fetchAnimalMedias({ animalId, page = 1, perPage = 10 }) {
  const response = await http.get(`/animals/medias/${animalId}`)
  return response.data
}

export async function deleteAnimalMedias({ animalId, mediaId }) {
  const response = await http.delete(`/animals/${animalId}/medias/${mediaId}`)
  return response.data
}