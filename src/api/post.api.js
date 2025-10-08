import { http } from './axios.js'

export async function addLikePost({ postId }) {
  const response = await http.post(`/posts/like/${postId}`)
  return response.data
}

export async function removeLikePost({ postId }) {
  const response = await http.delete(`/posts/like/${postId}`)
  return response.data
}

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

export async function createPost({ subtitle, pets, medias }) {
  const response = await http.post('/posts', { subtitle, pets, medias })
  return response.data
}

export async function deletePost({ postId }) {
  const response = await http.delete(`/posts/${postId}`)
  return response.data
}


export async function fetchMyPosts({ page = 1, perPage = 10 }) {
  const response = await http.get(`/posts/me`, {
    params: {
      page,
      perPage
    }
  })
  return response.data
}

export async function fetchPostsByUserId({ userId, page = 1, perPage = 10 }) {
  const response = await http.get(`/posts/user/${userId}`, {
    params: {
      page,
      perPage
    }
  })
  return response.data
}

export async function fetchMyFeed({ page = 1, perPage = 10 }) {
  const response = await http.get(`/posts/feed`, {
    params: {
      page,
      perPage
    }
  })
  return response.data
}

export async function getPostById({ postId }) {
  const response = await http.get(`/posts/${postId}`)
  return response.data
}

































