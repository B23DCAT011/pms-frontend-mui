import apiClient from './client.js';

export function listTaskStatuses(ProjectId) {
  return apiClient.get("/tasks/statuses/", { params: { project: ProjectId } });
}

export function createTaskStatus(payload) {
  return apiClient.post("/tasks/statuses/", payload);
}

export function updateTaskStatus(statusId, payload) {
  return apiClient.patch(`/tasks/statuses/${statusId}/`, payload);
}

export function deleteTaskStatus(statusId) {
  return apiClient.delete(`/tasks/statuses/${statusId}/`);
}