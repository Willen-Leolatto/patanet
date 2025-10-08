import { http } from './axios.js'

export async function createUser({ name, image, username, email, password }) {
  const response = await http.post('/users', { name, image, username, email, password })
  return response.data
}

export async function updateUser({ id, name, image, username, email }) {
  const response = await http.patch(`/users/${id}`, { name, image, username, email })
  return response.data
}

export async function updateUserPassword({ id, currentPassword, newPassword }) {
  const response = await http.patch(`/users/${id}`, { name, currentPassword, newPassword })
  return response.data
}

export async function getMyProfile() {
  const response = await http.get('/users/me')
  return response.data
}

export async function getUserProfile({ id }) {
  const response = await http.get(`/users/${id}`)
  return response.data
}

export async function fetchUsersProfile({ query, page = 1, perPage = 10 }) {
  const response = await http.get('/users', {
    params: {
      query,
      page,
      perPage
    }
  })
  return response.data
}

