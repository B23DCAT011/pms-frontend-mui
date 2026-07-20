import { useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { requestChangeEmail, verifyChangeEmail } from "../../api/auth.js";
import { useAuth } from "../../auth/AuthContext.jsx";
import { useNotification } from "../../notifications/NotificationContext.jsx";

export default function ChangeEmailSection() {
  const { user, updateUser } = useAuth();
  const { notifySuccess } = useNotification();
  const [step, setStep] = useState("form"); // "form" | "otp"

  const [newEmail, setNewEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  async function handleRequest(e) {
    e.preventDefault();
    setEmailError("");
    setSubmitting(true);
    try {
      await requestChangeEmail(newEmail);
      setStep("otp");
    } catch (err) {
      setEmailError(err.errors?.new_email?.[0] || err.errors?.[0] || err.message || "Gửi yêu cầu thất bại");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    setOtpError("");
    setSubmitting(true);
    try {
      const updated = await verifyChangeEmail(otp);
      updateUser(updated);
      notifySuccess("Đã đổi email thành công.");
      setStep("form");
      setNewEmail("");
      setOtp("");
    } catch (err) {
      setOtpError(err.errors?.[0] || err.message || "Xác thực thất bại");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    setOtpError("");
    try {
      await requestChangeEmail(newEmail);
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setOtpError(err.errors?.[0] || err.message || "Gửi lại OTP thất bại");
    }
  }

  if (step === "otp") {
    return (
      <Paper variant="outlined" sx={{ p: 3, maxWidth: 560, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Xác nhận đổi email
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Mã 6 số vừa gửi tới {newEmail}
        </Typography>

        <Box component="form" onSubmit={handleVerify} noValidate>
          <TextField
            label="Mã OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            fullWidth
            size="small"
            error={!!otpError}
            helperText={otpError}
          />
          <Button type="submit" variant="contained" sx={{ mt: 2 }} disabled={submitting || !otp}>
            {submitting ? "Đang xác thực..." : "Xác nhận"}
          </Button>
        </Box>

        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Button onClick={handleResend} disabled={resendCooldown > 0}>
            {resendCooldown > 0 ? `Gửi lại sau ${resendCooldown}s` : "Gửi lại mã OTP"}
          </Button>
          <Button color="inherit" onClick={() => setStep("form")}>
            Huỷ
          </Button>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper variant="outlined" sx={{ p: 3, maxWidth: 560, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Đổi email
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Email hiện tại: {user.email}
      </Typography>

      <Box component="form" onSubmit={handleRequest} noValidate>
        <TextField
          label="Email mới"
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          fullWidth
          size="small"
          error={!!emailError}
          helperText={emailError}
        />
        <Button type="submit" variant="contained" sx={{ mt: 2 }} disabled={submitting || !newEmail}>
          {submitting ? "Đang gửi..." : "Gửi mã xác nhận"}
        </Button>
      </Box>
    </Paper>
  );
}
