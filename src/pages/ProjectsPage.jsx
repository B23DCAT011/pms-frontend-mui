import { useEffect, useState } from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import { listProjects, deleteProject } from "../api/projects.js";
import ProjectCard from "../components/projects/ProjectCard.jsx";
import ProjectFormDialog from "../components/projects/ProjectFormDialog.jsx";
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

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Projects
      </Typography>

      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <TextField
          label="Tìm kiếm project"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ width: 300 }}
        />

        <Button variant="contained" onClick={openCreateProject}>
          Tạo project
        </Button>

        {loading && <CircularProgress size={20} />}
      </Stack>

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

      {!error && (
        <Box sx={{ opacity: loading ? 0.5 : 1, transition: "opacity 0.15s" }}>
          <Grid container spacing={2}>
            {projects.map((project) => (
              <Grid key={project.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <ProjectCard project={project} onEdit={openEditProject} onDelete={handleDeleteProject} />
              </Grid>
            ))}
          </Grid>

          <Stack alignItems="center" sx={{ mt: 3 }}>
            <Pagination
              count={pageCount}
              page={page}
              onChange={(_, value) => setPage(value)}
              disabled={loading}
            />
          </Stack>
        </Box>
      )}
    </>
  );
}
