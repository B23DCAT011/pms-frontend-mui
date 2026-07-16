import apiClient from "./client";

export function searchUsers(search) {
  return apiClient.get("/auth/users/search/", { params: { search } });
}