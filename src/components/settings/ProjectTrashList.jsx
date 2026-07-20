import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Pagination from "@mui/material/Pagination";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import { listProjectTrash, restoreProject, hardDeleteProject } from "../../api/projects.js";
import { useConfirm } from "../../confirm/ConfirmContext.jsx";
import { useNotification } from "../../notifications/NotificationContext.jsx";

// PAGE_SIZE khớp PageNumberPagination mặc định của backend, chỉ dùng để tính pageCount.
const PAGE_SIZE = 9;

export default function ProjectTrashList({ onChange }) {
  const confirm = useConfirm();
  const { notifySuccess, notifyError } = useNotification();
  const [projects, setProjects] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const reload = () => {
    setLoading(true);
    setError(null);
    listProjectTrash(page)
      .then((data) => {
        setProjects(data.results);
        setCount(data.count);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(reload, [page]);

  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const handleRestore = (project) => {
    setBusyId(project.id);
    restoreProject(project.id)
      .then(() => {
        reload();
        // Restore cascade xuống Task con (BaseModel.restore() đối xứng với delete tree) —
        // báo ngược lên TrashSection để TaskTrashList tự tải lại, không thì task vừa được
        // khôi phục theo vẫn còn hiện trong danh sách "Task đã xoá" cho tới khi F5.
        onChange?.();
        notifySuccess(`Đã khôi phục project "${project.name}".`);
      })
      .catch((err) => notifyError(err.message))
      .finally(() => setBusyId(null));
  };

  const handleHardDelete = async (project) => {
    const ok = await confirm(`Xoá vĩnh viễn project "${project.name}"? Không thể hoàn tác.`);
    if (!ok) return;
    setBusyId(project.id);
    hardDeleteProject(project.id)
      .then(() => {
        reload();
        // Hard-delete project cũng cascade xoá thật Task con (FK Task.project on_delete=CASCADE).
        onChange?.();
        notifySuccess(`Đã xoá vĩnh viễn project "${project.name}".`);
      })
      .catch((err) => notifyError(err.message))
      .finally(() => setBusyId(null));
  };

  if (loading) return <CircularProgress size={20} />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      {projects.length === 0 ? (
        <Typography color="text.secondary">Không có project nào trong thùng rác.</Typography>
      ) : (
        <Stack spacing={1.5}>
          {projects.map((project) => (
            <Paper key={project.id} variant="outlined" sx={{ p: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle1" fontWeight={600} noWrap>
                    {project.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {project.description || "Không có mô tả"}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} flexShrink={0}>
                  <Button
                    size="small"
                    variant="contained"
                    disabled={busyId === project.id}
                    onClick={() => handleRestore(project)}
                  >
                    Khôi phục
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    variant="outlined"
                    disabled={busyId === project.id}
                    onClick={() => handleHardDelete(project)}
                  >
                    Xoá vĩnh viễn
                  </Button>
                </Stack>
              </Stack>
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
