import { useEffect, useRef, useState } from "react";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import DeleteIcon from "@mui/icons-material/Delete";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import { listAllTaskAttachments, uploadTaskAttachment, deleteTaskAttachment } from "../../api/attachments.js";
import { useConfirm } from "../../confirm/ConfirmContext.jsx";
import { useNotification } from "../../notifications/NotificationContext.jsx";

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function TaskAttachmentSection({ taskId, currentUserId, isAdmin, canUpload }) {
  const confirm = useConfirm();
  const { notifySuccess, notifyError } = useNotification();
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const reload = () => {
    listAllTaskAttachments(taskId).then(setAttachments);
  };

  useEffect(() => {
    setLoading(true);
    listAllTaskAttachments(taskId)
      .then(setAttachments)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [taskId]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    setError(null);
    uploadTaskAttachment(taskId, file)
      .then(reload)
      .catch((err) => setError(err.errors?.file?.[0] || err.message))
      .finally(() => setUploading(false));
  };

  const handleDelete = async (attachment) => {
    const ok = await confirm(`Xoá file "${attachment.file_name}"?`);
    if (!ok) return;
    deleteTaskAttachment(taskId, attachment.id)
      .then(() => {
        reload();
        notifySuccess("Đã xoá file.");
      })
      .catch((err) => notifyError(err.message));
  };

  if (loading) return <CircularProgress size={20} />;

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="subtitle1" fontWeight={600}>
          Tệp đính kèm ({attachments.length})
        </Typography>
        {canUpload && (
          <Button
            size="small"
            startIcon={<AttachFileIcon />}
            onClick={() => fileInputRef.current.click()}
            disabled={uploading}
            sx={{ textTransform: "none" }}
          >
            Tải file lên
          </Button>
        )}
        <input ref={fileInputRef} type="file" hidden onChange={handleFileChange} />
      </Stack>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack spacing={1}>
        {attachments.map((att) => (
          <Stack key={att.id} direction="row" alignItems="center" spacing={1}>
            <InsertDriveFileIcon fontSize="small" color="disabled" />
            <Link href={att.file_url} target="_blank" rel="noopener noreferrer" sx={{ flex: 1, minWidth: 0 }} noWrap>
              {att.file_name}
            </Link>
            <Typography variant="caption" color="text.secondary">
              {formatSize(att.file_size)}
            </Typography>
            {(att.uploaded_by.id === currentUserId || isAdmin) && (
              <IconButton size="small" onClick={() => handleDelete(att)} aria-label="Xoá file">
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Stack>
        ))}
        {attachments.length === 0 && (
          <Typography variant="caption" color="text.secondary">
            Chưa có file đính kèm.
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}
