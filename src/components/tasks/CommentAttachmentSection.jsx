import { useEffect, useRef, useState } from "react";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import IconButton from "@mui/material/IconButton";
import Alert from "@mui/material/Alert";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import DeleteIcon from "@mui/icons-material/Delete";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import { listAllCommentAttachments, uploadCommentAttachment, deleteCommentAttachment } from "../../api/attachments.js";
import { useConfirm } from "../../confirm/ConfirmContext.jsx";
import { useNotification } from "../../notifications/NotificationContext.jsx";

export default function CommentAttachmentSection({ taskId, commentId, currentUserId, isAdmin, canUpload }) {
  const confirm = useConfirm();
  const { notifySuccess, notifyError } = useNotification();
  const [attachments, setAttachments] = useState([]);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const reload = () => {
    listAllCommentAttachments(taskId, commentId).then(setAttachments);
  };

  useEffect(() => {
    reload();
  }, [taskId, commentId]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    setError(null);
    uploadCommentAttachment(taskId, commentId, file)
      .then(reload)
      .catch((err) => setError(err.errors?.file?.[0] || err.message))
      .finally(() => setUploading(false));
  };

  const handleDelete = async (attachment) => {
    const ok = await confirm(`Xoá file "${attachment.file_name}"?`);
    if (!ok) return;
    deleteCommentAttachment(taskId, commentId, attachment.id)
      .then(() => {
        reload();
        notifySuccess("Đã xoá file.");
      })
      .catch((err) => notifyError(err.message));
  };

  if (attachments.length === 0 && !canUpload) return null;

  return (
    <Stack spacing={0.5} sx={{ mt: 0.5 }}>
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ py: 0 }}>
          {error}
        </Alert>
      )}
      {attachments.map((att) => (
        <Stack key={att.id} direction="row" alignItems="center" spacing={0.5}>
          <InsertDriveFileIcon sx={{ fontSize: 14 }} color="disabled" />
          <Link href={att.file_url} target="_blank" rel="noopener noreferrer" variant="caption" noWrap sx={{ maxWidth: 200 }}>
            {att.file_name}
          </Link>
          {(att.uploaded_by.id === currentUserId || isAdmin) && (
            <IconButton size="small" onClick={() => handleDelete(att)} aria-label="Xoá file">
              <DeleteIcon sx={{ fontSize: 14 }} />
            </IconButton>
          )}
        </Stack>
      ))}
      {canUpload && (
        <>
          <Button
            size="small"
            startIcon={<AttachFileIcon sx={{ fontSize: 14 }} />}
            onClick={() => fileInputRef.current.click()}
            disabled={uploading}
            sx={{ textTransform: "none", minWidth: 0, p: 0, alignSelf: "flex-start" }}
          >
            Đính kèm file
          </Button>
          <input ref={fileInputRef} type="file" hidden onChange={handleFileChange} />
        </>
      )}
    </Stack>
  );
}
