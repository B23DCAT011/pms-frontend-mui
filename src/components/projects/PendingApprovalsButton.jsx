import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import CircularProgress from "@mui/material/CircularProgress";
import CloseIcon from "@mui/icons-material/Close";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import { listSubmittedTasks, approveTask, rejectTask } from "../../api/tasks.js";
import { useNotification } from "../../notifications/NotificationContext.jsx";

// Admin-only: 1 ô bấm vào mở Drawer liệt kê task đang chờ duyệt (submitted_at != null)
// của đúng project này, duyệt/từ chối ngay tại chỗ — không cần vào từng task detail.
// Drawer không keepMounted -> mỗi lần mở lại tự remount, tự fetch lại danh sách mới nhất.
export default function PendingApprovalsButton({ projectId, onChanged }) {
  const navigate = useNavigate();
  const { notifySuccess, notifyError } = useNotification();
  const [open, setOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    setLoading(true);
    listSubmittedTasks(projectId)
      .then((data) => setTasks(data.results))
      .finally(() => setLoading(false));
  };

  const handleOpen = () => {
    setOpen(true);
    load();
  };

  const handleAction = (task, action) => {
    setBusyId(task.id);
    action(task.id)
      .then((res) => {
        setTasks((prev) => prev.filter((t) => t.id !== task.id));
        notifySuccess(res.detail);
        onChanged?.();
      })
      .catch((err) => notifyError(err.message))
      .finally(() => setBusyId(null));
  };

  return (
    <>
      <Button
        variant="outlined"
        color="warning"
        startIcon={<PendingActionsIcon fontSize="small" />}
        onClick={handleOpen}
      >
        Yêu cầu duyệt
      </Button>

      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
        <Box sx={{ width: 360, p: 2 }}>
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6">Yêu cầu duyệt</Typography>
            <IconButton size="small" onClick={() => setOpen(false)} aria-label="Đóng">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>

          {loading ? (
            <CircularProgress size={20} />
          ) : tasks.length === 0 ? (
            <Typography color="text.secondary">Không có task nào đang chờ duyệt.</Typography>
          ) : (
            <Stack spacing={1.5}>
              {tasks.map((task) => {
                const assignedTo = task.assigned_to;
                const assigneeName = assignedTo
                  ? [assignedTo.first_name, assignedTo.last_name].filter(Boolean).join(" ") || assignedTo.username
                  : "Chưa có người đảm nhận";
                return (
                  <Paper
                    key={task.id}
                    variant="outlined"
                    sx={{ p: 1.5, cursor: "pointer" }}
                    onClick={() => {
                      setOpen(false);
                      navigate(`/projects/${projectId}/tasks/${task.id}`);
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight={600} noWrap>
                      {task.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Nộp bởi {assigneeName}
                    </Typography>
                    {/* stopPropagation để bấm nút không kích hoạt luôn onClick điều hướng của Paper cha */}
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }} onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        disabled={busyId === task.id}
                        onClick={() => handleAction(task, approveTask)}
                      >
                        Duyệt
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        disabled={busyId === task.id}
                        onClick={() => handleAction(task, rejectTask)}
                      >
                        Từ chối
                      </Button>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          )}
        </Box>
      </Drawer>
    </>
  );
}
