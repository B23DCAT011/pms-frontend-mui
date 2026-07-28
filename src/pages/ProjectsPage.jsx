import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import { listProjects, deleteProject } from "../api/projects.js";
import ProjectCard from "../components/projects/ProjectCard.jsx";
import ProjectCardSkeleton from "../components/projects/ProjectCardSkeleton.jsx";
import ProjectFormDialog from "../components/projects/ProjectFormDialog.jsx";
import PageHeader from "../components/layout/PageHeader.jsx";
import EmptyState from "../components/layout/EmptyState.jsx";
import { useConfirm } from "../confirm/ConfirmContext.jsx";
import { useNotification } from "../notifications/NotificationContext.jsx";

const PAGE_SIZE = 9;

export default function ProjectsPage() {
  const confirm = useConfirm();
  const { notifySuccess, notifyError } = useNotification();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);


  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    let ignore = false;

    setLoading(true);
    listProjects({ search: debouncedSearch, page })
      .then((data) => {
        if (!ignore) {
          setProjects(data.results);
          setCount(data.count);
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
  }, [debouncedSearch, page, reloadKey]);

  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const openCreateProject = () => {
    setEditingProject(null);
    setFormDialogOpen(true);
  };

  const openEditProject = (project) => {
    setEditingProject(project);
    setFormDialogOpen(true);
  };

  const handleDeleteProject = async (project) => {
    const ok = await confirm(`Xoá project "${project.name}"?`);
    if (!ok) return;

    deleteProject(project.id)
      .then(() => {
        setReloadKey((k) => k + 1);
        notifySuccess("Đã xoá project.");
      })
      .catch((err) => notifyError(err.message));
  };

  const isEmpty = !loading && projects.length === 0;

  return (
    <>
      <PageHeader
        title="Projects"
        subtitle="Các dự án bạn tạo hoặc đang tham gia."
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateProject}>
            Tạo project
          </Button>
        }
      />

      <TextField
        placeholder="Tìm theo tên hoặc mô tả…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ width: { xs: "100%", sm: 340 }, mb: 3 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="disabled" />
              </InputAdornment>
            ),
            endAdornment: search && (
              <InputAdornment position="end">
                <IconButton size="small" aria-label="Xoá tìm kiếm" onClick={() => setSearch("")}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />

      <ProjectFormDialog
        open={formDialogOpen}
        onClose={() => setFormDialogOpen(false)}
        project={editingProject}
        onSaved={() => {
          setPage(1);
          setReloadKey((k) => k + 1);
        }}
      />

      {error && <Alert severity="error">{error}</Alert>}

      {!error && loading && (
        <Grid container spacing={2}>
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
              <ProjectCardSkeleton />
            </Grid>
          ))}
        </Grid>
      )}

      {!error && isEmpty && debouncedSearch && (
        <EmptyState
          icon={<SearchOffIcon />}
          title="Không tìm thấy project nào"
          description={`Không có project nào khớp với "${debouncedSearch}". Thử từ khoá ngắn hơn hoặc kiểm tra lại chính tả.`}
          action={
            <Button variant="outlined" onClick={() => setSearch("")}>
              Xoá tìm kiếm
            </Button>
          }
        />
      )}

      {!error && isEmpty && !debouncedSearch && (
        <EmptyState
          icon={<FolderOpenIcon />}
          title="Chưa có project nào"
          description="Tạo project đầu tiên để bắt đầu quản lý công việc của nhóm."
          action={
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateProject}>
              Tạo project
            </Button>
          }
        />
      )}

      {!error && !loading && projects.length > 0 && (
        <>
          <Grid container spacing={2}>
            {projects.map((project) => (
              <Grid key={project.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <ProjectCard project={project} onEdit={openEditProject} onDelete={handleDeleteProject} />
              </Grid>
            ))}
          </Grid>

          {pageCount > 1 && (
            <Stack sx={{ alignItems: "center", mt: 4 }}>
              <Pagination count={pageCount} page={page} onChange={(_, value) => setPage(value)} />
            </Stack>
          )}
        </>
      )}
    </>
  );
}
