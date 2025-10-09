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