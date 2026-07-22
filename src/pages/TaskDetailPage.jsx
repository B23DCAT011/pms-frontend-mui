import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import { alpha } from "@mui/material/styles";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AddIcon from "@mui/icons-material/Add";
import { useAuth } from "../auth/AuthContext.jsx";
import { getProject } from "../api/projects.js";
import { listTaskStatuses } from "../api/taskStatuses.js";
import { getTask } from "../api/tasks.js";
import { PRIORITY_COLOR, PRIORITY_LABEL } from "../constants/taskPriority.js";
import TaskFormDialog from "../components/projects/TaskFormDialog.jsx";
import CommentSection from "../components/tasks/CommentSection.jsx";
import TaskAttachmentSection from "../components/tasks/TaskAttachmentSection.jsx";
import ActivityLogButton from "../components/activity/ActivityLogButton.jsx";

export default function TaskDetailPage() {
  const { projectId, taskId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [project, setProject] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [subtaskDialogOpen, setSubtaskDialogOpen] = useState(false);
  const [ancestors, setAncestors] = useState([]);

  useEffect(() => {
    let ignore = false;

    setLoading(true);
    Promise.all([getTask(taskId), getProject(projectId), listTaskStatuses(projectId)])
      .then(([taskData, projectData, statusesData]) => {
        if (!ignore) {
          setTask(taskData);
          setProject(projectData);
          setStatuses(statusesData.results);
        }
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
  }, [taskId, projectId]);

  useEffect(() => {
    if (!task?.parent) {
      setAncestors([]);
      return;
    }
    let ignore = false;
    (async () => {
      const chain = [];
      let parentId = task.parent;
      while (parentId) {
        const parentTask = await getTask(parentId);
        chain.unshift({ id: parentTask.id, title: parentTask.title });
        parentId = parentTask.parent;
      }
      if (!ignore) setAncestors(chain);
    })();
    return () => {
      ignore = true;
    };
  }, [task?.parent]);

  const reloadTask = () => {
    getTask(taskId)
      .then(setTask)
      .catch(() => {
        if (task?.parent) {
          navigate(`/projects/${projectId}/tasks/${task.parent}`);
        } else {
          navigate(`/projects/${projectId}`);
        }
      });
  };

  const sortedStatuses = useMemo(() => [...statuses].sort((a, b) => a.position - b.position), [statuses]);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  const isAdmin = project.members?.some((m) => m.user.id === user.id && m.role === "admin");
  const assignedTo = task.assigned_to;
  const assigneeName = assignedTo
    ? [assignedTo.first_name, assignedTo.last_name].filter(Boolean).join(" ") || assignedTo.username
    : "Chưa có người đảm nhận";
  const canUpload = isAdmin || task.assigned_to?.id === user.id;

  return (
    <>
      <Breadcrumbs sx={{ mb: 1 }}>
        <Link component={RouterLink} to="/projects" underline="hover" color="text.secondary" sx={{ fontSize: 14 }}>
          Projects
        </Link>
        <Link component={RouterLink} to={`/projects/${projectId}`} underline="hover" color="text.secondary" sx={{ fontSize: 14 }}>
          {project.name}
        </Link>
        {ancestors.map((a) => (
          <Link
            key={a.id}
            component={RouterLink}
            to={`/projects/${projectId}/tasks/${a.id}`}
            underline="hover"
            color="text.secondary"
            sx={{ fontSize: 14 }}
          >
            {a.title}
          </Link>
        ))}
        <Typography color="text.primary" sx={{ fontSize: 14 }}>
          {task.title}
        </Typography>
      </Breadcrumbs>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
        <Typography variant="h4">{task.title}</Typography>
        {isAdmin && (
          <Button variant="outlined" onClick={() => setEditDialogOpen(true)}>
            Sửa
          </Button>
        )}
      </Box>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={3} flexWrap="wrap" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Trạng thái
            </Typography>
            <Typography variant="body2">{task.status.name}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Độ ưu tiên
            </Typography>
            <Box>
              <Chip
                label={PRIORITY_LABEL[task.priority]}
                size="small"
                sx={{
                  fontWeight: 600,
                  bgcolor: (theme) => alpha(theme.palette[PRIORITY_COLOR[task.priority]].main, 0.15),
                  color: `${PRIORITY_COLOR[task.priority]}.dark`,
                }}
              />
            </Box>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Hạn chót
            </Typography>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <CalendarTodayIcon sx={{ fontSize: 14 }} color="disabled" />
              <Typography variant="body2">
                {task.deadline ? new Date(task.deadline).toLocaleDateString("vi-VN") : "Không có"}
              </Typography>
            </Stack>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Người đảm nhận
            </Typography>
            <Typography variant="body2">{assigneeName}</Typography>
          </Box>
        </Stack>

        <Typography variant="caption" color="text.secondary">
          Mô tả
        </Typography>
        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
          {task.description || "Không có mô tả."}
        </Typography>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Subtasks ({task.subtasks.length})
          </Typography>
          {isAdmin && (
            <Button size="small" startIcon={<AddIcon />} onClick={() => setSubtaskDialogOpen(true)} sx={{ textTransform: "none" }}>
              Thêm subtask
            </Button>
          )}
        </Box>

        <Stack spacing={1}>
          {task.subtasks.map((subtask) => (
            <Paper
              key={subtask.id}
              variant="outlined"
              sx={{ p: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
              onClick={() => navigate(`/projects/${projectId}/tasks/${subtask.id}`)}
            >
              <Typography variant="body2">{subtask.title}</Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="caption" color="text.secondary">
                  {subtask.status.name}
                </Typography>
                <Chip
                  label={PRIORITY_LABEL[subtask.priority]}
                  size="small"
                  sx={{
                    fontWeight: 600,
                    bgcolor: (theme) => alpha(theme.palette[PRIORITY_COLOR[subtask.priority]].main, 0.15),
                    color: `${PRIORITY_COLOR[subtask.priority]}.dark`,
                  }}
                />
              </Stack>
            </Paper>
          ))}
          {task.subtasks.length === 0 && (
            <Typography variant="caption" color="text.secondary">
              Chưa có subtask.
            </Typography>
          )}
        </Stack>
      </Paper>

      <TaskAttachmentSection taskId={taskId} currentUserId={user.id} isAdmin={isAdmin} canUpload={canUpload} />

      <CommentSection taskId={taskId} currentUserId={user.id} isAdmin={isAdmin} />

      <ActivityLogButton scope="task" id={taskId} />

      {/* Sửa/xoá chính task đang xem — task={task} nên dialog hiện sẵn dữ liệu + nút Xoá */}
      <TaskFormDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        projectId={projectId}
        statuses={sortedStatuses}
        members={project.members ?? []}
        task={task}
        onSaved={reloadTask}
      />
      {/* Tạo subtask mới — không có task, có parentId nên là create + gắn parent = task hiện tại */}
      <TaskFormDialog
        open={subtaskDialogOpen}
        onClose={() => setSubtaskDialogOpen(false)}
        projectId={projectId}
        statuses={sortedStatuses}
        members={project.members ?? []}
        parentId={taskId}
        onSaved={reloadTask}
      />
    </>
  );
}