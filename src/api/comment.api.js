import { http } from './axios.js'

export async function addCommentPost({ postId, message, parentId }) {
  const response = await http.post(`/posts/comment/${postId}`, {
    message, parentId
  })
  return response.data
}

export async function removeCommentPost({ postId, commentId }) {
  const response = await http.delete(`posts/${postId}/comment/${commentId}`)
  return response.data
}