import { useState } from "react";
import Drawer from "@mui/material/Drawer";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import AvatarGroup from "@mui/material/AvatarGroup";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Tooltip from "@mui/material/Tooltip";
import Chip from "@mui/material/Chip";
import CloseIcon from "@mui/icons-material/Close";
import GroupsIcon from "@mui/icons-material/Groups";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import { colorFromString } from "../../utils/colorFromString.js";

function memberName(m) {
  return [m.user.first_name, m.user.last_name].filter(Boolean).join(" ") || m.user.username;
}

export default function MembersPanel({ members, canEdit, currentUserId, onRemoveMember, onAddMember }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip title={`Thành viên (${members.length})`}>
        <ButtonBase
          onClick={() => setOpen(true)}
          aria-label="Xem thành viên dự án"
          sx={{ borderRadius: 5, px: 1, py: 0.5, "&:hover": { bgcolor: "action.hover" } }}
        >
          {members.length === 0 ? (
            <GroupsIcon fontSize="small" color="disabled" />
          ) : (
            <AvatarGroup max={4} sx={{ "& .MuiAvatar-root": { width: 28, height: 28, fontSize: 13 } }}>
              {members.map((m) => (
                <Avatar key={m.id} sx={{ bgcolor: colorFromString(m.user.id) }}>
                  {memberName(m).charAt(0).toUpperCase()}
                </Avatar>
              ))}
            </AvatarGroup>
          )}
        </ButtonBase>
      </Tooltip>

      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
        <Box sx={{ width: 320, p: 2 }}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="h6">Thành viên ({members.length})</Typography>
            <IconButton size="small" onClick={() => setOpen(false)} aria-label="Đóng">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>

          <Divider sx={{ mb: 2 }} />

          <Stack spacing={1.5}>
            {members.map((m) => {
              const name = memberName(m);
              return (
                <Stack key={m.id} direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                  <Avatar sx={{ width: 36, height: 36, fontSize: 15, bgcolor: colorFromString(m.user.id) }}>
                    {name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="body2" noWrap>
                      {name}
                      {m.user.id === currentUserId && " (bạn)"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                      {m.user.email}
                    </Typography>
                  </Box>
                  <Chip
                    label={m.role}
                    size="small"
                    color={m.role === "admin" ? "primary" : "default"}
                    variant="outlined"
                    sx={{ textTransform: "capitalize", flexShrink: 0 }}
                  />
                  {canEdit && m.user.id !== currentUserId && (
                    <IconButton size="small" onClick={() => onRemoveMember(m)} aria-label={`Xoá ${name}`}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  )}
                </Stack>
              );
            })}

            {members.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                Chưa có thành viên.
              </Typography>
            )}
          </Stack>

          {canEdit && (
            <Button
              fullWidth
              variant="outlined"
              startIcon={<PersonAddAltIcon />}
              onClick={onAddMember}
              sx={{ mt: 2.5 }}
            >
              Thêm thành viên
            </Button>
          )}
        </Box>
      </Drawer>
    </>
  );
}
