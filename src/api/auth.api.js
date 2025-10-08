import { http } from './axios.js'

export const AUTH_KEY = 'patanet_auth_v1'
export const ACCESS_TOKEN_KEY = `${AUTH_KEY}:access_token`
export const REFRESH_TOKEN_KEY = `${AUTH_KEY}:refresh_token`


export async function signIn({ username, password }) {
  const response = await http.post('/auth/session', {
    username,
    password
  })
  saveTokens(response.data)
  return response.data
}

export async function refresh() {
  const response = await http.post('/auth/refresh')
  saveTokens(response.data)
  return response.data
}

export function saveTokens(payload) {
  const { access_token, refresh_token } = payload

  http.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
  http.defaults.headers.common['refresh-token'] = refresh_token

  window.localStorage.setItem(ACCESS_TOKEN_KEY, access_token)
  window.localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token)
}
