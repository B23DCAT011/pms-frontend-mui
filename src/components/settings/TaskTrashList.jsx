import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import { alpha } from "@mui/material/styles";
import { listTaskTrash, loadMoreTasks, restoreTask, hardDeleteTask } from "../../api/tasks.js";
import { listAllMyProjects } from "../../api/projects.js";
import { PRIORITY_COLOR, PRIORITY_LABEL } from "../../constants/taskPriority.js";
import { useConfirm } from "../../confirm/ConfirmContext.jsx";
import { useNotification } from "../../notifications/NotificationContext.jsx";

export default function TaskTrashList({ refreshKey }) {
  const confirm = useConfirm();
  const { notifySuccess, notifyError } = useNotification();
  const [projectsById, setProjectsById] = useState({});
  const [tasks, setTasks] = useState([]);
  const [next, setNext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    listAllMyProjects().then((projects) => {
      setProjectsById(Object.fromEntries(projects.map((p) => [p.id, p.name])));
    });
  }, []);

  const reload = () => {
    setLoading(true);
    setError(null);
    listTaskTrash()
      .then((data) => {
        setTasks(data.results);
        setNext(data.next);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  // refreshKey đổi khi ProjectTrashList vừa restore/hard-delete xong (báo qua TrashSection)
  // — Project restore/hard-delete cascade xuống Task con, phải tải lại để đồng bộ.
  useEffect(reload, [refreshKey]);

  const handleLoadMore = () => {
    if (!next) return;
    setLoadingMore(true);
    loadMoreTasks(next)
      .then((data) => {
        setTasks((prev) => prev.concat(data.results));
        setNext(data.next);
      })
      .finally(() => setLoadingMore(false));
  };

  const handleRestore = (task) => {
    setBusyId(task.id);
    restoreTask(task.id)
      .then(() => {
        setTasks((prev) => prev.filter((t) => t.id !== task.id));
        notifySuccess(`Đã khôi phục task "${task.title}".`);
      })
      .catch((err) => notifyError(err.message))
      .finally(() => setBusyId(null));
  };

  const handleHardDelete = async (task) => {
    const ok = await confirm(`Xoá vĩnh viễn task "${task.title}"? Không thể hoàn tác.`);
    if (!ok) return;
    setBusyId(task.id);
    hardDeleteTask(task.id)
      .then(() => {
        setTasks((prev) => prev.filter((t) => t.id !== task.id));
        notifySuccess(`Đã xoá vĩnh viễn task "${task.title}".`);
      })
      .catch((err) => notifyError(err.message))
      .finally(() => setBusyId(null));
  };

  if (loading) return <CircularProgress size={20} />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      {tasks.length === 0 ? (
        <Typography color="text.secondary">Không có task nào trong thùng rác.</Typography>
      ) : (
        <Stack spacing={1.5}>
          {tasks.map((task) => (
            <Paper key={task.id} variant="outlined" sx={{ p: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                    <Chip label={projectsById[task.project] || "..."} size="small" variant="outlined" />
                    <Chip
                      label={PRIORITY_LABEL[task.priority]}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        bgcolor: (theme) => alpha(theme.palette[PRIORITY_COLOR[task.priority]].main, 0.15),
                        color: `${PRIORITY_COLOR[task.priority]}.dark`,
                      }}
                    />
                  </Stack>
                  <Typography variant="subtitle1" fontWeight={600} noWrap>
                    {task.title}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} flexShrink={0}>
                  <Button
                    size="small"
                    variant="contained"
                    disabled={busyId === task.id}
                    onClick={() => handleRestore(task)}
                  >
                    Khôi phục
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    variant="outlined"
                    disabled={busyId === task.id}
                    onClick={() => handleHardDelete(task)}
                  >
                    Xoá vĩnh viễn
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      {next && (
        <Stack alignItems="center" sx={{ mt: 3 }}>
          <Button variant="outlined" onClick={handleLoadMore} disabled={loadingMore}>
            {loadingMore ? "Đang tải..." : "Xem thêm"}
          </Button>
        </Stack>
      )}
    </Box>
  );
}
