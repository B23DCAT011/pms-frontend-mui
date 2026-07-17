import { useState } from "react";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import AddIcon from "@mui/icons-material/Add";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import TaskCard from "./TaskCard.jsx";

const CATEGORY_DOT_COLOR = { todo: "grey.400", in_progress: "info.main", done: "success.main" };

export default function KanbanColumn({
  label,
  category,
  tasks,
  totalCount,
  onDropTask,
  canEdit,
  onAddTask,
  onOpenTask,
  onEditStatus,
  onDeleteStatus,
}) {
  const [menuAnchor, setMenuAnchor] = useState(null);

  const handleDrop = (e) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    onDropTask(taskId);
  };

  const closeMenu = () => setMenuAnchor(null);

  return (
    <Paper
      variant="outlined"
      sx={{ p: 2, bgcolor: "grey.50", height: "100%", maxHeight: 1000, display: "flex", flexDirection: "column" }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <Box sx={{ display: "flex", flexWrap: "nowrap", alignItems: "center", justifyContent: "space-between", mb: 1, flexShrink: 0 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: CATEGORY_DOT_COLOR[category] ?? "grey.400" }}
          />
          <Typography variant="subtitle1" fontWeight={600}>
            {label} ({totalCount ?? tasks.length})
          </Typography>
        </Stack>

        <Stack direction="row" flexShrink={0}>
          <IconButton size="small" disabled={!canEdit} onClick={onAddTask} aria-label="Thêm task vào cột">
            <AddIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            disabled={!canEdit}
            onClick={(e) => setMenuAnchor(e.currentTarget)}
            aria-label="Tuỳ chọn cột"
          >
            <MoreHorizIcon fontSize="small" />
          </IconButton>
          <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={closeMenu}>
            <MenuItem
              onClick={() => {
                closeMenu();
                onEditStatus();
              }}
            >
              Sửa cột
            </MenuItem>
            <MenuItem
              onClick={() => {
                closeMenu();
                onDeleteStatus();
              }}
            >
              Xoá cột
            </MenuItem>
          </Menu>
        </Stack>
      </Box>
      <Stack spacing={2} sx={{ overflowY: "auto", minHeight: 200, pr: 0.5 }}>
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onClick={() => onOpenTask(task)} />
        ))}
      </Stack>
    </Paper>
  );
}