import { useState } from "react";
import Fab from "@mui/material/Fab";
import Drawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import HistoryIcon from "@mui/icons-material/History";
import ActivityLogFeed from "./ActivityLogFeed.jsx";

// scope="project"|"task" + id truyền thẳng xuống ActivityLogFeed.
// Drawer mặc định unmount nội dung lúc đóng (không keepMounted) -> mỗi lần mở lại
// ActivityLogFeed tự remount, tự fetch lại trang đầu mới nhất, không cần tự quản lý refetch.
export default function ActivityLogButton({ scope, id }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Fab
        size="small"
        color="primary"
        onClick={() => setOpen(true)}
        aria-label="Xem hoạt động"
        sx={{ position: "fixed", bottom: 24, right: 24 }}
      >
        <HistoryIcon fontSize="small" />
      </Fab>

      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
        <Box sx={{ width: 360, p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6">Hoạt động</Typography>
            <IconButton size="small" onClick={() => setOpen(false)} aria-label="Đóng">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
          <ActivityLogFeed scope={scope} id={id} />
        </Box>
      </Drawer>
    </>
  );
}
