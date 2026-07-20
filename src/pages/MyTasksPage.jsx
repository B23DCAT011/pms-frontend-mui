import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import { useAuth } from "../auth/AuthContext.jsx";
import { listAllMyAssignedTasks } from "../api/tasks.js";
import { listAllMyProjects } from "../api/projects.js";
import MyTaskRow from "../components/tasks/MyTaskRow.jsx";

const GROUPS = [
  { key: "overdue", label: "Quá hạn", color: "error.main" },
  { key: "today", label: "Hôm nay", color: "warning.main" },
  { key: "upcoming", label: "Sắp tới", color: "text.secondary" },
  { key: "none", label: "Không deadline", color: "text.disabled" },
];

export default function MyTasksPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [projectsById, setProjectsById] = useState({});
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState("");
  const [ordering, setOrdering] = useState("-created_at");

  useEffect(() => {
    listAllMyProjects().then((projects) => {
      setProjectsById(Object.fromEntries(projects.map((p) => [p.id, p.name])));
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);
    listAllMyAssignedTasks(user.id, {
      search: debouncedSearch || undefined,
      priority: priority || undefined,
      category: category || undefined,
      ordering,
    })
      .then((results) => {
        if (!ignore) setTasks(results);
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
  }, [user.id, debouncedSearch, priority, category, ordering]);

  // Nhóm theo mức khẩn cấp, độc lập với category (done) — task quá hạn nhưng đã xong
  // vẫn hiện trong "Quá hạn" (chip trạng thái tự nói rõ đã xong), tránh việc task "biến
  // mất" khỏi mọi nhóm nếu chỉ loại theo done như cách Dashboard đang làm.
  const groups = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    const buckets = { overdue: [], today: [], upcoming: [], none: [] };
    for (const task of tasks) {
      if (!task.deadline) {
        buckets.none.push(task);
        continue;
      }
      const deadline = new Date(task.deadline);
      if (deadline < startOfToday) buckets.overdue.push(task);
      else if (deadline < endOfToday) buckets.today.push(task);
      else buckets.upcoming.push(task);
    }
    for (const key of ["overdue", "today", "upcoming"]) {
      buckets[key].sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    }
    return buckets;
  }, [tasks]);

  const goToTask = (task) => navigate(`/projects/${task.project}/tasks/${task.id}`);

  return (
    <>
      <Typography variant="h4" gutterBottom>
        My Tasks
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Toàn bộ task của bạn.
      </Typography>

      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" sx={{ mb: 3 }}>
        <TextField
          label="Tìm kiếm task"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ width: 260 }}
        />
        <FormControl size="small" sx={{ width: 160 }}>
          <InputLabel>Độ ưu tiên</InputLabel>
          <Select label="Độ ưu tiên" value={priority} onChange={(e) => setPriority(e.target.value)}>
            <MenuItem value="">Tất cả</MenuItem>
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ width: 160 }}>
          <InputLabel>Trạng thái</InputLabel>
          <Select label="Trạng thái" value={category} onChange={(e) => setCategory(e.target.value)}>
            <MenuItem value="">Tất cả</MenuItem>
            <MenuItem value="todo">To Do</MenuItem>
            <MenuItem value="in_progress">Đang làm</MenuItem>
            <MenuItem value="done">Hoàn thành</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ width: 160 }}>
          <InputLabel>Sắp xếp</InputLabel>
          <Select label="Sắp xếp" value={ordering} onChange={(e) => setOrdering(e.target.value)}>
            <MenuItem value="-created_at">Mới nhất</MenuItem>
            <MenuItem value="created_at">Cũ nhất</MenuItem>
          </Select>
        </FormControl>
        {loading && <CircularProgress size={20} />}
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      {!error && !loading && tasks.length === 0 && (
        <Typography color="text.secondary">Không có task nào khớp bộ lọc.</Typography>
      )}

      {!error && (
        <Stack spacing={3} sx={{ opacity: loading ? 0.5 : 1, transition: "opacity 0.15s" }}>
          {GROUPS.map(
            ({ key, label, color }) =>
              groups[key].length > 0 && (
                <Box key={key}>
                  <Typography variant="overline" sx={{ color, display: "block", mb: 1 }}>
                    {label} ({groups[key].length})
                  </Typography>
                  <Stack spacing={1}>
                    {groups[key].map((task) => (
                      <MyTaskRow
                        key={task.id}
                        task={task}
                        projectName={projectsById[task.project] || "..."}
                        overdue={key === "overdue"}
                        onClick={() => goToTask(task)}
                      />
                    ))}
                  </Stack>
                </Box>
              ),
          )}
        </Stack>
      )}
    </>
  );
}
