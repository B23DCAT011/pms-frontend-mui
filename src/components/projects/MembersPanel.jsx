import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";

export default function MembersPanel({ members, canEdit, currentUserId, onRemoveMember }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, width: 260, flexShrink: 0 }}>
      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
        Team Members
      </Typography>
      <Stack spacing={1.5}>
        {members.map((m) => {
          const name = [m.user.first_name, m.user.last_name].filter(Boolean).join(" ") || m.user.username;
          const isSelf = m.user.id === currentUserId;
          return (
            <Stack key={m.id} direction="row" spacing={1.5} alignItems="center">
              <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>{name.charAt(0).toUpperCase()}</Avatar>
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
            </Stack>
          );
        })}
        {members.length === 0 && (
          <Typography variant="caption" color="text.secondary">
            Chưa có thành viên.
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}