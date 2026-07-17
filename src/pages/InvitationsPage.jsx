import { useEffect, useState } from "react";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import { listMyInvitations, acceptInvitation, declineInvitation } from "../api/invitations.js";

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const reload = () => {
    setLoading(true);
    listMyInvitations()
      .then((data) => setInvitations(data.results))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(reload, []);

  const handleAccept = (invitation) => {
    setActionError(null);
    setProcessingId(invitation.id);
    acceptInvitation(invitation.id)
      .then(() => setInvitations((prev) => prev.filter((i) => i.id !== invitation.id)))
      .catch((err) => setActionError(err.message))
      .finally(() => setProcessingId(null));
  };

  const handleDecline = (invitation) => {
    setActionError(null);
    setProcessingId(invitation.id);
    declineInvitation(invitation.id)
      .then(() => setInvitations((prev) => prev.filter((i) => i.id !== invitation.id)))
      .catch((err) => setActionError(err.message))
      .finally(() => setProcessingId(null));
  };

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Lời mời tham gia dự án
      </Typography>

      {actionError && (
        <Alert severity="error" onClose={() => setActionError(null)} sx={{ mb: 2 }}>
          {actionError}
        </Alert>
      )}

      {loading && <CircularProgress size={24} />}
      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && (
        <Stack spacing={1.5} sx={{ maxWidth: 640 }}>
          {invitations.map((inv) => (
            <Paper key={inv.id} variant="outlined" sx={{ p: 2, display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="subtitle1" fontWeight={600} noWrap>
                    {inv.project_name}
                  </Typography>
                  <Chip label={inv.role} size="small" sx={{ textTransform: "capitalize" }} />
                  {inv.is_expired && <Chip label="Hết hạn" size="small" color="default" />}
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Mời bởi {inv.invited_by_email} · {new Date(inv.created_at).toLocaleString("vi-VN")}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} flexShrink={0}>
                <Button
                  size="small"
                  variant="contained"
                  disabled={inv.is_expired || processingId === inv.id}
                  onClick={() => handleAccept(inv)}
                >
                  Chấp nhận
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  disabled={processingId === inv.id}
                  onClick={() => handleDecline(inv)}
                >
                  Từ chối
                </Button>
              </Stack>
            </Paper>
          ))}

          {invitations.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              Bạn không có lời mời nào đang chờ.
            </Typography>
          )}
        </Stack>
      )}
    </>
  );
}
