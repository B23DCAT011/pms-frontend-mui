import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Avatar from '@mui/material/Avatar'
import Stack from '@mui/material/Stack'
import NotificationsIcon from '@mui/icons-material/Notifications'
import HelpOutlineIcon from '@mui/icons-material/HelpOutlineOutlined'
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined'
import { useAuth } from '../../auth/AuthContext.jsx'
import { DRAWER_WIDTH } from './Sidebar.jsx'

export default function Topbar() {
  const { user } = useAuth()

  const name = user.first_name || user.username

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
          <IconButton aria-label="Thông báo">
            <NotificationsIcon />
          </IconButton>
          <IconButton aria-label="Trợ giúp">
            <HelpOutlineIcon />
          </IconButton>
          {/* TODO: nối toggle theme sáng/tối (Giai đoạn 3) */}
          <IconButton aria-label="Đổi giao diện">
            <DarkModeOutlinedIcon />
          </IconButton>
          <Avatar sx={{ width: 32, height: 32 }}>{name.charAt(0).toUpperCase()}</Avatar>
        </Stack>
      </Toolbar>
    </AppBar>
  )
}
