import { useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import PasswordField from "../PasswordField.jsx";
import { changePassword } from "../../api/auth.js";
import { useNotification } from "../../notifications/NotificationContext.jsx";

export default function ChangePasswordSection() {
  const { notifySuccess } = useNotification();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const dirty = oldPassword && newPassword && confirmPassword;

  async function handleSubmit(e) {
    e.preventDefault();
    setFieldErrors({});
    setFormError("");

    if (newPassword !== confirmPassword) {
      setFieldErrors({ confirm_password: ["Mật khẩu nhập lại không khớp."] });
      return;
    }

    setSaving(true);
    try {
      await changePassword(oldPassword, newPassword);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      notifySuccess("Đã đổi mật khẩu.");
    } catch (err) {
      if (err.errors) {
        setFieldErrors(err.errors);
      } else {
        setFormError(err.message || "Đổi mật khẩu thất bại");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: 3, maxWidth: 560, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Đổi mật khẩu
      </Typography>

      {formError && (
        <Alert severity="error" onClose={() => setFormError("")} sx={{ mb: 2 }}>
          {formError}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={2}>
          <PasswordField
            label="Mật khẩu hiện tại"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            fullWidth
            error={!!fieldErrors.old_password}
            helperText={fieldErrors.old_password?.[0]}
          />
          <PasswordField
            label="Mật khẩu mới"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            fullWidth
            error={!!fieldErrors.new_password}
            helperText={fieldErrors.new_password?.[0]}
          />
          <PasswordField
            label="Nhập lại mật khẩu mới"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            fullWidth
            error={!!fieldErrors.confirm_password}
            helperText={fieldErrors.confirm_password?.[0]}
          />
        </Stack>

        <Button type="submit" variant="contained" sx={{ mt: 3 }} disabled={!dirty || saving}>
          {saving ? "Đang lưu..." : "Đổi mật khẩu"}
        </Button>
      </Box>
    </Paper>
  );
}
