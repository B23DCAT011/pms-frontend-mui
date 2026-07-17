import apiClient from './client.js';

export function getTask(taskId) {
  return apiClient.get(`/tasks/${taskId}/`);
}

// Trang đầu cho Kanban board. Bấm "Xem thêm" thì gọi loadMoreTasks(data.next) tiếp,
// không tự đoán offset/limit tay — server tự tính đúng trong URL `next`.
export function listTasks(projectId) {
  return apiClient.get("/tasks/", { params: { project: projectId } });
}

export function loadMoreTasks(nextUrl) {
  return apiClient.get(nextUrl);
}

// Dashboard cần list đầy đủ (vẽ donut/overdue), không có nút "xem thêm" ở đây.
// Phải follow đúng data.next server trả về (không tự đoán ?page=) vì backend dùng
// LimitOffsetPagination — ?page= không có tác dụng, đoán sai gây vòng lặp vô hạn.
export async function listAllMyTasks() {
  let data = await apiClient.get("/tasks/");
  let results = data.results;
  while (data.next) {
    data = await apiClient.get(data.next);
    results = results.concat(data.results);
  }
  return results;
}

// count trong response pagination là tổng thật (COUNT query DB), không phải số item
// của 1 trang -> limit=1 để payload gần như rỗng, chỉ cần đọc count.
export function getTaskStats(projectId) {
  return Promise.all([
    apiClient.get("/tasks/", { params: { project: projectId, limit: 1 } }),
    apiClient.get("/tasks/", { params: { project: projectId, category: "done", limit: 1 } }),
  ]).then(([total, done]) => ({ total: total.count, done: done.count }));
}

// Đếm số task thật của 1 status (không phụ thuộc đã "Xem thêm" tải được bao nhiêu) —
// dùng cho tiêu đề cột Kanban. limit=1 để payload gần như rỗng, chỉ cần đọc count.
export function getStatusTaskCount(projectId, statusId) {
  return apiClient
    .get("/tasks/", { params: { project: projectId, status: statusId, limit: 1 } })
    .then((data) => data.count);
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
