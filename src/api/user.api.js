import { http } from './axios.js'

export async function createUser({ name, image, username, email, password }) {
  const formData = new FormData()
  formData.append('name', name)
  formData.append('image', image)
  formData.append('username', username)
  formData.append('email', email)
  formData.append('password', password)

  const response = await http.post('/users', formData)
  return response.data
}

export async function updateUser({ id, name, displayName, about, image, imageCover, username, email }) {
  const formData = new FormData()
  formData.append('name', name)
  formData.append('displayName', displayName)
  formData.append('about', about)
  formData.append('image', image)
  formData.append('imageCover', imageCover)
  formData.append('username', username)
  formData.append('email', email)

  const response = await http.patch(`/users/${id}`, formData)
  return response.data
}

export async function updateUserPassword({ id, currentPassword, newPassword }) {
  const response = await http.patch(`/users/${id}`, { currentPassword, newPassword })
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

