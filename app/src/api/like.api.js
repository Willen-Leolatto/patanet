import { http } from './axios.js'

export async function addLikePost({ postId }) {
  const response = await http.post(`/posts/like/${postId}`)
  return response.data
}

export async function removeLikePost({ postId }) {
  const response = await http.delete(`/posts/like/${postId}`)
  return response.data
}