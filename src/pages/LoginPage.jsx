import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import PasswordField from '../components/PasswordField.jsx'
import AuthLayout from '../components/layout/AuthLayout.jsx'
import { useAuth } from '../auth/AuthContext.jsx'
import { Link as RouterLink } from 'react-router-dom'
import Link from '@mui/material/Link'
import useDocumentTitle from '../hooks/useDocumentTitle.js'

export default function LoginPage() {
  useDocumentTitle('Đăng nhập')
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    setFieldErrors({})
    setSubmitting(true)
    try {
      await login(username, password)
      navigate('/')
    } catch (err) {
      if (err.errors) {
        setFieldErrors(err.errors)
      } else {
        setFormError(err.message || 'Đăng nhập thất bại')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Đăng nhập" subtitle="Nhập thông tin tài khoản để tiếp tục.">
      {formError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {formError}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <TextField
          label="Tên đăng nhập hoặc email"
          fullWidth
          margin="normal"
          autoComplete="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          error={Boolean(fieldErrors.username)}
          helperText={fieldErrors.username?.[0]}
        />
        <PasswordField
          label="Mật khẩu"
          fullWidth
          margin="normal"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={Boolean(fieldErrors.password)}
          helperText={fieldErrors.password?.[0]}
        />
        <Typography sx={{ mt: 1, textAlign: 'right' }} variant="body2">
          <Link component={RouterLink} to="/forgot-password">
            Quên mật khẩu?
          </Link>
        </Typography>
        <Button type="submit" variant="contained" size="large" fullWidth sx={{ mt: 3 }} disabled={submitting}>
          {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </Button>
        <Typography sx={{ mt: 3, textAlign: 'center' }} variant="body2" color="text.secondary">
          Chưa có tài khoản?{' '}
          <Link component={RouterLink} to="/register" fontWeight={600}>
            Đăng ký
          </Link>
        </Typography>
      </Box>
    </AuthLayout>
  )
}
