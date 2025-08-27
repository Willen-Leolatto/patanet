import { api } from "./index";

export type Follow = {
  id: string;
  followedId: string;
  followerId: string;
  followed: {
    id: string;
    name: string;
    imageProfile: string;
  };
  follower: {
    id: string;
    name: string;
    imageProfile: string;
  };
};

export type UserProfile = {
  id: string;
  name: string;
  imageProfile: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  followeds: Follow[];
  followers: Follow[];
  _count: {
    followeds: number;
    followers: number;
  };
};

export const getMyProfile = async (): Promise<UserProfile> => {
  const response = await api.get<{ user: UserProfile }>("/profile/me");
  return response.data.user;
};
