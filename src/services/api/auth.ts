import { api } from "./index";

export type CreateSessionParams = {
  usernameOrEmail: string;
  password: string;
};

export type CreateSessionResponse = {
  access_token: string;
  refresh_token: string;
};

export const createSession = async (
  params: CreateSessionParams
): Promise<CreateSessionResponse> => {
  const response = await api.post<CreateSessionResponse>("/auth/session", {
    params,
  });
  return response.data;
};
