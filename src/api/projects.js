import apiClient from './client.js';

export function listProjects({ search, page } = {}) {
  return apiClient.get("/projects/", { params: { search, page } });
}

// Cần list đầy đủ (không phân trang) để map project id -> tên cho badge ở My Tasks —
// PageNumberPagination không hiểu "lấy hết", phải tự follow `next` giống listAllMyTasks()
// bên tasks.js.
export async function listAllMyProjects() {
  let data = await apiClient.get("/projects/");
  let results = data.results;
  while (data.next) {
    data = await apiClient.get(data.next);
    results = results.concat(data.results);
  }
  return results;
}

export function createProject(payload) {
  return apiClient.post("/projects/", payload);
}

export function getProject(id) {
  return apiClient.get(`/projects/${id}/`);
}

export function updateProject(projectId, payload) {
  return apiClient.patch(`/projects/${projectId}/`, payload);
}

export function deleteProject(projectId) {
  return apiClient.delete(`/projects/${projectId}/`);
}

export function listProjectMembers(projectId) {
  return apiClient.get(`/projects/${projectId}/members/`);
}

export function addProjectMember(projectId, payload) {
  return apiClient.post(`/projects/${projectId}/members/`, payload);
}

export function removeProjectMember(projectId, userId) {
  return apiClient.delete(`/projects/${projectId}/remove-member/`, { data: { user_id: userId } });
}

export function listProjectTrash(page) {
  return apiClient.get("/projects/trash/", { params: { page } });
}

export function restoreProject(projectId) {
  return apiClient.post(`/projects/${projectId}/restore/`);
}

export function hardDeleteProject(projectId) {
  return apiClient.delete(`/projects/${projectId}/hard-delete/`);
}