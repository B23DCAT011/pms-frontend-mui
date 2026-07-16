import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import { listAllComments, createComment, updateComment, deleteComment } from "../../api/comments.js";
import CommentAttachmentSection from "./CommentAttachmentSection.jsx";

function firstError(err) {
  return err.errors?.content?.[0] || err.errors?.parent?.[0] || err.errors?.non_field_errors?.[0] || err.message;
}

function authorName(user) {
  return [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username;
}

function CommentRow({ taskId, comment, currentUserId, isAdmin, canReply, onReply, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [replying, setReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [showReplies, setShowReplies] = useState(false);
  const isAuthor = comment.user.id === currentUserId;

  return (
    <Stack direction="row" spacing={1.5}>
      <Avatar sx={{ width: 28, height: 28, fontSize: 13 }}>{authorName(comment.user).charAt(0).toUpperCase()}</Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" spacing={1} alignItems="baseline">
          <Typography variant="body2" fontWeight={600}>
            {authorName(comment.user)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {new Date(comment.created_at).toLocaleString("vi-VN")}
          </Typography>
        </Stack>

        {editing ? (
          <Stack spacing={1} sx={{ mt: 0.5 }}>
            <TextField value={editContent} onChange={(e) => setEditContent(e.target.value)} multiline fullWidth size="small" />
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="contained" onClick={() => onEdit(comment, editContent, () => setEditing(false))}>
                Lưu
              </Button>
              <Button size="small" onClick={() => setEditing(false)}>
                Huỷ
              </Button>
            </Stack>
          </Stack>
        ) : (
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
            {comment.content}
          </Typography>
        )}

        <CommentAttachmentSection
          taskId={taskId}
          commentId={comment.id}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          canUpload={isAuthor}
        />

        <Stack direction="row" spacing={1.5} sx={{ mt: 0.5 }}>
          {canReply && (
            <Button size="small" onClick={() => setReplying((v) => !v)} sx={{ textTransform: "none", minWidth: 0, p: 0 }}>
              Trả lời
            </Button>
          )}
          {isAuthor && !editing && (
            <Button size="small" onClick={() => setEditing(true)} sx={{ textTransform: "none", minWidth: 0, p: 0 }}>
              Sửa
            </Button>
          )}
          {(isAuthor || isAdmin) && (
            <Button size="small" color="error" onClick={() => onDelete(comment)} sx={{ textTransform: "none", minWidth: 0, p: 0 }}>
              Xoá
            </Button>
          )}
          {comment.replies.length > 0 && (
            <Button size="small" onClick={() => setShowReplies((v) => !v)} sx={{ textTransform: "none", minWidth: 0, p: 0 }}>
              {showReplies ? "Ẩn trả lời" : `Xem ${comment.replies.length} trả lời`}
            </Button>
          )}
        </Stack>

        {replying && (
          <Stack spacing={1} sx={{ mt: 1 }}>
            <TextField
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Viết trả lời..."
              multiline
              fullWidth
              size="small"
            />
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="contained"
                onClick={() =>
                  onReply(comment.id, replyContent, () => {
                    setReplyContent("");
                    setReplying(false);
                  })
                }
              >
                Gửi
              </Button>
              <Button size="small" onClick={() => setReplying(false)}>
                Huỷ
              </Button>
            </Stack>
          </Stack>
        )}

        {showReplies && comment.replies.length > 0 && (
          <Stack spacing={1.5} sx={{ mt: 1.5, pl: 2, borderLeft: 2, borderColor: "divider" }}>
            {comment.replies.map((reply) => (
              <CommentRow
                key={reply.id}
                taskId={taskId}
                comment={{ ...reply, replies: [] }}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                canReply={false}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </Stack>
        )}
      </Box>
    </Stack>
  );
}

export default function CommentSection({ taskId, currentUserId, isAdmin }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newContent, setNewContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reloadComments = () => {
    listAllComments(taskId).then((all) => setComments(all.filter((c) => c.parent === null)));
  };

  useEffect(() => {
    setLoading(true);
    listAllComments(taskId)
      .then((all) => setComments(all.filter((c) => c.parent === null)))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [taskId]);

  const handleAdd = () => {
    if (!newContent.trim()) return;
    setSubmitting(true);
    setError(null);
    createComment(taskId, { content: newContent })
      .then(() => {
        setNewContent("");
        reloadComments();
      })
      .catch((err) => setError(firstError(err)))
      .finally(() => setSubmitting(false));
  };

  const handleReply = (parentId, content, onDone) => {
    if (!content.trim()) return;
    setError(null);
    createComment(taskId, { content, parent: parentId })
      .then(() => {
        onDone();
        reloadComments();
      })
      .catch((err) => setError(firstError(err)));
  };

  const handleEdit = (comment, content, onDone) => {
    if (!content.trim()) return;
    setError(null);
    updateComment(taskId, comment.id, { content })
      .then(() => {
        onDone();
        reloadComments();
      })
      .catch((err) => setError(firstError(err)));
  };

  const handleDelete = (comment) => {
    if (!window.confirm("Xoá bình luận này?")) return;
    setError(null);
    deleteComment(taskId, comment.id).then(reloadComments).catch((err) => setError(err.message));
  };

  if (loading) return <CircularProgress size={20} />;

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
        Bình luận ({comments.length})
      </Typography>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack spacing={2}>
        {comments.map((comment) => (
          <CommentRow
            key={comment.id}
            taskId={taskId}
            comment={comment}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            canReply
            onReply={handleReply}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
        {comments.length === 0 && (
          <Typography variant="caption" color="text.secondary">
            Chưa có bình luận nào.
          </Typography>
        )}
      </Stack>

      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
        <TextField value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder="Viết bình luận..." multiline fullWidth size="small" />
        <Button variant="contained" onClick={handleAdd} disabled={submitting}>
          Gửi
        </Button>
      </Stack>
    </Paper>
  );
}
