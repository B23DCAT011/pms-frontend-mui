import { NavLink, useLocation } from 'react-router-dom'
import Drawer from '@mui/material/Drawer'
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Avatar from '@mui/material/Avatar'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import DashboardIcon from '@mui/icons-material/Dashboard'
import FolderIcon from '@mui/icons-material/Folder'
import TaskAltIcon from '@mui/icons-material/TaskAlt'
import SettingsIcon from '@mui/icons-material/Settings'
import LogoutIcon from '@mui/icons-material/Logout'
import { useAuth } from '../../auth/AuthContext.jsx'
import logo from '../../assets/kiai-logo.png'

export const DRAWER_WIDTH = 240

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: DashboardIcon, end: true },
  { to: '/projects', label: 'Projects', icon: FolderIcon },
  { to: '/my-tasks', label: 'My Tasks', icon: TaskAltIcon },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

export default function Sidebar() {
  const location = useLocation()
  const { user, logout } = useAuth()

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.username
  const initial = (user?.first_name || user?.username || '?').charAt(0).toUpperCase()

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', px: 2.5, py: 2.5 }}>
        <Box component="img" src={logo} alt="KIAI" sx={{ height: 32, width: 'auto' }} />
      </Box>
      <List sx={{ px: 1, flex: 1 }}>
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => {
          const selected = end ? location.pathname === to : location.pathname.startsWith(to)
          return (
            <ListItemButton key={to} component={NavLink} to={to} selected={selected} sx={{ borderRadius: 1, mb: 0.5 }}>
              <ListItemIcon>
                <Icon color={selected ? 'primary' : 'inherit'} />
              </ListItemIcon>
              <ListItemText primary={label} />
            </ListItemButton>
          )
        })}
      </List>

      <Divider />
      <Box sx={{ p: 1.5 }}>
        <ListItemButton onClick={logout} sx={{ borderRadius: 1, mb: 0.5 }}>
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Log out" />
        </ListItemButton>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1 }}>
          <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>{initial}</Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {fullName}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
              {user?.role}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Drawer>
  )
}
