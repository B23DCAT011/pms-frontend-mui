import apiClient from './client.js';

// Trang đầu. Bấm "Xem thêm" thì gọi loadMoreNotifications(data.next) tiếp — backend dùng
// CursorPagination (không có count, không hiểu ?page=), không tự đoán query param tay.
export function listNotifications() {
  return apiClient.get('/notifications/');
}

export function loadMoreNotifications(nextUrl) {
  return apiClient.get(nextUrl);
}

// Số chưa đọc phải hỏi riêng, KHÔNG đếm trong listNotifications(): list dùng CursorPagination
// nên chỉ trả 20 cái mới nhất — đếm trong đó vừa chặn trần ở 20, vừa ra 0 khi 20 cái mới nhất
// đã đọc hết mà cái cũ hơn thì chưa.
export function getUnreadNotificationCount() {
  return apiClient.get('/notifications/unread-count/');
}

export function markNotificationRead(notificationId) {
  return apiClient.post(`/notifications/${notificationId}/mark-read/`);
}

export function markAllNotificationsRead() {
  return apiClient.post('/notifications/mark-all-read/');
}
