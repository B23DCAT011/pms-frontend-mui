import { useEffect, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import { PRIORITY_LABEL } from "../../constants/taskPriority.js";
import { createTask, updateTask, deleteTask } from "../../api/tasks.js";

function toDatetimeLocalValue(isoString) {
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function TaskFormDialog({ open, onClose, projectId, statuses, members, defaultStatusId, task, parentId, onSaved }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    if (!open) return;

    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setPriority(task.priority);
      setDeadline(task.deadline ? toDatetimeLocalValue(task.deadline) : "");
      setStatus(task.status.id);
      setAssignedTo(task.assigned_to?.id || "");
    } else {
      setTitle("");
      setDescription("");
      setPriority("medium");
      setDeadline("");
      setStatus(defaultStatusId || statuses[0]?.id || "");
      setAssignedTo("");
    }
    setFieldErrors({});
    setDeleteError(null);
  }, [open, task, defaultStatusId, statuses]);

  const handleClose = () => {
    setFieldErrors({});
    setDeleteError(null);
    onClose();
  };

  const handleDelete = () => {
    if (!window.confirm(`Xoá task "${task.title}"?`)) return;

    setDeleting(true);
    setDeleteError(null);
    deleteTask(task.id)
      .then(() => {
        onSaved();
        handleClose();
      })
      .catch((err) => setDeleteError(err.message))
      .finally(() => setDeleting(false));
  };

  const handleSubmit = () => {
    setSubmitting(true);
    setFieldErrors({});

    const payload = { project: projectId, title, status, priority };
    if (description) payload.description = description;
    if (assignedTo) payload.assigned_to = assignedTo;
    if (deadline) payload.deadline = new Date(deadline).toISOString();
    if (!task && parentId) payload.parent = parentId;

    const request = task ? updateTask(task.id, payload) : createTask(payload);

    request
      .then(() => {
        onSaved();
        handleClose();
      })
      .catch((err) => {
        setFieldErrors(err.errors || {});
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>{task ? "Sửa task" : parentId ? "Tạo subtask mới" : "Tạo task mới"}</DialogTitle>
      <DialogContent>
        {deleteError && (
          <Alert severity="error" onClose={() => setDeleteError(null)} sx={{ mb: 2 }}>
            {deleteError}
          </Alert>
        )}
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Tên task"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
            error={!!fieldErrors.title}
            helperText={fieldErrors.title?.[0]}
          />
          <TextField
            label="Mô tả"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={2}
            error={!!fieldErrors.description}
            helperText={fieldErrors.description?.[0]}
          />

          <Stack direction="row" spacing={2}>
            <TextField
              select
              label="Trạng thái"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              fullWidth
              error={!!fieldErrors.status}
              helperText={fieldErrors.status?.[0]}
            >
              {statuses.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Độ ưu tiên"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              fullWidth
              error={!!fieldErrors.priority}
              helperText={fieldErrors.priority?.[0]}
            >
              {Object.entries(PRIORITY_LABEL).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <TextField
            select
            label="Giao cho (tuỳ chọn)"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            fullWidth
            error={!!fieldErrors.assigned_to}
            helperText={fieldErrors.assigned_to?.[0]}
          >
            <MenuItem value="">— Không giao —</MenuItem>
            {members.map((m) => {
              const name = [m.user.first_name, m.user.last_name].filter(Boolean).join(" ") || m.user.username;
              return (
                <MenuItem key={m.user.id} value={m.user.id}>
                  {name}
                </MenuItem>
              );
            })}
          </TextField>

          <TextField
            label="Hạn chót (tuỳ chọn)"
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
            error={!!fieldErrors.deadline}
            helperText={fieldErrors.deadline?.[0]}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "space-between" }}>
        {task ? (
          <Button color="error" onClick={handleDelete} disabled={deleting || submitting}>
            Xoá
          </Button>
        ) : (
          <Box />
        )}

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button onClick={handleClose} disabled={submitting || deleting}>
            Huỷ
          </Button>
          <Button variant="contained" onClick={handleSubmit} disabled={submitting || deleting}>
            {task ? "Lưu" : "Tạo"}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}