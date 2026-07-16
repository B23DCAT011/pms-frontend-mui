import { useEffect, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { createTaskStatus, updateTaskStatus } from "../../api/taskStatuses.js";

const CATEGORY_LABEL = { todo: "To Do", in_progress: "In Progress", done: "Done" };

export default function TaskStatusFormDialog({ open, onClose, projectId, status, onSaved }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("todo");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (status) {
      setName(status.name);
      setCategory(status.category);
    } else {
      setName("");
      setCategory("todo");
    }
    setFieldErrors({});
  }, [open, status]);

  const handleClose = () => {
    setFieldErrors({});
    onClose();
  }

  const handleSubmit = () => {
    setSubmitting(true);
    setFieldErrors({});

    const payload = status ? { name, category } : { project: projectId, name, category };
    const request = status ? updateTaskStatus(status.id, payload) : createTaskStatus(payload);

    request
      .then(() => {
        onSaved();
        handleClose();
      })
      .catch((err) => setFieldErrors(err.errors || {}))
      .finally(() => setSubmitting(false));
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>{status ? "Sửa cột" : "Thêm cột"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Tên cột"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
            error={!!fieldErrors.name}
            helperText={fieldErrors.name?.[0]}
          />
          <TextField
            select
            label="Loại"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            fullWidth
            error={!!fieldErrors.category}
            helperText={fieldErrors.category?.[0]}
          >
            {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          Huỷ
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
          {status ? "Lưu" : "Tạo"}
        </Button>
      </DialogActions>
    </Dialog>
  )
}