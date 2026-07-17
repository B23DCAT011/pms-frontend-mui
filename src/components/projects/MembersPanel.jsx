import { useState } from "react";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import CloseIcon from "@mui/icons-material/Close";

function memberName(m) {
  return [m.user.first_name, m.user.last_name].filter(Boolean).join(" ") || m.user.username;
}

export default function MembersPanel({ members, canEdit, currentUserId, onRemoveMember, onAddMember }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Paper
      variant="outlined"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      // Đổi width trong flow bình thường (không overlay tuyệt đối) để vùng hover luôn
      // khớp đúng kích thước đang hiển thị -- tránh bug rời chuột giữa chừng khi mở rộng.
      sx={{
        width: expanded ? 260 : 56,
        p: expanded ? 2 : 1,
        transition: "width 0.25s ease, padding 0.25s ease",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <Stack spacing={1.5} sx={{ whiteSpace: "nowrap" }}>
        {expanded && (
          <Typography variant="subtitle2" fontWeight={600}>
            Team Members
          </Typography>
        )}

        {members.map((m) => {
          const name = memberName(m);
          const isSelf = m.user.id === currentUserId;
          return (
            <Stack key={m.id} direction="row" spacing={1.5} alignItems="center">
              <Avatar sx={{ width: 32, height: 32, fontSize: 14, flexShrink: 0 }}>
                {name.charAt(0).toUpperCase()}
              </Avatar>
              {expanded && (
                <>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="body2" noWrap>
                      {name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: "capitalize" }}>
                      {m.role}
                    </Typography>
                  </Box>
                  {canEdit && !isSelf && (
                    <IconButton size="small" onClick={() => onRemoveMember(m)} aria-label="Xoá thành viên">
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  )}
                </>
              )}
            </Stack>
          );
        })}

        {expanded && members.length === 0 && (
          <Typography variant="caption" color="text.secondary">
            Chưa có thành viên.
          </Typography>
        )}

        {expanded && canEdit && (
          <Button fullWidth variant="outlined" size="small" onClick={onAddMember} sx={{ textTransform: "none" }}>
            + Thêm thành viên
          </Button>
        )}
      </Stack>
    </Paper>
  );
}
