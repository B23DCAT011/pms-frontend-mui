import { useEffect, useMemo, useState } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import LinearProgress from "@mui/material/LinearProgress";
import ViewKanbanIcon from "@mui/icons-material/ViewKanban";
import ViewListIcon from "@mui/icons-material/ViewList";
import AddIcon from "@mui/icons-material/Add";
import { useAuth } from "../auth/AuthContext.jsx";
import { getProject, removeProjectMember } from "../api/projects.js";
import { listTaskStatuses, deleteTaskStatus } from "../api/taskStatuses.js";
import { listTasks, loadMoreTasks, getTaskStats, getStatusTaskCount, updateTaskStatus } from "../api/tasks.js";
import KanbanColumn from "../components/projects/KanbanColumn.jsx";
import TaskListView from "../components/projects/TaskListView.jsx";
import MembersPanel from "../components/projects/MembersPanel.jsx";
import PendingApprovalsButton from "../components/projects/PendingApprovalsButton.jsx";
import ActivityLogButton from "../components/activity/ActivityLogButton.jsx";
import TaskFormDialog from "../components/projects/TaskFormDialog.jsx";
import TaskStatusFormDialog from "../components/projects/TaskStatusFormDialog.jsx";
import AddMemberDialog from "../components/projects/AddMemberDialog.jsx";
import { useConfirm } from "../confirm/ConfirmContext.jsx";
import { useNotification } from "../notifications/NotificationContext.jsx";
import useDocumentTitle from "../hooks/useDocumentTitle.js";

// Đếm số task thật của từng status -- tách riêng khỏi việc "đã tải được bao nhiêu"
// (tasksByStatus chỉ phản ánh phần đã tải qua flat list + Xem thêm, không phải tổng thật).
function fetchStatusCounts(projectId, statusList) {
  return Promise.all(statusList.map((s) => getStatusTaskCount(projectId, s.id).then((count) => [s.id, count]))).then(
    Object.fromEntries,
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const confirm = useConfirm();
  const { notifySuccess, notifyError } = useNotification();
  const [project, setProject] = useState(null);
  useDocumentTitle(project?.name);
  const [statuses, setStatuses] = useState([]);
  const [tasks, setTasks] = useState([]);
  // Giữ lại trang đầu riêng để "Thu gọn" quay về ngay không cần gọi lại API.
  const [firstPageTasks, setFirstPageTasks] = useState([]);
  const [firstPageNext, setFirstPageNext] = useState(null);
  const [tasksNext, setTasksNext] = useState(null);
  const [loadingMoreTasks, setLoadingMoreTasks] = useState(false);
  const [taskStats, setTaskStats] = useState({ total: 0, done: 0 });
  const [statusCounts, setStatusCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState("kanban");
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [defaultStatusId, setDefaultStatusId] = useState(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState(null);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Project/status/stats: chỉ tải lại khi ĐỔI PROJECT (id) — không phụ thuộc filter,
  // vì loading ở đây gate cả trang (early return CircularProgress bên dưới), gõ search
  // mà rơi vào effect này sẽ unmount cả trang, ô TextField bị remount mất focus.
  useEffect(() => {
    let ignore = false;

    setLoading(true);
    Promise.all([getProject(id), listTaskStatuses(id), getTaskStats(id)])
      .then(async ([projectData, statusesData, stats]) => {
        if (ignore) return;
        setProject(projectData);
        setStatuses(statusesData.results);
        setTaskStats(stats);

        const counts = await fetchStatusCounts(id, statusesData.results);
        if (!ignore) setStatusCounts(counts);
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

  // Task list: tải lại khi đổi project HOẶC đổi filter — dùng loading riêng
  // (tasksLoading), KHÔNG đụng `loading` của trang để ô search không bị mất focus.
  useEffect(() => {
    let ignore = false;

    setTasksLoading(true);
    listTasks(id, { search: debouncedSearch || undefined, assigned_to: assignedTo || undefined })
      .then((taskPage) => {
        if (ignore) return;
        // task list còn chứa cả subtask (parent != null) như top-level item -> lọc bỏ
        const firstPage = taskPage.results.filter((t) => t.parent === null);
        setTasks(firstPage);
        setFirstPageTasks(firstPage);
        setTasksNext(taskPage.next);
        setFirstPageNext(taskPage.next);
      })
      .catch((err) => {
        if (!ignore) setError(err.message);
      })
      .finally(() => {
        if (!ignore) setTasksLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [id, debouncedSearch, assignedTo]);

  const sortedStatuses = useMemo(() => [...statuses].sort((a, b) => a.position - b.position), [statuses]);

  // Tạo/sửa/xoá task xong thì load lại từ trang đầu -> nếu đang "xem thêm" dở thì
  // phần đã tải thêm bị reset về trang đầu, phải bấm "Xem thêm" lại (đánh đổi chấp nhận được).
  const reloadTasks = () => {
    Promise.all([
      listTasks(id, { search: debouncedSearch || undefined, assigned_to: assignedTo || undefined }),
      getTaskStats(id),
      fetchStatusCounts(id, statuses),
    ]).then(
      ([taskPage, stats, counts]) => {
        const firstPage = taskPage.results.filter((t) => t.parent === null);
        setTasks(firstPage);
        setFirstPageTasks(firstPage);
        setTasksNext(taskPage.next);
        setFirstPageNext(taskPage.next);
        setTaskStats(stats);
        setStatusCounts(counts);
      },
    );
  };

  const handleLoadMoreTasks = () => {
    if (!tasksNext) return;
    setLoadingMoreTasks(true);
    loadMoreTasks(tasksNext)
      .then((data) => {
        setTasks((prev) => prev.concat(data.results.filter((t) => t.parent === null)));
        setTasksNext(data.next);
      })
      .finally(() => setLoadingMoreTasks(false));
  };

  const handleCollapseTasks = () => {
    setTasks(firstPageTasks);
    setTasksNext(firstPageNext);
  };

  const reloadStatuses = () => {
    listTaskStatuses(id).then((data) => {
      setStatuses(data.results);
      // cột vừa tạo chưa có count -> tự đếm (rỗng); cột cũ giữ nguyên, không đụng vào.
      const missing = data.results.filter((s) => !(s.id in statusCounts));
      if (missing.length === 0) return;
      fetchStatusCounts(id, missing).then((counts) => {
        setStatusCounts((prev) => ({ ...prev, ...counts }));
      });
    });
  };

  const handleDeleteStatus = async (status) => {
    const ok = await confirm(`Xoá cột "${status.name}"?`);
    if (!ok) return;

    deleteTaskStatus(status.id)
      .then(() => {
        reloadStatuses();
        notifySuccess("Đã xoá cột.");
      })
      .catch((err) => notifyError(err.errors?.[0] || err.message));
  };

  const reloadProject = () => {
    getProject(id).then(setProject);
  };

  const handleRemoveMember = async (member) => {
    const name = [member.user.first_name, member.user.last_name].filter(Boolean).join(" ") || member.user.username;
    const ok = await confirm(`Xoá "${name}" khỏi dự án?`);
    if (!ok) return;

    removeProjectMember(id, member.user.id)
      .then(() => {
        reloadProject();
        notifySuccess(`Đã xoá "${name}" khỏi dự án.`);
      })
      .catch((err) => notifyError(err.errors?.user_id?.[0] || err.message));
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

  // Dùng taskStats (count thật từ backend) chứ không phải tasks.length -- tasks chỉ chứa
  // phần đã "Xem thêm" tới hiện tại, không phải tổng số task thật của project.
  const progress = taskStats.total > 0 ? Math.round((taskStats.done / taskStats.total) * 100) : 0;
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

    const sourceStatusId = task.status.id;
    const wasDone = task.status.category === "done";
    const willBeDone = targetStatus.category === "done";

    const previousTasks = tasks;
    const previousCounts = statusCounts;
    const previousStats = taskStats;
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t)));
    setStatusCounts((prev) => ({
      ...prev,
      [sourceStatusId]: (prev[sourceStatusId] ?? 1) - 1,
      [targetStatusId]: (prev[targetStatusId] ?? 0) + 1,
    }));
    // Progress bar dùng taskStats.done, không tự suy ra từ statusCounts -- phải cập nhật
    // riêng, chỉ đổi khi chuyển qua lại giữa "done" và "không done" (đổi cột trong cùng
    // loại category thì tỉ lệ hoàn thành không đổi).
    if (wasDone !== willBeDone) {
      setTaskStats((prev) => ({ ...prev, done: prev.done + (willBeDone ? 1 : -1) }));
    }

    updateTaskStatus(taskId, targetStatus.id).catch(() => {
      setTasks(previousTasks);
      setStatusCounts(previousCounts);
      setTaskStats(previousStats);
      notifyError("Không đổi được status, thử lại sau.");
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
          <Typography color="text.secondary" fontStyle={project.description ? "normal" : "italic"}>
            {project.description || "Chưa có mô tả cho dự án này."}
          </Typography>
        </Box>

        <Stack spacing={1} sx={{ alignItems: "flex-end" }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            {isAdmin && <PendingApprovalsButton projectId={id} onChanged={reloadTasks} />}
            <Stack
              direction="row"
              spacing={0.5}
              sx={{ border: 1, borderColor: "divider", borderRadius: "20px", p: 0.5 }}
            >
              <Button
                size="small"
                variant={view === "kanban" ? "contained" : "text"}
                color={view === "kanban" ? "primary" : "inherit"}
                onClick={() => setView("kanban")}
                startIcon={<ViewKanbanIcon fontSize="small" />}
                sx={{ borderRadius: "16px" }}
              >
                Kanban
              </Button>
              <Button
                size="small"
                variant={view === "list" ? "contained" : "text"}
                color={view === "list" ? "primary" : "inherit"}
                onClick={() => setView("list")}
                startIcon={<ViewListIcon fontSize="small" />}
                sx={{ borderRadius: "16px" }}
              >
                List
              </Button>
            </Stack>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              disabled={!isAdmin || sortedStatuses.length === 0}
              onClick={() => openCreateTask(null)}
            >
              Tạo task
            </Button>
          </Stack>

          <MembersPanel
            members={project.members ?? []}
            canEdit={isAdmin}
            currentUserId={user.id}
            onRemoveMember={handleRemoveMember}
            onAddMember={() => setMemberDialogOpen(true)}
          />
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
            bgcolor: "action.hover",
            "& .MuiLinearProgress-bar": { borderRadius: 4 },
          }}
        />
        <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
          <Typography variant="body2" color="text.secondary">
            Tiến độ
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {progress}% hoàn thành ({taskStats.done}/{taskStats.total})
          </Typography>
        </Box>
      </Box>

      <Stack direction="row" spacing={2} sx={{ alignItems: "center", flexWrap: "wrap", mb: 2 }}>
        <TextField
          label="Tìm kiếm task"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ width: 240 }}
        />
        <FormControl size="small" sx={{ width: 200 }}>
          <InputLabel>Người đảm nhận</InputLabel>
          <Select label="Người đảm nhận" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
            <MenuItem value="">Tất cả</MenuItem>
            {(project.members ?? []).map((m) => (
              <MenuItem key={m.user.id} value={m.user.id}>
                {[m.user.first_name, m.user.last_name].filter(Boolean).join(" ") || m.user.username}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {tasksLoading && <CircularProgress size={20} />}
      </Stack>

      <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
        <Box sx={{ flex: 1, minWidth: 0, opacity: tasksLoading ? 0.6 : 1, transition: "opacity 0.15s" }}>
          {view === "kanban" ? (
            <Box sx={{ display: "flex", gap: 2, overflowX: "auto", alignItems: "stretch", pb: 1 }}>
              {sortedStatuses.map((status) => (
                <Box key={status.id} sx={{ width: 280, flexShrink: 0 }}>
                  <KanbanColumn
                    label={status.name}
                    category={status.category}
                    tasks={tasksByStatus[status.id] ?? []}
                    totalCount={statusCounts[status.id] ?? 0}
                    onDropTask={(taskId) => handleDropTask(status.id, taskId)}
                    canEdit={isAdmin}
                    onAddTask={() => openCreateTask(status.id)}
                    taskTo={(task) => `/projects/${id}/tasks/${task.id}`}
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
                  sx={{ borderStyle: "dashed", py: 1.5 }}
                >
                  Thêm cột
                </Button>
              </Box>
            </Box>
          ) : (
            <TaskListView tasks={tasks} />
          )}

          {(tasksNext || tasks.length > firstPageTasks.length) && (
            <Box sx={{ display: "flex", justifyContent: "center", gap: 1, mt: 2 }}>
              {tasksNext && (
                <Button
                  variant="outlined"
                  onClick={handleLoadMoreTasks}
                  disabled={loadingMoreTasks}
                >
                  {loadingMoreTasks ? "Đang tải..." : "Xem thêm task"}
                </Button>
              )}
              {tasks.length > firstPageTasks.length && (
                <Button variant="outlined" color="inherit" onClick={handleCollapseTasks}>
                  Thu gọn
                </Button>
              )}
            </Box>
          )}
        </Box>
      </Stack>

      <ActivityLogButton scope="project" id={id} />

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
