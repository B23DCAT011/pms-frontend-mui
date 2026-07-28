import { useState } from 'react'
import Box from '@mui/material/Box'
import Toolbar from '@mui/material/Toolbar'
import { Outlet } from 'react-router-dom'
import Sidebar, { DRAWER_WIDTH } from './Sidebar.jsx'
import Topbar from './Topbar.jsx'

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <Box sx={{ display: 'flex' }}>
      <Topbar onOpenMenu={() => setMobileOpen(true)} />

      {/* Hai Drawer riêng thay vì một cái đổi variant theo breakpoint: MUI cần variant cố
          định để giữ đúng hành vi (permanent không có backdrop, temporary thì có), đổi qua
          lại lúc resize sẽ dựng lại DOM và mất trạng thái. Mỗi cái tự ẩn bằng `display`. */}
      <Sidebar />
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      <Box
        component="main"
        sx={{ flexGrow: 1, minWidth: 0, p: { xs: 2, sm: 3 }, width: { md: `calc(100% - ${DRAWER_WIDTH}px)` } }}
      >
        <Toolbar />
        <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
