// object_repr theo từng verb là dữ liệu khác nhau (title task / tên project) — xem
// apps/core/signals.py + apps/tasks/tasks.py bên backend để rõ verb nào object_repr là gì.
const VERB_LABELS = {
  assigned: (n) => `Bạn được giao task "${n.object_repr}"`,
  invited: (n) => `Lời mời tham gia dự án "${n.object_repr}"`,
  deadline_due: (n) => `Sắp đến hạn: "${n.object_repr}"`,
};

export function notificationLabel(n) {
  const build = VERB_LABELS[n.verb];
  return build ? build(n) : n.object_repr;
}

// invited không có task_id (không trỏ tới task) nên điều hướng riêng sang trang lời mời.
export function notificationTarget(n) {
  if (n.verb === 'invited') return '/invitations';
  if (n.project_id && n.task_id) return `/projects/${n.project_id}/tasks/${n.task_id}`;
  return null;
}
