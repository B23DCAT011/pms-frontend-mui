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
import Tooltip from '@mui/material/Tooltip'
import MenuIcon from '@mui/icons-material/Menu'
import NotificationsIcon from '@mui/icons-material/Notifications'
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined'
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext.jsx'
import { useThemeMode } from '../../theme/ThemeModeContext.jsx'
import { listNotifications, markNotificationRead } from '../../api/notifications.js'
import { notificationLabel, notificationTarget } from '../notifications/notificationDisplay.js'
import { DRAWER_WIDTH } from './Sidebar.jsx'

const PREVIEW_LIMIT = 5
const POLL_INTERVAL_MS = 30000

// Nhãn hiển thị trên Topbar theo route đang mở. Prefix dài đặt trước prefix ngắn vì
// vòng lặp dừng ở phần tử khớp đầu tiên ('/projects/abc' phải ra "Chi tiết project",
// không phải "Projects").
const PAGE_TITLES = [
  ['/projects/', 'Chi tiết project'],
  ['/projects', 'Projects'],
  ['/my-tasks', 'My Tasks'],
  ['/settings', 'Settings'],
  ['/notifications', 'Thông báo'],
  ['/invitations', 'Lời mời'],
]

export default function Topbar({ onOpenMenu }) {
  const { user } = useAuth()
  const { mode, toggleMode } = useThemeMode()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [notifications, setNotifications] = useState([])
  const [anchorEl, setAnchorEl] = useState(null)

  const name = user.first_name || user.username
  const pageTitle = PAGE_TITLES.find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? 'Dashboard'

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
        width: { xs: '100%', md: `calc(100% - ${DRAWER_WIDTH}px)` },
        ml: { xs: 0, md: `${DRAWER_WIDTH}px` },
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
          <IconButton
            aria-label="Mở menu"
            edge="start"
            onClick={onOpenMenu}
            sx={{ display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap>
            {pageTitle}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Tooltip title="Thông báo">
            <IconButton aria-label="Thông báo" onClick={(e) => setAnchorEl(e.currentTarget)}>
              <Badge badgeContent={unreadCount} color="error" max={9}>
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
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

          <Tooltip title={mode === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}>
            <IconButton aria-label="Đổi giao diện" onClick={toggleMode}>
              {mode === 'dark' ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
            </IconButton>
          </Tooltip>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 15, fontWeight: 600 }}>
            {name.charAt(0).toUpperCase()}
          </Avatar>
        </Stack>
      </Toolbar>
    </AppBar>
  )
}
