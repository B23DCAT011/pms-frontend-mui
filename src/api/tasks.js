import apiClient from './client.js';

export function getTask(taskId) {
  return apiClient.get(`/tasks/${taskId}/`);
}

export function listTasks(projectId, page = 1) {
  return apiClient.get("/tasks/", { params: { project: projectId, page } });
}

export async function listAllTasks(projectId) {
  let page = 1;
  let results = [];
  while (true) {
    const data = await listTasks(projectId, page);
    results = results.concat(data.results);
    if (!data.next) break;
    page += 1;
  }
  return results;
}

export function listMyTasks(page = 1) {
  return apiClient.get("/tasks/", { params: { page } });
}

export async function listAllMyTasks() {
  let page = 1;
  let results = [];
  while (true) {
    const data = await listMyTasks(page);
    results = results.concat(data.results);
    if (!data.next) break;
    page += 1;
  }
  return results;
}

export function updateTaskStatus(taskId, statusId) {
  return apiClient.patch(`/tasks/${taskId}/`, { status: statusId });
}

export function createTask(payload) {
  return apiClient.post("/tasks/", payload);
}

export function updateTask(taskId, payload) {
  return apiClient.patch(`/tasks/${taskId}/`, payload);
}

export function deleteTask(taskId) {
  return apiClient.delete(`/tasks/${taskId}/`);
}