import { http } from "./axios.js";

export async function followUser({ id }) {
  const response = await http.post(`/connections/${id}`);
  return response.data;
}

export async function unfollowUser({ id }) {
  const response = await http.delete(`/connections/${id}`);
  return response.data;
}

export async function summaryUserConnections({ id }) {
  const response = await http.get(`/connections/summary/${id}`);
  return response.data;
}

export async function userFollowers({ id, page = 1, perPage = 10 }) {
  const response = await http.get(`/connections/followers/${id}`);
  return response.data;
}

export async function userFolloweds({ id, page = 1, perPage = 10 }) {
  const response = await http.get(`/connections/followeds/${id}`);
  return response.data;
}
