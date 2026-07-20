import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ProjectTrashList from "./ProjectTrashList.jsx";
import TaskTrashList from "./TaskTrashList.jsx";

export default function TrashSection() {
  return (
    <Box sx={{ maxWidth: 720 }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
        Project đã xoá
      </Typography>
      <ProjectTrashList />

      <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 4, mb: 1.5 }}>
        Task đã xoá
      </Typography>
      <TaskTrashList />
    </Box>
  );
}
