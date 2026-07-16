import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import { useNavigate } from "react-router-dom";

export const DASHBOARD_PANEL_HEIGHT = 420;

export default function RecentProjectsList({ projects }) {
  const navigate = useNavigate();

  return (
    <Paper variant="outlined" sx={{ p: 2, height: DASHBOARD_PANEL_HEIGHT, display: "flex", flexDirection: "column" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, flexShrink: 0 }}>
        <Typography variant="h6">Project gần đây</Typography>
        <Button size="small" onClick={() => navigate("/projects")}>
          Xem tất cả
        </Button>
      </Box>

      {projects.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 3 }}>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Bạn chưa có project nào.
          </Typography>
          <Button variant="contained" onClick={() => navigate("/projects")}>
            Tạo project đầu tiên
          </Button>
        </Box>
      ) : (
        <List disablePadding dense sx={{ overflowY: "auto", flex: 1 }}>
          {projects.map((project) => (
            <ListItemButton key={project.id} divider onClick={() => navigate(`/projects/${project.id}`)} sx={{ px: 1 }}>
              <ListItemText primary={project.name} slotProps={{ primary: { noWrap: true } }} />
            </ListItemButton>
          ))}
        </List>
      )}
    </Paper>
  );
}
