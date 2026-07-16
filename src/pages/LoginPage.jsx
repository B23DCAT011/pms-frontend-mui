import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import { useAuth } from '../auth/AuthContext.jsx'
import { Link as RouterLink } from 'react-router-dom'
import Link from '@mui/material/Link'
import logo from '../assets/kiai-logo.png'

export default function LoginPage() {
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
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
      }}
    >
      <Paper variant="outlined" sx={{ p: 4, width: 360 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <img src={logo} alt="KIAI" style={{ height: 40 }} />
        </Box>

        <Typography sx={{ textAlign: 'center' }} variant="h5" gutterBottom>
          Đăng nhập
        </Typography>

        {formError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formError}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            size="small"
            label="Username"
            fullWidth
            margin="normal"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            error={Boolean(fieldErrors.username)}
            helperText={fieldErrors.username?.[0]}
          />
          <TextField
            size="small"
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={Boolean(fieldErrors.password)}
            helperText={fieldErrors.password?.[0]}
          />
          <Typography sx={{ mt: 1, textAlign: 'right' }} variant="body2">
            <Link component={RouterLink} to="/forgot-password">Quên mật khẩu?</Link>
          </Typography>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
            disabled={submitting}
          >
            {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </Button>
          <Typography sx={{ mt: 2, textAlign: 'center' }} variant="body2">
            Chưa có tài khoản? <Link component={RouterLink} to="/register">Đăng ký</Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  )
}
