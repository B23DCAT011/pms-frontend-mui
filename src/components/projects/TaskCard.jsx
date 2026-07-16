import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import { alpha } from "@mui/material/styles";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ChecklistIcon from "@mui/icons-material/Checklist";
import { PRIORITY_COLOR, PRIORITY_LABEL } from "../../constants/taskPriority.js";

export default function TaskCard({ task, onClick }) {
  const assignedTo = task.assigned_to;
  const assigneeName = assignedTo
    ? [assignedTo.first_name, assignedTo.last_name].filter(Boolean).join(" ") || assignedTo.username
    : "Chưa có người đảm nhận";
  const doneSubtasks = task.subtasks.filter((s) => s.status.category === "done").length;

  return (
    <Card
      variant="outlined"
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/plain", task.id)}
      onClick={onClick}
      sx={{ cursor: "grab" }}
    >
      <CardContent sx={{ "&:last-child": { pb: 2 } }}>
        <Box sx={{ display: "flex", flexWrap: "nowrap", justifyContent: "space-between", alignItems: "flex-start", gap: 1, mb: 2 }}>
          <Typography variant="body2" fontWeight={500} sx={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {task.title}
          </Typography>
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
        </Box>

        <Box sx={{ display: "flex", flexWrap: "nowrap", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            {task.deadline && (
              <Stack direction="row" spacing={0.5} alignItems="center">
                <CalendarTodayIcon sx={{ fontSize: 14 }} color="disabled" />
                <Typography variant="caption" color="text.secondary">
                  {new Date(task.deadline).toLocaleDateString("vi-VN")}
                </Typography>
              </Stack>
            )}
            {task.subtasks.length > 0 && (
              <Stack direction="row" spacing={0.5} alignItems="center">
                <ChecklistIcon sx={{ fontSize: 14 }} color="disabled" />
                <Typography variant="caption" color="text.secondary">
                  {doneSubtasks}/{task.subtasks.length}
                </Typography>
              </Stack>
            )}
          </Stack>

          <Tooltip title={assigneeName}>
            <Avatar sx={{ width: 24, height: 24, fontSize: 12, flexShrink: 0, bgcolor: "success.main" }}>
              {assignedTo ? assigneeName.charAt(0).toUpperCase() : "?"}
            </Avatar>
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
  );
}
