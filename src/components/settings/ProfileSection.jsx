import { useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import Grid from "@mui/material/Grid";
import { useAuth } from "../../auth/AuthContext.jsx";
import { updateMe } from "../../api/auth.js";

export default function ProfileSection() {
  const { user, updateUser } = useAuth();

  const [firstName, setFirstName] = useState(user.first_name || "");
  const [lastName, setLastName] = useState(user.last_name || "");
  const [dateOfBirth, setDateOfBirth] = useState(user.date_of_birth || "");
  const [phoneNumber, setPhoneNumber] = useState(user.phone_number || "");
  const [organization, setOrganization] = useState(user.organization || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username;
  const initial = (user.first_name || user.username || "?").charAt(0).toUpperCase();

  const dirty =
    firstName !== (user.first_name || "") ||
    lastName !== (user.last_name || "") ||
    dateOfBirth !== (user.date_of_birth || "") ||
    phoneNumber !== (user.phone_number || "") ||
    organization !== (user.organization || "");

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const patch = await updateMe({
        first_name: firstName,
        last_name: lastName,
        date_of_birth: dateOfBirth || null,
        phone_number: phoneNumber,
        organization,
      });
      updateUser(patch);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: 3, maxWidth: 560 }}>
      <Typography variant="h6" gutterBottom>
        Profile
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Avatar sx={{ width: 56, height: 56, fontSize: 24 }}>{initial}</Avatar>
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            {fullName}
          </Typography>
          <Chip label={user.role} size="small" sx={{ textTransform: "capitalize", mt: 0.5 }} />
        </Box>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(false)} sx={{ mb: 2 }}>
          Đã lưu thay đổi.
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField label="Username" value={user.username} fullWidth size="small" disabled />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField label="Email" value={user.email} fullWidth size="small" disabled />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField label="Họ" value={firstName} onChange={(e) => setFirstName(e.target.value)} fullWidth size="small" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField label="Tên" value={lastName} onChange={(e) => setLastName(e.target.value)} fullWidth size="small" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Ngày sinh"
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            fullWidth
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Số điện thoại"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            fullWidth
            size="small"
          />
        </Grid>
        <Grid size={12}>
          <TextField
            label="Đơn vị / nơi làm việc"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            fullWidth
            size="small"
          />
        </Grid>
      </Grid>

      <Button variant="contained" sx={{ mt: 3 }} disabled={!dirty || saving} onClick={handleSave}>
        {saving ? "Đang lưu..." : "Lưu thay đổi"}
      </Button>
    </Paper>
  );
}
