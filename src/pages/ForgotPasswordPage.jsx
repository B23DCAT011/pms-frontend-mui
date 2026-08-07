import { useRef, useState } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Link from '@mui/material/Link'
import { forgotPassword, resetPassword } from '../api/auth.js'
import { firstErrorMessage } from '../api/client.js'
import TurnstileWidget, { turnstileEnabled } from '../components/TurnstileWidget.jsx'
import PasswordField from '../components/PasswordField.jsx'
import AuthLayout from '../components/layout/AuthLayout.jsx'
import useDocumentTitle from '../hooks/useDocumentTitle.js'

export default function ForgotPasswordPage() {
  useDocumentTitle('Quên mật khẩu')
  const navigate = useNavigate()
  const [step, setStep] = useState('email') // 'email' | 'reset'

  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  const captchaRef = useRef(null)

  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [resetError, setResetError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  async function handleRequestOtp(event) {
    event.preventDefault()
    setEmailError('')
    setSubmitting(true)
    try {
      await forgotPassword(email, captchaToken)
      setCaptchaToken('')
      setStep('reset')
    } catch (err) {
      setEmailError(firstErrorMessage(err, 'Gửi yêu cầu thất bại'))
      captchaRef.current?.reset()
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReset(event) {
    event.preventDefault()
    setResetError('')
    setSubmitting(true)
    try {
      await resetPassword(email, otp, newPassword)
      navigate('/login')
    } catch (err) {
      setResetError(firstErrorMessage(err, 'Đặt lại mật khẩu thất bại'))
    } finally {
      setSubmitting(false)
    }
  }

  function handleBackToEmail() {
    setStep('email')
    setOtp('')
    setNewPassword('')
    setResetError('')
    // Token Turnstile chỉ dùng được 1 lần; widget ở bước email là instance mới nên phải lấy token mới.
    setCaptchaToken('')
  }

  async function handleResend() {
    setResetError('')
    try {
      await forgotPassword(email, captchaToken)
      setResendCooldown(60)
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (err) {
      setResetError(firstErrorMessage(err, 'Gửi lại OTP thất bại'))
    } finally {
      captchaRef.current?.reset()
    }
  }

  if (step === 'reset') {
    return (
      <AuthLayout title="Đặt lại mật khẩu" subtitle={`Mã 6 số vừa được gửi tới ${email}`}>
        {resetError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {resetError}
          </Alert>
        )}

        <Box component="form" onSubmit={handleReset} noValidate>
          <TextField
            autoComplete="one-time-code"
            label="Mã OTP"
            fullWidth
            margin="normal"
            value={otp}
            onChange={(event) => setOtp(event.target.value)}
          />
          <PasswordField
            autoComplete="new-password"
            label="Mật khẩu mới"
            fullWidth
            margin="normal"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
          <Button type="submit" variant="contained" size="large" fullWidth sx={{ mt: 3 }} disabled={submitting}>
            {submitting ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
          </Button>
        </Box>

        <TurnstileWidget ref={captchaRef} onVerify={setCaptchaToken} />
        <Button
          fullWidth
          sx={{ mt: 1 }}
          onClick={handleResend}
          disabled={resendCooldown > 0 || (turnstileEnabled && !captchaToken)}
        >
          {resendCooldown > 0 ? `Gửi lại sau ${resendCooldown}s` : 'Gửi lại mã OTP'}
        </Button>
        <Button fullWidth color="inherit" sx={{ mt: 0.5 }} onClick={handleBackToEmail} disabled={submitting}>
          Nhập lại email khác
        </Button>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Quên mật khẩu" subtitle="Nhập email của bạn để nhận mã OTP đặt lại mật khẩu.">
      {emailError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {emailError}
        </Alert>
      )}

      <Box component="form" onSubmit={handleRequestOtp} noValidate>
        <TextField
          label="Email"
          fullWidth
          margin="normal"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <TurnstileWidget ref={captchaRef} onVerify={setCaptchaToken} />
        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          sx={{ mt: 3 }}
          disabled={submitting || (turnstileEnabled && !captchaToken)}
        >
          {submitting ? 'Đang gửi...' : 'Gửi mã OTP'}
        </Button>
      </Box>

      <Typography sx={{ mt: 3, textAlign: 'center' }} variant="body2">
        <Link component={RouterLink} to="/login">
          Quay lại đăng nhập
        </Link>
      </Typography>
    </AuthLayout>
  )
}
