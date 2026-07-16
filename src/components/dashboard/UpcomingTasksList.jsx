import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Chip from "@mui/material/Chip";
import { alpha } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { PRIORITY_COLOR, PRIORITY_LABEL } from "../../constants/taskPriority.js";
import { DASHBOARD_PANEL_HEIGHT } from "./RecentProjectsList.jsx";

function TaskRow({ task, overdue, onClick }) {
  return (
    <ListItemButton divider onClick={onClick} sx={{ px: 1 }}>
      <ListItemText
        primary={task.title}
        secondary={new Date(task.deadline).toLocaleDateString("vi-VN")}
        slotProps={{ secondary: { color: overdue ? "error.main" : "text.secondary" } }}
      />
      <Chip
        label={PRIORITY_LABEL[task.priority]}
        size="small"
        sx={{
          fontWeight: 600,
          bgcolor: (theme) => alpha(theme.palette[PRIORITY_COLOR[task.priority]].main, 0.15),
          color: `${PRIORITY_COLOR[task.priority]}.dark`,
        }}
      />
    </ListItemButton>
  );
}

export default function UpcomingTasksList({ overdueTasks, upcomingTasks }) {
  const navigate = useNavigate();
  const goToTask = (task) => navigate(`/projects/${task.project}/tasks/${task.id}`);

  return (
    <Paper variant="outlined" sx={{ p: 2, height: DASHBOARD_PANEL_HEIGHT, display: "flex", flexDirection: "column" }}>
      <Typography variant="h6" gutterBottom sx={{ flexShrink: 0 }}>
        Upcoming Tasks
      </Typography>

      {overdueTasks.length === 0 && upcomingTasks.length === 0 ? (
        <Typography color="text.secondary">Không có task nào sắp hoặc quá hạn.</Typography>
      ) : (
        <Box sx={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
          {overdueTasks.length > 0 && (
            <>
              <Typography variant="overline" color="error.main" sx={{ display: "block" }}>
                Quá hạn ({overdueTasks.length})
              </Typography>
              <List disablePadding dense>
                {overdueTasks.map((task) => (
                  <TaskRow key={task.id} task={task} overdue onClick={() => goToTask(task)} />
                ))}
              </List>
            </>
          )}

          {upcomingTasks.length > 0 && (
            <>
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ display: "block", mt: overdueTasks.length > 0 ? 1.5 : 0 }}
              >
                Sắp tới hạn
              </Typography>
              <List disablePadding dense>
                {upcomingTasks.map((task) => (
                  <TaskRow key={task.id} task={task} onClick={() => goToTask(task)} />
                ))}
              </List>
            </>
          )}
        </Box>
      )}
    </Paper>
  );
}
