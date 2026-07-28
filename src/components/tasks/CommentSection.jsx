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
import {
  listComments,
  loadMoreComments,
  createComment,
  updateComment,
  deleteComment,
  listCommentTrash,
  loadMoreCommentTrash,
  restoreComment,
  hardDeleteComment,
} from "../../api/comments.js";
import CommentAttachmentSection from "./CommentAttachmentSection.jsx";
import { useConfirm } from "../../confirm/ConfirmContext.jsx";
import { useNotification } from "../../notifications/NotificationContext.jsx";

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
        <Stack direction="row" spacing={1} sx={{ alignItems: "baseline" }}>
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
            <Button size="small" onClick={() => setReplying((v) => !v)} sx={{ minWidth: 0, p: 0 }}>
              Trả lời
            </Button>
          )}
          {isAuthor && !editing && (
            <Button size="small" onClick={() => setEditing(true)} sx={{ minWidth: 0, p: 0 }}>
              Sửa
            </Button>
          )}
          {(isAuthor || isAdmin) && (
            <Button size="small" color="error" onClick={() => onDelete(comment)} sx={{ minWidth: 0, p: 0 }}>
              Xoá
            </Button>
          )}
          {comment.replies.length > 0 && (
            <Button size="small" onClick={() => setShowReplies((v) => !v)} sx={{ minWidth: 0, p: 0 }}>
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
  const confirm = useConfirm();
  const { notifySuccess, notifyError } = useNotification();
  const [comments, setComments] = useState([]);
  // Giữ lại trang đầu riêng để "Thu gọn" quay về ngay không cần gọi lại API.
  const [firstPageComments, setFirstPageComments] = useState([]);
  const [firstPageNext, setFirstPageNext] = useState(null);
  const [commentsNext, setCommentsNext] = useState(null);
  const [loadingMoreComments, setLoadingMoreComments] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newContent, setNewContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [showTrash, setShowTrash] = useState(false);
  const [trash, setTrash] = useState([]);
  const [trashNext, setTrashNext] = useState(null);
  const [trashLoading, setTrashLoading] = useState(false);
  const [trashLoadingMore, setTrashLoadingMore] = useState(false);
  const [busyTrashId, setBusyTrashId] = useState(null);

  useEffect(() => {
    setLoading(true);
    listComments(taskId)
      .then((data) => {
        const firstPage = data.results.filter((c) => c.parent === null);
        setComments(firstPage);
        setFirstPageComments(firstPage);
        setCommentsNext(data.next);
        setFirstPageNext(data.next);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [taskId]);

  const handleLoadMoreComments = () => {
    if (!commentsNext) return;
    setLoadingMoreComments(true);
    loadMoreComments(commentsNext)
      .then((data) => {
        setComments((prev) => prev.concat(data.results.filter((c) => c.parent === null)));
        setCommentsNext(data.next);
      })
      .finally(() => setLoadingMoreComments(false));
  };

  const handleCollapseComments = () => {
    setComments(firstPageComments);
    setCommentsNext(firstPageNext);
  };

  const handleAdd = () => {
    if (!newContent.trim()) return;
    setSubmitting(true);
    setError(null);
    createComment(taskId, { content: newContent })
      .then((created) => {
        setNewContent("");
        // Comment mới luôn là mới nhất (cursor tăng dần) -> nối thẳng vào cuối, không
        // refetch trang 1 (sẽ mất nó nếu task đã có hơn 1 trang comment từ trước).
        // Nối vào cả firstPageComments để "Thu gọn" không làm mất comment vừa tạo
        // (firstPageComments là baseline khi bấm Thu gọn, phải luôn khớp comments trừ
        // phần tải thêm qua "Xem thêm").
        setComments((prev) => prev.concat(created));
        setFirstPageComments((prev) => prev.concat(created));
      })
      .catch((err) => setError(firstError(err)))
      .finally(() => setSubmitting(false));
  };

  const handleReply = (parentId, content, onDone) => {
    if (!content.trim()) return;
    setError(null);
    createComment(taskId, { content, parent: parentId })
      .then((reply) => {
        onDone();
        setComments((prev) => prev.map((c) => (c.id === parentId ? { ...c, replies: c.replies.concat(reply) } : c)));
        setFirstPageComments((prev) =>
          prev.map((c) => (c.id === parentId ? { ...c, replies: c.replies.concat(reply) } : c)),
        );
      })
      .catch((err) => setError(firstError(err)));
  };

  const handleEdit = (comment, content, onDone) => {
    if (!content.trim()) return;
    setError(null);
    updateComment(taskId, comment.id, { content })
      .then((updated) => {
        onDone();
        // reply lồng trong .replies không có field `parent` riêng (ReplySerializer không trả) ->
        // comment.parent === null phân biệt đúng: top-level thì null, reply thì undefined.
        const apply = (prev) =>
          comment.parent === null
            ? prev.map((c) => (c.id === comment.id ? { ...c, ...updated } : c))
            : prev.map((c) => ({
                ...c,
                replies: c.replies.map((r) => (r.id === comment.id ? { ...r, ...updated } : r)),
              }));
        setComments(apply);
        setFirstPageComments(apply);
      })
      .catch((err) => setError(firstError(err)));
  };

  const handleDelete = async (comment) => {
    const ok = await confirm("Xoá bình luận này?");
    if (!ok) return;
    deleteComment(taskId, comment.id)
      .then(() => {
        const apply = (prev) =>
          comment.parent === null
            ? prev.filter((c) => c.id !== comment.id)
            : prev.map((c) => ({ ...c, replies: c.replies.filter((r) => r.id !== comment.id) }));
        setComments(apply);
        setFirstPageComments(apply);
        notifySuccess("Đã xoá bình luận.");
      })
      .catch((err) => notifyError(err.message));
  };

  const reloadTrash = () => {
    setTrashLoading(true);
    listCommentTrash(taskId)
      .then((data) => {
        setTrash(data.results);
        setTrashNext(data.next);
      })
      .finally(() => setTrashLoading(false));
  };

  const handleToggleTrash = () => {
    const next = !showTrash;
    setShowTrash(next);
    if (next) reloadTrash();
  };

  const handleLoadMoreTrash = () => {
    if (!trashNext) return;
    setTrashLoadingMore(true);
    loadMoreCommentTrash(trashNext)
      .then((data) => {
        setTrash((prev) => prev.concat(data.results));
        setTrashNext(data.next);
      })
      .finally(() => setTrashLoadingMore(false));
  };

  const handleRestoreComment = (comment) => {
    setBusyTrashId(comment.id);
    restoreComment(taskId, comment.id)
      .then(() => {
        setTrash((prev) => prev.filter((c) => c.id !== comment.id));
        notifySuccess("Đã khôi phục bình luận.");
      })
      .catch((err) => notifyError(err.message))
      .finally(() => setBusyTrashId(null));
  };

  const handleHardDeleteComment = async (comment) => {
    const ok = await confirm("Xoá vĩnh viễn bình luận này? Không thể hoàn tác.");
    if (!ok) return;
    setBusyTrashId(comment.id);
    hardDeleteComment(taskId, comment.id)
      .then(() => {
        setTrash((prev) => prev.filter((c) => c.id !== comment.id));
        notifySuccess("Đã xoá vĩnh viễn bình luận.");
      })
      .catch((err) => notifyError(err.message))
      .finally(() => setBusyTrashId(null));
  };

  if (loading) return <CircularProgress size={20} />;

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Typography variant="subtitle1" fontWeight={600}>
          Bình luận ({comments.length})
        </Typography>
        <Button size="small" onClick={handleToggleTrash}>
          {showTrash ? "Ẩn thùng rác" : "Thùng rác"}
        </Button>
      </Stack>

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

      {(commentsNext || comments.length > firstPageComments.length) && (
        <Stack direction="row" spacing={1} sx={{ justifyContent: "center", mt: 2 }}>
          {commentsNext && (
            <Button
              variant="outlined"
              onClick={handleLoadMoreComments}
              disabled={loadingMoreComments}
            >
              {loadingMoreComments ? "Đang tải..." : "Xem thêm bình luận"}
            </Button>
          )}
          {comments.length > firstPageComments.length && (
            <Button variant="outlined" color="inherit" onClick={handleCollapseComments}>
              Thu gọn
            </Button>
          )}
        </Stack>
      )}

      {showTrash && (
        <Stack spacing={1.5} sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: "divider" }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            Thùng rác
          </Typography>
          {trashLoading ? (
            <CircularProgress size={18} />
          ) : trash.length === 0 ? (
            <Typography variant="caption" color="text.secondary">
              Không có bình luận nào trong thùng rác.
            </Typography>
          ) : (
            trash.map((comment) => (
              <Stack key={comment.id} direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
                <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                  {authorName(comment.user).charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "baseline" }}>
                    <Typography variant="body2" fontWeight={600}>
                      {authorName(comment.user)}
                    </Typography>
                    {comment.parent !== null && (
                      <Typography variant="caption" color="text.secondary">
                        (trả lời)
                      </Typography>
                    )}
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
                    {comment.content}
                  </Typography>
                  {(comment.user.id === currentUserId || isAdmin) && (
                    <Stack direction="row" spacing={1.5} sx={{ mt: 0.5 }}>
                      <Button
                        size="small"
                        disabled={busyTrashId === comment.id}
                        onClick={() => handleRestoreComment(comment)}
                        sx={{ minWidth: 0, p: 0 }}
                      >
                        Khôi phục
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        disabled={busyTrashId === comment.id}
                        onClick={() => handleHardDeleteComment(comment)}
                        sx={{ minWidth: 0, p: 0 }}
                      >
                        Xoá vĩnh viễn
                      </Button>
                    </Stack>
                  )}
                </Box>
              </Stack>
            ))
          )}
          {trashNext && (
            <Stack sx={{ alignItems: "center" }}>
              <Button variant="outlined" onClick={handleLoadMoreTrash} disabled={trashLoadingMore}>
                {trashLoadingMore ? "Đang tải..." : "Xem thêm"}
              </Button>
            </Stack>
          )}
        </Stack>
      )}

      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
        <TextField value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder="Viết bình luận..." multiline fullWidth size="small" />
        <Button variant="contained" onClick={handleAdd} disabled={submitting}>
          Gửi
        </Button>
      </Stack>
    </Paper>
  );
}
