import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Pagination from "@mui/material/Pagination";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import { listMyComments } from "../../api/comments.js";

// PAGE_SIZE khớp `PAGE_SIZE` mặc định của PageNumberPagination bên backend
// (config/settings/base.py) — chỉ dùng để tính pageCount, không gửi lên server.
const PAGE_SIZE = 9;

export default function CommentHistorySection() {
  const navigate = useNavigate();
  const [comments, setComments] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);
    listMyComments(page)
      .then((data) => {
        if (ignore) return;
        setComments(data.results);
        setCount(data.count);
      })
      .catch((err) => {
        if (!ignore) setError(err.message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [page]);

  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const goToComment = (comment) => navigate(`/projects/${comment.project_id}/tasks/${comment.task}`);

  if (loading) return <CircularProgress size={24} />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ maxWidth: 720 }}>
      {comments.length === 0 ? (
        <Typography color="text.secondary">Bạn chưa viết bình luận nào.</Typography>
      ) : (
        <Stack spacing={1.5}>
          {comments.map((comment) => (
            <Paper
              key={comment.id}
              variant="outlined"
              onClick={() => goToComment(comment)}
              sx={{ p: 2, cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}
            >
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
                <Chip label={comment.project_name} size="small" variant="outlined" />
                <Typography variant="body2" color="text.secondary" noWrap>
                  {comment.task_title}
                </Typography>
              </Stack>

              <Typography
                variant="body2"
                sx={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {comment.content}
              </Typography>

              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
                {new Date(comment.created_at).toLocaleString("vi-VN")}
              </Typography>
            </Paper>
          ))}
        </Stack>
      )}

      {pageCount > 1 && (
        <Stack alignItems="center" sx={{ mt: 3 }}>
          <Pagination count={pageCount} page={page} onChange={(_, value) => setPage(value)} disabled={loading} />
        </Stack>
      )}
    </Box>
  );
}
