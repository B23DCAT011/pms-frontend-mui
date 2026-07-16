import apiClient from './client.js';

export function listComments(taskId, page = 1) {
  return apiClient.get(`/tasks/${taskId}/comments/`, { params: { page } });
}

export async function listAllComments(taskId) {
  let page = 1;
  let results = [];
  while (true) {
    const data = await listComments(taskId, page);
    results = results.concat(data.results);
    if (!data.next) break;
    page += 1;
  }
  return results;
}

export function createComment(taskId, payload) {
  return apiClient.post(`/tasks/${taskId}/comments/`, payload);
}

export function updateComment(taskId, commentId, payload) {
  return apiClient.patch(`/tasks/${taskId}/comments/${commentId}/`, payload);
}

export function deleteComment(taskId, commentId) {
  return apiClient.delete(`/tasks/${taskId}/comments/${commentId}/`);
}