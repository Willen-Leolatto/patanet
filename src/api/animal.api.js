// src/api/animal.api.js
import { http } from './axios.js'

function appendIfPresent(fd, key, val) {
  if (val === undefined || val === null) return
  // tudo como string, exceto File/Blob
  if (val instanceof File || val instanceof Blob) {
    fd.append(key, val)
  } else {
    fd.append(key, String(val))
  }
}

export async function createAnimal({
  name,
  about,
  image,
  imageCover,
  birthDate,
  adoptionDate,
  weight,
  size,
  gender,
  breedId
}) {
  const formData = new FormData()

  appendIfPresent(formData, 'name', name)
  appendIfPresent(formData, 'about', about)
  appendIfPresent(formData, 'image', image)               // File
  appendIfPresent(formData, 'imageCover', imageCover)     // File
  appendIfPresent(formData, 'birthDate', birthDate)       // "2020-02-10T00:00:00.000Z"
  appendIfPresent(formData, 'adoptionDate', adoptionDate) // idem
  appendIfPresent(formData, 'weight', weight)             // "16"
  appendIfPresent(formData, 'size', size)                 // "MEDIUM"
  appendIfPresent(formData, 'gender', gender)             // "MALE"
  appendIfPresent(formData, 'breedId', breedId)

  const response = await http.post('/animals', formData)
  return response.data
}

export async function updateAnimal({
  animalId,
  name,
  about,
  image,
  imageCover,
  birthDate,
  adoptionDate,
  weight,
  size,
  gender,
  breedId
}) {
  const formData = new FormData()

  appendIfPresent(formData, 'name', name)
  appendIfPresent(formData, 'about', about)
  appendIfPresent(formData, 'image', image)
  appendIfPresent(formData, 'imageCover', imageCover)
  appendIfPresent(formData, 'birthDate', birthDate)
  appendIfPresent(formData, 'adoptionDate', adoptionDate)
  appendIfPresent(formData, 'weight', weight)
  appendIfPresent(formData, 'size', size)
  appendIfPresent(formData, 'gender', gender)
  appendIfPresent(formData, 'breedId', breedId)

  const response = await http.patch(`/animals/${animalId}`, formData)
  return response.data
}

export async function deleteAnimal({ animalId }) {
  const response = await http.delete(`/animals/${animalId}`)
  return response.data
}

export async function fetchAnimalsById({ animalId, query, page = 1, perPage = 10 }) {
  const response = await http.get(`/animals/${animalId}`, {
    params: { query, page, perPage }
  })
  return response.data
}
