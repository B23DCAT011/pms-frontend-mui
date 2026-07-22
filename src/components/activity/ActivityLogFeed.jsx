import { useEffect, useState } from "react";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { listActivityLogs, listTaskActivityLogs, loadMoreActivityLogs } from "../../api/activityLogs.js";

function actorName(actor) {
  if (!actor) return "Người dùng đã xoá";
  return [actor.first_name, actor.last_name].filter(Boolean).join(" ") || actor.username;
}

// Log cũ (tạo trước khi có from_value/to_value) sẽ có cả 2 field = null -> rơi vào
// nhánh mặc định của mỗi verb, không hiện mũi tên từ/đến.
function actionText({ verb, from_value: from, to_value: to, object_repr: repr }) {
  switch (verb) {
    case "status_changed":
      return from && to ? (
        <>
          đã đổi trạng thái <b>{repr}</b>: {from} → {to}
        </>
      ) : (
        <>
          đã đổi trạng thái <b>{repr}</b>
        </>
      );
    case "assigned":
      if (from && to)
        return (
          <>
            đã đổi người đảm nhận <b>{repr}</b>: {from} → {to}
          </>
        );
      if (to)
        return (
          <>
            đã gán <b>{repr}</b> cho {to}
          </>
        );
      if (from)
        return (
          <>
            đã bỏ gán <b>{repr}</b> (trước đó: {from})
          </>
        );
      return (
        <>
          đã gán <b>{repr}</b>
        </>
      );
    case "deleted":
      return (
        <>
          đã xoá <b>{repr}</b>
        </>
      );
    case "created":
    default:
      return (
        <>
          đã tạo <b>{repr}</b>
        </>
      );
  }
}

function LogRow({ log }) {
  const name = actorName(log.actor);
  return (
    <Stack direction="row" spacing={1.5}>
      <Avatar sx={{ width: 28, height: 28, fontSize: 13, flexShrink: 0 }}>{name.charAt(0).toUpperCase()}</Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2">
          <b>{name}</b> {actionText(log)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {new Date(log.created_at).toLocaleString("vi-VN")}
        </Typography>
      </Box>
    </Stack>
  );
}

// scope="project" -> /projects/{id}/activity-logs/ (mọi task/comment/attachment trong project)
// scope="task"    -> /tasks/{id}/activity-logs/ (riêng log của task đó)
export default function ActivityLogFeed({ scope, id }) {
  const [logs, setLogs] = useState([]);
  // Giữ lại trang đầu riêng để "Thu gọn" quay về ngay không cần gọi lại API.
  const [firstPageLogs, setFirstPageLogs] = useState([]);
  const [firstPageNext, setFirstPageNext] = useState(null);
  const [logsNext, setLogsNext] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    const fetchFirstPage = scope === "task" ? listTaskActivityLogs(id) : listActivityLogs(id);
    fetchFirstPage
      .then((data) => {
        if (ignore) return;
        setLogs(data.results);
        setFirstPageLogs(data.results);
        setLogsNext(data.next);
        setFirstPageNext(data.next);
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
  }, [scope, id]);

  const handleLoadMore = () => {
    if (!logsNext) return;
    setLoadingMore(true);
    loadMoreActivityLogs(logsNext)
      .then((data) => {
        setLogs((prev) => prev.concat(data.results));
        setLogsNext(data.next);
      })
      .finally(() => setLoadingMore(false));
  };

  const handleCollapse = () => {
    setLogs(firstPageLogs);
    setLogsNext(firstPageNext);
  };

  if (loading) return <CircularProgress size={20} />;
  if (error)
    return (
      <Typography variant="caption" color="error">
        {error}
      </Typography>
    );

  return (
    <>
      <Stack spacing={1.5}>
        {logs.map((log) => (
          <LogRow key={log.id} log={log} />
        ))}
        {logs.length === 0 && (
          <Typography variant="caption" color="text.secondary">
            Chưa có hoạt động nào.
          </Typography>
        )}
      </Stack>

      {(logsNext || logs.length > firstPageLogs.length) && (
        <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 2 }}>
          {logsNext && (
            <Button
              size="small"
              variant="outlined"
              onClick={handleLoadMore}
              disabled={loadingMore}
              sx={{ textTransform: "none" }}
            >
              {loadingMore ? "Đang tải..." : "Xem thêm"}
            </Button>
          )}
          {logs.length > firstPageLogs.length && (
            <Button size="small" variant="outlined" color="inherit" onClick={handleCollapse} sx={{ textTransform: "none" }}>
              Thu gọn
            </Button>
          )}
        </Stack>
      )}
    </>
  );
}
