import { http } from './axios.js'

export async function createOrg(payload) {
  const { data } = await http.post('/orgs', payload)
  return data
}

export async function myOrgs() {
  const { data } = await http.get('/orgs/me')
  return data
}

export async function orgAnimals(orgId) {
  const { data } = await http.get(`/orgs/${orgId}/animals`)
  return data
}

export async function carePending() {
  const { data } = await http.get('/care/pending')
  return data
}

export async function pendingForOrg(orgId) {
  const { data } = await http.get(`/orgs/${orgId}/care/pending`)
  return data
}

export async function vetAcceptCare(orgId, linkId) {
  const { data } = await http.post(`/orgs/${orgId}/care/${linkId}/accept`)
  return data
}

export async function requestCare(animalId, payload) {
  const { data } = await http.post(`/animals/${animalId}/care/request`, payload)
  return data
}

export async function approveCare(animalId, linkId) {
  const { data } = await http.post(`/animals/${animalId}/care/${linkId}/approve`)
  return data
}

export async function revokeCare(animalId, linkId) {
  const { data } = await http.post(`/animals/${animalId}/care/${linkId}/revoke`)
  return data
}
