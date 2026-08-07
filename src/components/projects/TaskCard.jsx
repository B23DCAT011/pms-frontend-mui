import { useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import { alpha } from "@mui/material/styles";
import { Link as RouterLink } from "react-router-dom";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ChecklistIcon from "@mui/icons-material/Checklist";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import { PRIORITY_COLOR, PRIORITY_LABEL } from "../../constants/taskPriority.js";
import { colorFromString } from "../../utils/colorFromString.js";

export default function TaskCard({ task, to }) {
  const [dragging, setDragging] = useState(false);
  const assignedTo = task.assigned_to;
  const assigneeName = assignedTo
    ? [assignedTo.first_name, assignedTo.last_name].filter(Boolean).join(" ") || assignedTo.username
    : "Chưa có người đảm nhận";
  const doneSubtasks = task.subtasks.filter((s) => s.status.category === "done").length;

  return (
    <Card
      variant="outlined"
      component={RouterLink}
      to={to}
      draggable
      onDragStart={(e) => {
        // Ghi đè payload mặc định của thẻ <a> (là URL) bằng id task, đúng thứ KanbanColumn đọc khi thả.
        e.dataTransfer.setData("text/plain", task.id);
        setDragging(true);
      }}
      onDragEnd={() => setDragging(false)}
      sx={{
        display: "block",
        textDecoration: "none",
        color: "inherit",
        cursor: "grab",
        opacity: dragging ? 0.4 : 1,
        transition: "border-color .15s, box-shadow .15s, transform .15s, opacity .15s",
        "&:hover": {
          borderColor: "primary.main",
          transform: "translateY(-2px)",
          boxShadow: (theme) =>
            `0 4px 12px ${alpha(theme.palette.common.black, theme.palette.mode === "dark" ? 0.5 : 0.12)}`,
        },
        "&:active": { cursor: "grabbing" },
      }}
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
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            {task.submitted_at && (
              <Tooltip title="Đang chờ duyệt">
                <PendingActionsIcon sx={{ fontSize: 16 }} color="warning" />
              </Tooltip>
            )}
            {task.deadline && (
              <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                <CalendarTodayIcon sx={{ fontSize: 14 }} color="disabled" />
                <Typography variant="caption" color="text.secondary">
                  {new Date(task.deadline).toLocaleDateString("vi-VN")}
                </Typography>
              </Stack>
            )}
            {task.subtasks.length > 0 && (
              <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                <ChecklistIcon sx={{ fontSize: 14 }} color="disabled" />
                <Typography variant="caption" color="text.secondary">
                  {doneSubtasks}/{task.subtasks.length}
                </Typography>
              </Stack>
            )}
          </Stack>

          <Tooltip title={assigneeName}>
            <Avatar
              sx={{
                width: 24,
                height: 24,
                fontSize: 12,
                flexShrink: 0,
                bgcolor: assignedTo ? colorFromString(assignedTo.id) : "action.disabled",
              }}
            >
              {assignedTo ? assigneeName.charAt(0).toUpperCase() : "?"}
            </Avatar>
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
  );
}
