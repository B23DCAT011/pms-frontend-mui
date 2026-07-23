import apiClient from './client.js';

// Trang đầu. Bấm "Xem thêm" thì gọi loadMoreNotifications(data.next) tiếp — backend dùng
// CursorPagination (không có count, không hiểu ?page=), không tự đoán query param tay.
export function listNotifications() {
  return apiClient.get('/notifications/');
}

export function loadMoreNotifications(nextUrl) {
  return apiClient.get(nextUrl);
}

export function markNotificationRead(notificationId) {
  return apiClient.post(`/notifications/${notificationId}/mark-read/`);
}

export function markAllNotificationsRead() {
  return apiClient.post('/notifications/mark-all-read/');
}
