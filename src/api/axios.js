import axios from 'axios'
import { ACCESS_TOKEN_KEY, clearTokens, refresh, REFRESH_TOKEN_KEY } from './auth.api.js'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

http.interceptors.request.use(async (config) => {
  const access_token = window.localStorage.getItem(ACCESS_TOKEN_KEY)
  const refresh_token = window.localStorage.getItem(REFRESH_TOKEN_KEY)
  if (access_token) {
    config.headers.Authorization = `Bearer ${access_token}`
    config.headers['refresh-token'] = refresh_token
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const refreshToken = window.localStorage.getItem(REFRESH_TOKEN_KEY)
      if (!refreshToken) {
        clearTokens()
        return Promise.reject(error)
      }

      try {
        await refresh()
        return http(originalRequest)
      } catch (refreshError) {
        clearTokens()
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  })
