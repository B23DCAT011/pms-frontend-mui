import apiClient from './client.js';

export function getTask(taskId) {
  return apiClient.get(`/tasks/${taskId}/`);
}

// Trang đầu cho Kanban board. Bấm "Xem thêm" thì gọi loadMoreTasks(data.next) tiếp,
// không tự đoán offset/limit tay — server tự tính đúng trong URL `next` (đã mang sẵn
// params lọc/search hiện tại, không cần tự ghép lại).
export function listTasks(projectId, params = {}) {
  return apiClient.get("/tasks/", { params: { project: projectId, ...params } });
}

export function loadMoreTasks(nextUrl) {
  return apiClient.get(nextUrl);
}

// My Tasks: task assign cho 1 user, xuyên suốt mọi project họ tham gia — không truyền
// `project`, backend tự lọc theo project__memberships__user.
function listMyTasks(assignedTo, params = {}) {
  return apiClient.get("/tasks/", { params: { assigned_to: assignedTo, ...params } });
}

// Trang My Tasks không phân trang kiểu "xem thêm" — lấy hết luôn 1 lần, follow `next`
// giống listAllMyTasks() bên dưới.
export async function listAllMyAssignedTasks(assignedTo, params = {}) {
  let data = await listMyTasks(assignedTo, params);
  let results = data.results;
  while (data.next) {
    data = await loadMoreTasks(data.next);
    results = results.concat(data.results);
  }
  return results;
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

// Trang đầu cho Thùng rác (Settings > Thùng rác). Bấm "Xem thêm" thì gọi loadMoreTasks(next)
// tiếp, giống listTasks() ở trên.
export function listTaskTrash() {
  return apiClient.get("/tasks/trash/");
}

export function restoreTask(taskId) {
  return apiClient.post(`/tasks/${taskId}/restore/`);
}

export function hardDeleteTask(taskId) {
  return apiClient.delete(`/tasks/${taskId}/hard-delete/`);
}

// Assignee nộp task chờ admin duyệt.
export function submitTask(taskId) {
  return apiClient.post(`/tasks/${taskId}/submit/`);
}

// Admin duyệt — backend tự chuyển status sang "done".
export function approveTask(taskId) {
  return apiClient.post(`/tasks/${taskId}/approve/`);
}

// Admin từ chối — status giữ nguyên, task về lại trạng thái chưa submit.
export function rejectTask(taskId) {
  return apiClient.post(`/tasks/${taskId}/reject/`);
}

// Admin xem list task đang chờ duyệt trong 1 project — tái dùng filter `submitted`
// (BooleanFilter method-based ở backend, tự đảo thành submitted_at__isnull=False).
export function listSubmittedTasks(projectId) {
  return apiClient.get("/tasks/", { params: { project: projectId, submitted: true } });
}
