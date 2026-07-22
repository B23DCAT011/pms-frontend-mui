import apiClient from './client.js';

// Trang đầu. Bấm "Xem thêm" thì gọi loadMoreActivityLogs(data.next) tiếp — backend dùng
// CursorPagination (không có count, không hiểu ?page=), không tự đoán query param tay.
export function listActivityLogs(projectId) {
  return apiClient.get(`/projects/${projectId}/activity-logs/`);
}

// Riêng log của 1 task (không kèm log của comment/attachment thuộc task đó).
export function listTaskActivityLogs(taskId) {
  return apiClient.get(`/tasks/${taskId}/activity-logs/`);
}

export function loadMoreActivityLogs(nextUrl) {
  return apiClient.get(nextUrl);
}
