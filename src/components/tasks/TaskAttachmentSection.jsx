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
import {
  listAllTaskAttachments,
  uploadTaskAttachment,
  deleteTaskAttachment,
  listAllTaskAttachmentTrash,
  restoreTaskAttachment,
  hardDeleteTaskAttachment,
} from "../../api/attachments.js";
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

  const [showTrash, setShowTrash] = useState(false);
  const [trash, setTrash] = useState([]);
  const [trashLoading, setTrashLoading] = useState(false);
  const [busyTrashId, setBusyTrashId] = useState(null);

  const reload = () => {
    listAllTaskAttachments(taskId).then(setAttachments);
  };

  const reloadTrash = () => {
    setTrashLoading(true);
    listAllTaskAttachmentTrash(taskId)
      .then(setTrash)
      .finally(() => setTrashLoading(false));
  };

  const handleToggleTrash = () => {
    const next = !showTrash;
    setShowTrash(next);
    if (next) reloadTrash();
  };

  const handleRestore = (attachment) => {
    setBusyTrashId(attachment.id);
    restoreTaskAttachment(taskId, attachment.id)
      .then(() => {
        setTrash((prev) => prev.filter((a) => a.id !== attachment.id));
        reload();
        notifySuccess(`Đã khôi phục file "${attachment.file_name}".`);
      })
      .catch((err) => notifyError(err.message))
      .finally(() => setBusyTrashId(null));
  };

  const handleHardDeleteTrash = async (attachment) => {
    const ok = await confirm(`Xoá vĩnh viễn file "${attachment.file_name}"? Không thể hoàn tác.`);
    if (!ok) return;
    setBusyTrashId(attachment.id);
    hardDeleteTaskAttachment(taskId, attachment.id)
      .then(() => {
        setTrash((prev) => prev.filter((a) => a.id !== attachment.id));
        notifySuccess(`Đã xoá vĩnh viễn file "${attachment.file_name}".`);
      })
      .catch((err) => notifyError(err.message))
      .finally(() => setBusyTrashId(null));
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
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Typography variant="subtitle1" fontWeight={600}>
          Tệp đính kèm ({attachments.length})
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button size="small" onClick={handleToggleTrash} sx={{ textTransform: "none" }}>
            {showTrash ? "Ẩn thùng rác" : "Thùng rác"}
          </Button>
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
        </Stack>
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

      {showTrash && (
        <Stack spacing={1} sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: "divider" }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            Thùng rác
          </Typography>
          {trashLoading ? (
            <CircularProgress size={18} />
          ) : trash.length === 0 ? (
            <Typography variant="caption" color="text.secondary">
              Không có file nào trong thùng rác.
            </Typography>
          ) : (
            trash.map((att) => (
              <Stack key={att.id} direction="row" alignItems="center" spacing={1}>
                <InsertDriveFileIcon fontSize="small" color="disabled" />
                <Typography variant="body2" sx={{ flex: 1, minWidth: 0 }} noWrap color="text.secondary">
                  {att.file_name}
                </Typography>
                {(att.uploaded_by.id === currentUserId || isAdmin) && (
                  <>
                    <Button
                      size="small"
                      disabled={busyTrashId === att.id}
                      onClick={() => handleRestore(att)}
                      sx={{ textTransform: "none" }}
                    >
                      Khôi phục
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      disabled={busyTrashId === att.id}
                      onClick={() => handleHardDeleteTrash(att)}
                      sx={{ textTransform: "none" }}
                    >
                      Xoá vĩnh viễn
                    </Button>
                  </>
                )}
              </Stack>
            ))
          )}
        </Stack>
      )}
    </Paper>
  );
}
