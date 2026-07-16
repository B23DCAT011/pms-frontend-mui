import { useEffect, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { createProject, updateProject } from "../../api/projects.js";

export default function ProjectFormDialog({ open, onClose, project, onSaved }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (project) {
      setName(project.name);
      setDescription(project.description || "");
    } else {
      setName("");
      setDescription("");
    }
    setFieldErrors({});
  }, [open, project]);

  const handleClose = () => {
    setFieldErrors({});
    onClose();
  };

  const handleSubmit = () => {
    setSubmitting(true);
    setFieldErrors({});

    const payload = { name, description };
    const request = project ? updateProject(project.id, payload) : createProject(payload);

    request
      .then((saved) => {
        onSaved(saved);
        handleClose();
      })
      .catch((err) => {
        setFieldErrors(err.errors || {});
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>{project ? "Sửa project" : "Tạo project mới"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Tên project"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
            error={!!fieldErrors.name}
            helperText={fieldErrors.name?.[0]}
          />
          <TextField
            label="Mô tả"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={3}
            error={!!fieldErrors.description}
            helperText={fieldErrors.description?.[0]}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          Huỷ
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
          {project ? "Lưu" : "Tạo"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
