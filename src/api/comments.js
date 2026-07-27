import apiClient from './client.js';

// Trang đầu. Bấm "Xem thêm" thì gọi loadMoreComments(data.next) tiếp — không tự đoán
// ?page= (backend dùng CursorPagination, không hiểu page number, đoán sai gây vòng
// lặp vô hạn y hệt tasks.js đã dính trước đó).
export function listComments(taskId) {
  return apiClient.get(`/tasks/${taskId}/comments/`);
}

export function loadMoreComments(nextUrl) {
  return apiClient.get(nextUrl);
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

// Trang đầu cho Thùng rác của comment (trong task detail, không phải Settings — trash
// scope theo task_pk, không có endpoint gộp mọi task). Cùng CursorPagination như
// listComments() -> follow `next`, không tự đoán cursor.
export function listCommentTrash(taskId) {
  return apiClient.get(`/tasks/${taskId}/comments/trash/`);
}

export function loadMoreCommentTrash(nextUrl) {
  return apiClient.get(nextUrl);
}

export function restoreComment(taskId, commentId) {
  return apiClient.post(`/tasks/${taskId}/comments/${commentId}/restore/`);
}

export function hardDeleteComment(taskId, commentId) {
  return apiClient.delete(`/tasks/${taskId}/comments/${commentId}/hard-delete/`);
}

// Lịch sử comment của tôi — endpoint này dùng PageNumberPagination mặc định (page=9,
// khác CursorPagination của listComments() ở trên), nên phân trang kiểu ?page=N thường,
// không phải "xem thêm" theo next.
export function listMyComments(page) {
  return apiClient.get("/tasks/comments/mine/", { params: { page } });
}
