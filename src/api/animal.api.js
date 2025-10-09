import { http } from './axios.js'

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
  formData.append('name', name)
  formData.append('about', about)
  formData.append('image', image)
  formData.append('imageCover', imageCover)
  formData.append('birthDate', birthDate)
  formData.append('adoptionDate', adoptionDate)
  formData.append('weight', weight)
  formData.append('size', size)
  formData.append('gender', gender)
  formData.append('breedId', breedId)

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
  formData.append('name', name)
  formData.append('about', about)
  formData.append('image', image)
  formData.append('imageCover', imageCover)
  formData.append('birthDate', birthDate)
  formData.append('adoptionDate', adoptionDate)
  formData.append('weight', weight)
  formData.append('size', size)
  formData.append('gender', gender)
  formData.append('breedId', breedId)
  const response = await http.patch(`/animals/${animalId}`, formData)
  return response.data
}

export async function deleteAnimal({ animalId }) {
  const response = await http.delete(`/animals/${animalId}`)
  return response.data
}


export async function fetchAnimalsById({ animalId, query, page = 1, perPage = 10 }) {
  const response = await http.get(`/animals/${animalId}`, {
    params: {
      query, page, perPage
    }
  })
  return response.data
}