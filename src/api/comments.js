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

// Lịch sử comment của tôi — endpoint này dùng PageNumberPagination mặc định (page=9,
// khác CursorPagination của listComments() ở trên), nên phân trang kiểu ?page=N thường,
// không phải "xem thêm" theo next.
export function listMyComments(page) {
  return apiClient.get("/tasks/comments/mine/", { params: { page } });
}
