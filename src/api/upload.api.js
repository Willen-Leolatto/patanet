import { http } from './axios.js'

export async function uploadFile(file) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await http.post('/upload/file', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })

  return { url: response.data.url }
}