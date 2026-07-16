import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import ViewKanbanIcon from "@mui/icons-material/ViewKanban";
import ViewListIcon from "@mui/icons-material/ViewList";
import AddIcon from "@mui/icons-material/Add";
import { useAuth } from "../auth/AuthContext.jsx";
import { getProject, removeProjectMember } from "../api/projects.js";
import { listTaskStatuses, deleteTaskStatus } from "../api/taskStatuses.js";
import { listAllTasks, updateTaskStatus } from "../api/tasks.js";
import KanbanColumn from "../components/projects/KanbanColumn.jsx";
import TaskListView from "../components/projects/TaskListView.jsx";
import MembersPanel from "../components/projects/MembersPanel.jsx";
import TaskFormDialog from "../components/projects/TaskFormDialog.jsx";
import TaskStatusFormDialog from "../components/projects/TaskStatusFormDialog.jsx";
import AddMemberDialog from "../components/projects/AddMemberDialog.jsx";

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dragError, setDragError] = useState(null);
  const [statusError, setStatusError] = useState(null);
  const [view, setView] = useState("kanban");
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [defaultStatusId, setDefaultStatusId] = useState(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState(null);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [memberError, setMemberError] = useState(null);

  useEffect(() => {
    let ignore = false;

    setLoading(true);
    Promise.all([getProject(id), listTaskStatuses(id), listAllTasks(id)])
      .then(([projectData, statusesData, allTasks]) => {
        if (!ignore) {
          setProject(projectData);
          setStatuses(statusesData.results);
          // task list còn chứa cả subtask (parent != null) như top-level item -> lọc bỏ
          setTasks(allTasks.filter((t) => t.parent === null));
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
  }, [id]);

  const sortedStatuses = useMemo(() => [...statuses].sort((a, b) => a.position - b.position), [statuses]);

  const reloadTasks = () => {
    listAllTasks(id).then((allTasks) => {
      setTasks(allTasks.filter((t) => t.parent === null));
    });
  };

  const reloadStatuses = () => {
    listTaskStatuses(id).then((data) => setStatuses(data.results));
  };

  const handleDeleteStatus = (status) => {
    if (!window.confirm(`Xoá cột "${status.name}"?`)) return;

    deleteTaskStatus(status.id)
      .then(reloadStatuses)
      .catch((err) => setStatusError(err.errors?.[0] || err.message));
  };

  const reloadProject = () => {
    getProject(id).then(setProject);
  };

  const handleRemoveMember = (member) => {
    const name = [member.user.first_name, member.user.last_name].filter(Boolean).join(" ") || member.user.username;
    if (!window.confirm(`Xoá "${name}" khỏi dự án?`)) return;

    removeProjectMember(id, member.user.id)
      .then(reloadProject)
      .catch((err) => setMemberError(err.errors?.user_id?.[0] || err.message));
  };

  const tasksByStatus = useMemo(() => {
    const grouped = {};
    for (const task of tasks) {
      (grouped[task.status.id] ??= []).push(task);
    }
    return grouped;
  }, [tasks]);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  const doneCount = tasks.filter((t) => t.status.category === "done").length;
  const progress = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;
  const isAdmin = project.members?.some((m) => m.user.id === user.id && m.role === "admin");

  const openCreateTask = (statusId) => {
    setDefaultStatusId(statusId);
    setTaskDialogOpen(true);
  };

  const openCreateStatus = () => {
    setEditingStatus(null);
    setStatusDialogOpen(true);
  };

  const openEditStatus = (status) => {
    setEditingStatus(status);
    setStatusDialogOpen(true);
  }

  const handleDropTask = (targetStatusId, taskId) => {
    const targetStatus = statuses.find((s) => s.id === targetStatusId);
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !targetStatus || task.status.id === targetStatus.id) return;

    const previousTasks = tasks;
    setDragError(null);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t)));

    updateTaskStatus(taskId, targetStatus.id).catch(() => {
      setTasks(previousTasks);
      setDragError("Không đổi được status, thử lại sau.");
    });
  };

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%", mb: 2 }}>
        <Box>
          <Link
            component={RouterLink}
            to="/projects"
            underline="hover"
            color="text.secondary"
            sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, mb: 0.5, fontSize: 14 }}
          >
            <ArrowBackIcon sx={{ fontSize: 16 }} />
            Projects
          </Link>
          <Typography variant="h4" gutterBottom>
            {project.name}
          </Typography>
          <Typography color="text.secondary">{project.description}</Typography>
        </Box>

        <Stack direction="row" spacing={0.5} sx={{ border: 1, borderColor: "divider", borderRadius: "20px", p: 0.5 }}>
          <Button
            size="small"
            variant={view === "kanban" ? "contained" : "text"}
            color={view === "kanban" ? "primary" : "inherit"}
            onClick={() => setView("kanban")}
            startIcon={<ViewKanbanIcon fontSize="small" />}
            sx={{ borderRadius: "16px", textTransform: "none" }}
          >
            Kanban
          </Button>
          <Button
            size="small"
            variant={view === "list" ? "contained" : "text"}
            color={view === "list" ? "primary" : "inherit"}
            onClick={() => setView("list")}
            startIcon={<ViewListIcon fontSize="small" />}
            sx={{ borderRadius: "16px", textTransform: "none" }}
          >
            List
          </Button>
        </Stack>
      </Box>

      <Box sx={{ width: "100%", mb: 2 }}>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 8,
            borderRadius: 4,
            mb: 0.5,
            bgcolor: "grey.200",
            "& .MuiLinearProgress-bar": { borderRadius: 4 },
          }}
        />
        <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
          <Typography variant="body2" color="text.secondary">
            Tiến độ
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {progress}% hoàn thành ({doneCount}/{tasks.length})
          </Typography>
        </Box>
      </Box>

      {dragError && (
        <Alert severity="error" onClose={() => setDragError(null)} sx={{ mb: 2 }}>
          {dragError}
        </Alert>
      )}

      {statusError && (
        <Alert severity="error" onClose={() => setStatusError(null)} sx={{ mb: 2 }}>
          {statusError}
        </Alert>
      )}

      {memberError && (
        <Alert severity="error" onClose={() => setMemberError(null)} sx={{ mb: 2 }}>
          {memberError}
        </Alert>
      )}

      <Stack direction="row" spacing={2} alignItems="flex-start">
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {view === "kanban" ? (
            <Box sx={{ display: "flex", gap: 2, overflowX: "auto", alignItems: "stretch", pb: 1 }}>
              {sortedStatuses.map((status) => (
                <Box key={status.id} sx={{ width: 280, flexShrink: 0 }}>
                  <KanbanColumn
                    label={status.name}
                    category={status.category}
                    tasks={tasksByStatus[status.id] ?? []}
                    onDropTask={(taskId) => handleDropTask(status.id, taskId)}
                    canEdit={isAdmin}
                    onAddTask={() => openCreateTask(status.id)}
                    onOpenTask={(task) => navigate(`/projects/${id}/tasks/${task.id}`)}
                    onEditStatus={() => openEditStatus(status)}
                    onDeleteStatus={() => handleDeleteStatus(status)}
                  />
                </Box>
              ))}

              <Box sx={{ width: 220, flexShrink: 0, alignSelf: "flex-start" }}>
                <Button
                  fullWidth
                  disabled={!isAdmin}
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={openCreateStatus}
                  sx={{ borderStyle: "dashed", textTransform: "none", py: 1.5 }}
                >
                  Thêm cột
                </Button>
              </Box>
            </Box>
          ) : (
            <TaskListView tasks={tasks} />
          )}
        </Box>

        <Stack spacing={1}>
          <MembersPanel
            members={project.members ?? []}
            canEdit={isAdmin}
            currentUserId={user.id}
            onRemoveMember={handleRemoveMember}
          />
          {isAdmin && (
            <Button
              fullWidth
              variant="outlined"
              size="small"
              onClick={() => setMemberDialogOpen(true)}
              sx={{ textTransform: "none" }}
            >
              + Thêm thành viên
            </Button>
          )}
        </Stack>
      </Stack>

      {/* Tạo task mới — chỉ create, không có task để sửa/xoá */}
      <TaskFormDialog
        open={taskDialogOpen}
        onClose={() => setTaskDialogOpen(false)}
        projectId={id}
        statuses={sortedStatuses}
        members={project.members ?? []}
        defaultStatusId={defaultStatusId}
        onSaved={reloadTasks}
      />
      {/* Tạo/sửa 1 cột TaskStatus — status=null là tạo, có status là sửa */}
      <TaskStatusFormDialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        projectId={id}
        status={editingStatus}
        onSaved={reloadStatuses}
      />
      {/* Thêm thành viên — tự search user, loại user đã có sẵn trong project */}
      <AddMemberDialog
        open={memberDialogOpen}
        onClose={() => setMemberDialogOpen(false)}
        projectId={id}
        existingMemberUserIds={(project.members ?? []).map((m) => m.user.id)}
        onSaved={reloadProject}
      />
    </>
  );
}