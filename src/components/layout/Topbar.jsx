import { useEffect, useState } from 'react'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Avatar from '@mui/material/Avatar'
import Stack from '@mui/material/Stack'
import Badge from '@mui/material/Badge'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'
import NotificationsIcon from '@mui/icons-material/Notifications'
import HelpOutlineIcon from '@mui/icons-material/HelpOutlineOutlined'
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined'
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext.jsx'
import { useThemeMode } from '../../theme/ThemeModeContext.jsx'
import { listNotifications, markNotificationRead } from '../../api/notifications.js'
import { notificationLabel, notificationTarget } from '../notifications/notificationDisplay.js'
import { DRAWER_WIDTH } from './Sidebar.jsx'

const PREVIEW_LIMIT = 5
const POLL_INTERVAL_MS = 30000

export default function Topbar() {
  const { user } = useAuth()
  const { mode, toggleMode } = useThemeMode()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [anchorEl, setAnchorEl] = useState(null)

  const name = user.first_name || user.username

  useEffect(() => {
    const fetchNotifications = () => {
      listNotifications()
        .then((data) => setNotifications(data.results))
        .catch(() => {})
    }
    fetchNotifications()
    const timer = setInterval(fetchNotifications, POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const handleNotificationClick = (notification) => {
    setAnchorEl(null)
    markNotificationRead(notification.id).catch(() => {})
    setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n)))

    const target = notificationTarget(notification)
    if (target) navigate(target)
  }

  const goToAllNotifications = () => {
    setAnchorEl(null)
    navigate('/notifications')
  }

  return (
    <AppBar
      position="fixed"
      color="inherit"
      elevation={0}
      sx={{
        width: `calc(100% - ${DRAWER_WIDTH}px)`,
        ml: `${DRAWER_WIDTH}px`,
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography variant="h6">Hi, {name}</Typography>

        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton aria-label="Thông báo" onClick={(e) => setAnchorEl(e.currentTarget)}>
            <Badge badgeContent={unreadCount} color="error" max={9}>
              <NotificationsIcon />
            </Badge>
          </IconButton>
          <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
            {notifications.length === 0 && (
              <MenuItem disabled>
                <ListItemText primary="Không có thông báo mới" />
              </MenuItem>
            )}
            {notifications.slice(0, PREVIEW_LIMIT).map((n) => (
              <MenuItem key={n.id} onClick={() => handleNotificationClick(n)} selected={!n.is_read}>
                <ListItemText primary={notificationLabel(n)} secondary={new Date(n.created_at).toLocaleString('vi-VN')} />
              </MenuItem>
            ))}
            {notifications.length > 0 && [
              <Divider key="divider" />,
              <MenuItem key="see-all" onClick={goToAllNotifications}>
                <Typography variant="body2" color="primary" sx={{ width: '100%', textAlign: 'center' }}>
                  Xem tất cả
                </Typography>
              </MenuItem>,
            ]}
          </Menu>

          <IconButton aria-label="Trợ giúp">
            <HelpOutlineIcon />
          </IconButton>
          <IconButton aria-label="Đổi giao diện" onClick={toggleMode}>
            {mode === 'dark' ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
          </IconButton>
          <Avatar sx={{ width: 32, height: 32 }}>{name.charAt(0).toUpperCase()}</Avatar>
        </Stack>
      </Toolbar>
    </AppBar>
  )
}
