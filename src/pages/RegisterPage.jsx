import { useRef, useState } from 'react'
import { useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Link from '@mui/material/Link'
import { register, verifyOtp, resendOtp } from '../api/auth.js'
import TurnstileWidget, { turnstileEnabled } from '../components/TurnstileWidget.jsx'
import PasswordField from '../components/PasswordField.jsx'
import logo from '../assets/kiai-logo.png'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const invitationId = searchParams.get('invitation_id')
  const [step, setStep] = useState('form') // 'form' | 'otp'

  const [form, setForm] = useState({
    username: '',
    email: searchParams.get('email') || '',
    first_name: '',
    last_name: '',
    password: '',
    password_confirm: '',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  const captchaRef = useRef(null)

  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  function updateField(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  async function handleRegister(event) {
    event.preventDefault()
    setFormError('')
    setFieldErrors({})
    setSubmitting(true)
    try {
      await register({ ...form, captcha_token: captchaToken })
      setStep('otp')
    } catch (err) {
      if (err.errors) {
        setFieldErrors(err.errors)
        if (err.errors.captcha_token) setFormError(err.errors.captcha_token[0])
      } else {
        setFormError(err.message || 'Đăng ký thất bại')
      }
      captchaRef.current?.reset()
    } finally {
      setSubmitting(false)
    }
  }

  async function handleVerifyOtp(event) {
    event.preventDefault()
    setOtpError('')
    setSubmitting(true)
    try {
      await verifyOtp(form.email, otp, invitationId)
      navigate('/login')
    } catch (err) {
      setOtpError(err.errors?.non_field_errors?.[0] || err.message || 'Xác thực thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResend() {
    setOtpError('')
    try {
      await resendOtp(form.email)
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
      setOtpError(err.errors?.non_field_errors?.[0] || err.message || 'Gửi lại OTP thất bại')
    }
  }

  if (step === 'otp') {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <Paper variant="outlined" sx={{ p: 4, width: 360 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <img src={logo} alt="KIAI" style={{ height: 40 }} />
          </Box>

          <Typography variant="h5" gutterBottom>
            Nhập mã OTP
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Mã 6 số vừa gửi tới {form.email}
          </Typography>

          {otpError && <Alert severity="error" sx={{ mb: 2 }}>{otpError}</Alert>}

          <Box component="form" onSubmit={handleVerifyOtp} noValidate>
            <TextField
              size="small"
              label="Mã OTP"
              fullWidth
              margin="normal"
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
            />
            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }} disabled={submitting}>
              {submitting ? 'Đang xác thực...' : 'Xác thực'}
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
          Đăng ký
        </Typography>

        {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}

        <Box component="form" onSubmit={handleRegister} noValidate>
          <TextField size="small" label="Username" fullWidth margin="normal" value={form.username} onChange={updateField('username')}
            error={Boolean(fieldErrors.username)} helperText={fieldErrors.username?.[0]} />
          <TextField size="small" label="Email" fullWidth margin="normal" value={form.email} onChange={updateField('email')}
            error={Boolean(fieldErrors.email)} helperText={fieldErrors.email?.[0]} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField size="small" label="Tên" fullWidth margin="normal" value={form.first_name} onChange={updateField('first_name')}
              error={Boolean(fieldErrors.first_name)} helperText={fieldErrors.first_name?.[0]} />
            <TextField size="small" label="Họ" fullWidth margin="normal" value={form.last_name} onChange={updateField('last_name')}
              error={Boolean(fieldErrors.last_name)} helperText={fieldErrors.last_name?.[0]} />
          </Box>
          <PasswordField label="Mật khẩu" fullWidth margin="normal" value={form.password} onChange={updateField('password')}
            error={Boolean(fieldErrors.password)} helperText={fieldErrors.password?.[0]} />
          <PasswordField label="Nhập lại mật khẩu" fullWidth margin="normal" value={form.password_confirm} onChange={updateField('password_confirm')}
            error={Boolean(fieldErrors.password_confirm)} helperText={fieldErrors.password_confirm?.[0]} />
          <TurnstileWidget ref={captchaRef} onVerify={setCaptchaToken} />
          <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }} disabled={submitting || (turnstileEnabled && !captchaToken)}>
            {submitting ? 'Đang đăng ký...' : 'Đăng ký'}
          </Button>
        </Box>

        <Typography sx={{ mt: 2, textAlign: 'center' }} variant="body2">
          Đã có tài khoản? <Link component={RouterLink} to="/login">Đăng nhập</Link>
        </Typography>
      </Paper>
    </Box>
  )
}