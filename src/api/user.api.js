import { http } from "./axios.js";

export async function createUser({ name, image, username, email, password }) {
  const formData = new FormData();
  formData.append("name", name);
  formData.append("image", image);
  formData.append("username", username);
  formData.append("email", email);
  formData.append("password", password);

  const response = await http.post("/users", formData);
  return response.data;
}

export async function updateUser({
  id,
  name,
  about,
  image,
  imageCover,
  username,
  email,
}) {
  const formData = new FormData();

  if (name) {
    formData.append("name", name);
  }

  if (about) {
    formData.append("about", about);
  }

  if (image) {
    formData.append("image", image);
  }

  if (imageCover) {
    formData.append("imageCover", imageCover);
  }

  if (username) {
    formData.append("username", username);
  }
  if (email) {
    formData.append("email", email);
  }

  const response = await http.patch("/users/", formData);
  return response.data;
}

export async function updateUserPassword({ id, currentPassword, newPassword }) {
  const response = await http.patch(`/users/${id}`, {
    currentPassword,
    newPassword,
  });
  return response.data;
}

export async function getMyProfile() {
  const response = await http.get("/users/me");
  return response.data;
}

export async function getUserProfile({ id }) {
  const response = await http.get(`/users/${id}`);
  return response.data;
}

export async function fetchUsersProfile({ query, page = 1, perPage = 10 }) {
  const response = await http.get("/users", {
    params: {
      query,
      page,
      perPage,
    },
  });
  return response.data;
}

export async function removeOwnerAccount() {
  const response = await http.delete("/users");
  return response.data;
}
