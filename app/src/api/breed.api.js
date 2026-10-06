import { http } from './axios.js'

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