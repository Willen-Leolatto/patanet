import { http } from './axios.js'

export async function fetchSpecies({ query, page = 1, perPage = 10 }) {
  const response = await http.get('/animals/species', {
    params: {
      query,
      page,
      perPage
    }
  })
  return response.data
}

export async function fetchBreeds({ query, specieId, page = 1, perPage = 10 }) {
  const response = await http.get('/animals/breeds', {
    params: {
      query,
      page,
      perPage,
      specieId
    }
  })
  return response.data
}

export async function addOwner({ ownerId, animalId }) {
  const response = await http.post(`/animals/${animalId}/owner/${ownerId}`)
  return response.data
}

export async function removeOwner({ ownerId, animalId }) {
  const response = await http.delete(`/animals/${animalId}/owner/${ownerId}`)
  return response.data
}


export async function createAnimal({ name, image, birthDate, adoptionDate, weight, size, gender, breedId }) {
  const response = await http.post('/animals', { name, image, birthDate, adoptionDate, weight, size, gender, breedId })
  return response.data
}

export async function updateAnimal({ animalId, name, image, birthDate, adoptionDate, weight, size, gender, breedId }) {
  const response = await http.patch(`/animals/${animalId}`, {
    name,
    image,
    birthDate,
    adoptionDate,
    weight,
    size,
    gender,
    breedId
  })
  return response.data
}

export async function deleteAnimal({ animalId }) {
  const response = await http.delete(`/animals/${animalId}`)
  return response.data
}

export async function fetchAnimalsByOwner({ userId, query, page = 1, perPage = 10 }) {
  const response = await http.get(`/animals/owner/${userId}`, {
    params: {
      query,
      page,
      perPage
    }
  })
  return response.data
}

export async function fetchAnimalsById({ animalId, query, page = 1, perPage = 10 }) {
  const response = await http.get(`/animals/${animalId}`, {
    params: {
      query,
      page,
      perPage
    }
  })
  return response.data
}