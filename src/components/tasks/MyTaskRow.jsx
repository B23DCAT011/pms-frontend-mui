import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { alpha } from "@mui/material/styles";
import { PRIORITY_COLOR, PRIORITY_LABEL } from "../../constants/taskPriority.js";

const CATEGORY_LABEL = { todo: "To Do", in_progress: "Đang làm", done: "Hoàn thành" };
const CATEGORY_CHIP_COLOR = { todo: "default", in_progress: "info", done: "success" };
const CATEGORY_BORDER_COLOR = { todo: "grey.400", in_progress: "info.main", done: "success.main" };

export default function MyTaskRow({ task, projectName, overdue, onClick }) {
  return (
    <Paper
      variant="outlined"
      onClick={onClick}
      sx={{
        p: 1.5,
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        cursor: "pointer",
        borderLeft: 3,
        borderLeftColor: overdue ? "error.main" : CATEGORY_BORDER_COLOR[task.status.category],
        "&:hover": { bgcolor: "action.hover" },
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={500} noWrap>
          {task.title}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
          <Chip label={projectName} size="small" variant="outlined" sx={{ maxWidth: 180 }} />
          <Chip
            label={CATEGORY_LABEL[task.status.category]}
            size="small"
            color={CATEGORY_CHIP_COLOR[task.status.category]}
            variant="outlined"
          />
        </Stack>
      </Box>

      {task.deadline && (
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
          <CalendarTodayIcon sx={{ fontSize: 14 }} color={overdue ? "error" : "disabled"} />
          <Typography variant="caption" color={overdue ? "error.main" : "text.secondary"}>
            {new Date(task.deadline).toLocaleDateString("vi-VN")}
          </Typography>
        </Stack>
      )}

      <Chip
        label={PRIORITY_LABEL[task.priority]}
        size="small"
        sx={{
          flexShrink: 0,
          fontWeight: 600,
          bgcolor: (theme) => alpha(theme.palette[PRIORITY_COLOR[task.priority]].main, 0.15),
          color: `${PRIORITY_COLOR[task.priority]}.dark`,
        }}
      />
    </Paper>
  );
}
