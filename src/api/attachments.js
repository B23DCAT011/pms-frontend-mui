import apiClient from './client.js';

export function listTaskAttachments(taskId, page = 1) {
  return apiClient.get(`/tasks/${taskId}/attachments/`, { params: { page } });
}

export async function listAllTaskAttachments(taskId) {
  let page = 1;
  let results = [];
  while (true) {
    const data = await listTaskAttachments(taskId, page);
    results = results.concat(data.results);
    if (!data.next) break;
    page += 1;
  }
  return results;
}

export function uploadTaskAttachment(taskId, file) {
  const formData = new FormData();
  formData.append("file", file);
  return apiClient.post(`/tasks/${taskId}/attachments/`, formData);
}

export function deleteTaskAttachment(taskId, attachmentId) {
  return apiClient.delete(`/tasks/${taskId}/attachments/${attachmentId}/`);
}

export function listCommentAttachments(taskId, commentId, page = 1) {
  return apiClient.get(`/tasks/${taskId}/comments/${commentId}/attachments/`, { params: { page } });
}

export async function listAllCommentAttachments(taskId, commentId) {
  let page = 1;
  let results = [];
  while (true) {
    const data = await listCommentAttachments(taskId, commentId, page);
    results = results.concat(data.results);
    if (!data.next) break;
    page += 1;
  }
  return results;
}

export function uploadCommentAttachment(taskId, commentId, file) {
  const formData = new FormData();
  formData.append("file", file);
  return apiClient.post(`/tasks/${taskId}/comments/${commentId}/attachments/`, formData);
}

export function deleteCommentAttachment(taskId, commentId, attachmentId) {
  return apiClient.delete(`/tasks/${taskId}/comments/${commentId}/attachments/${attachmentId}/`);
}