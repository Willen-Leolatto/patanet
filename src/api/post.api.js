import { http } from './axios.js'


export async function createPost({ subtitle, pets, medias }) {
  const formData = new FormData()
  formData.append('subtitle', subtitle)

  if (Array.isArray(pets)) {
    for (const pet of pets) {
      formData.append('pets', pet)
    }
  }

  if (Array.isArray(medias)) {
    for (const media of medias) {
      formData.append('medias', media)
    }
  }

  const response = await http.post('/posts', formData)
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
