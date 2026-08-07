import { useRef, useState } from 'react'
import { useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Link from '@mui/material/Link'
import { register, verifyOtp, resendOtp } from '../api/auth.js'
import { firstErrorMessage } from '../api/client.js'
import TurnstileWidget, { turnstileEnabled } from '../components/TurnstileWidget.jsx'
import PasswordField from '../components/PasswordField.jsx'
import AuthLayout from '../components/layout/AuthLayout.jsx'
import useDocumentTitle from '../hooks/useDocumentTitle.js'
import { useAuth } from '../auth/AuthContext.jsx'

export default function RegisterPage() {
  useDocumentTitle('Đăng ký')
  const navigate = useNavigate()
  const { login } = useAuth()
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
    } catch (err) {
      setOtpError(firstErrorMessage(err, 'Xác thực thất bại'))
      setSubmitting(false)
      return
    }

    // Tài khoản đã kích hoạt xong. Login hỏng thì đưa về /login chứ không báo lỗi OTP:
    // OTP vừa bị xoá sau khi verify nên nhập lại chỉ dẫn vào ngõ cụt.
    try {
      await login(form.username, form.password)
      navigate('/')
    } catch {
      navigate('/login')
    }
  }

  function handleBackToForm() {
    setStep('form')
    setOtp('')
    setOtpError('')
    // Token Turnstile đã bị tiêu ở lần đăng ký vừa rồi; widget mount lại sẽ cấp token mới.
    setCaptchaToken('')
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
      setOtpError(firstErrorMessage(err, 'Gửi lại OTP thất bại'))
    }
  }

  if (step === 'otp') {
    return (
      <AuthLayout title="Xác thực email" subtitle={`Mã 6 số vừa được gửi tới ${form.email}`}>
        {otpError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {otpError}
          </Alert>
        )}

        <Box component="form" onSubmit={handleVerifyOtp} noValidate>
          <TextField
            label="Mã OTP"
            fullWidth
            margin="normal"
            autoComplete="one-time-code"
            value={otp}
            onChange={(event) => setOtp(event.target.value)}
          />
          <Button type="submit" variant="contained" size="large" fullWidth sx={{ mt: 3 }} disabled={submitting}>
            {submitting ? 'Đang xác thực...' : 'Xác thực'}
          </Button>
        </Box>

        <Button fullWidth sx={{ mt: 1 }} onClick={handleResend} disabled={resendCooldown > 0}>
          {resendCooldown > 0 ? `Gửi lại sau ${resendCooldown}s` : 'Gửi lại mã OTP'}
        </Button>
        <Button fullWidth color="inherit" sx={{ mt: 0.5 }} onClick={handleBackToForm} disabled={submitting}>
          Quay lại sửa thông tin
        </Button>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Tạo tài khoản" subtitle="Điền thông tin bên dưới để bắt đầu.">
      {formError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {formError}
        </Alert>
      )}

      <Box component="form" onSubmit={handleRegister} noValidate>
        <TextField
          label="Tên đăng nhập"
          fullWidth
          margin="normal"
          autoComplete="username"
          value={form.username}
          onChange={updateField('username')}
          error={Boolean(fieldErrors.username)}
          helperText={fieldErrors.username?.[0]}
        />
        <TextField
          label="Email"
          fullWidth
          margin="normal"
          autoComplete="email"
          value={form.email}
          onChange={updateField('email')}
          error={Boolean(fieldErrors.email)}
          helperText={fieldErrors.email?.[0]}
        />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Tên"
            fullWidth
            margin="normal"
            value={form.first_name}
            onChange={updateField('first_name')}
            error={Boolean(fieldErrors.first_name)}
            helperText={fieldErrors.first_name?.[0]}
          />
          <TextField
            label="Họ"
            fullWidth
            margin="normal"
            value={form.last_name}
            onChange={updateField('last_name')}
            error={Boolean(fieldErrors.last_name)}
            helperText={fieldErrors.last_name?.[0]}
          />
        </Box>
        <PasswordField
          label="Mật khẩu"
          fullWidth
          margin="normal"
          autoComplete="new-password"
          value={form.password}
          onChange={updateField('password')}
          error={Boolean(fieldErrors.password)}
          helperText={fieldErrors.password?.[0]}
        />
        <PasswordField
          label="Nhập lại mật khẩu"
          fullWidth
          margin="normal"
          autoComplete="new-password"
          value={form.password_confirm}
          onChange={updateField('password_confirm')}
          error={Boolean(fieldErrors.password_confirm)}
          helperText={fieldErrors.password_confirm?.[0]}
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
          {submitting ? 'Đang đăng ký...' : 'Đăng ký'}
        </Button>
      </Box>

      <Typography sx={{ mt: 3, textAlign: 'center' }} variant="body2" color="text.secondary">
        Đã có tài khoản?{' '}
        <Link component={RouterLink} to="/login" fontWeight={600}>
          Đăng nhập
        </Link>
      </Typography>
    </AuthLayout>
  )
}
