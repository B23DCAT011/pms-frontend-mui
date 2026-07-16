import { useState } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Link from '@mui/material/Link'
import { forgotPassword, resetPassword } from '../api/auth.js'
import logo from '../assets/kiai-logo.png'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState('email') // 'email' | 'reset'

  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [resetError, setResetError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  async function handleRequestOtp(event) {
    event.preventDefault()
    setEmailError('')
    setSubmitting(true)
    try {
      await forgotPassword(email)
      setStep('reset')
    } catch (err) {
      setEmailError(err.message || 'Gửi yêu cầu thất bại')
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
      setResetError(err.errors?.non_field_errors?.[0] || err.message || 'Đặt lại mật khẩu thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResend() {
    setResetError('')
    try {
      await forgotPassword(email)
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
      setResetError(err.message || 'Gửi lại OTP thất bại')
    }
  }

  if (step === 'reset') {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <Paper variant="outlined" sx={{ p: 4, width: 360 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <img src={logo} alt="KIAI" style={{ height: 40 }} />
          </Box>

          <Typography variant="h5" gutterBottom>
            Đặt lại mật khẩu
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Mã 6 số vừa gửi tới {email}
          </Typography>

          {resetError && <Alert severity="error" sx={{ mb: 2 }}>{resetError}</Alert>}

          <Box component="form" onSubmit={handleReset} noValidate>
            <TextField
              autoComplete='off'
              size="small"
              label="Mã OTP"
              fullWidth
              margin="normal"
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
            />
            <TextField
              autoComplete='new-password'
              size="small"
              label="Mật khẩu mới"
              type="password"
              fullWidth
              margin="normal"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }} disabled={submitting}>
              {submitting ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
            </Button>
          </Box>

          <Button fullWidth sx={{ mt: 1 }} onClick={handleResend} disabled={resendCooldown > 0}>
            {resendCooldown > 0 ? `Gửi lại sau ${resendCooldown}s` : 'Gửi lại mã OTP'}
          </Button>
        </Paper>
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
      <Paper variant="outlined" sx={{ p: 4, width: 360 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <img src={logo} alt="KIAI" style={{ height: 40 }} />
        </Box>

        <Typography sx={{ textAlign: 'center' }} variant="h5" gutterBottom>
          Quên mật khẩu
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Nhập email để nhận mã OTP đặt lại mật khẩu
        </Typography>

        {emailError && <Alert severity="error" sx={{ mb: 2 }}>{emailError}</Alert>}

        <Box component="form" onSubmit={handleRequestOtp} noValidate>
          <TextField
            size="small"
            label="Email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }} disabled={submitting}>
            {submitting ? 'Đang gửi...' : 'Gửi mã OTP'}
          </Button>
        </Box>

        <Typography sx={{ mt: 2, textAlign: 'center' }} variant="body2">
          <Link component={RouterLink} to="/login">Quay lại đăng nhập</Link>
        </Typography>
      </Paper>
    </Box>
  )
}