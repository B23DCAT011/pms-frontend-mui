import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Paper from '@mui/material/Paper'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import { useNavigate } from 'react-router-dom'
import {
  listNotifications,
  loadMoreNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../api/notifications.js'
import { notificationLabel, notificationTarget } from '../components/notifications/notificationDisplay.js'
import { useNotification } from '../notifications/NotificationContext.jsx'

export default function NotificationsPage() {
  const navigate = useNavigate()
  const { notifySuccess, notifyError } = useNotification()
  const [notifications, setNotifications] = useState([])
  const [next, setNext] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    let ignore = false
    setLoading(true)
    listNotifications()
      .then((data) => {
        if (ignore) return
        setNotifications(data.results)
        setNext(data.next)
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })
    return () => {
      ignore = true
    }
  }, [])

  const handleLoadMore = () => {
    if (!next) return
    setLoadingMore(true)
    loadMoreNotifications(next)
      .then((data) => {
        setNotifications((prev) => [...prev, ...data.results])
        setNext(data.next)
      })
      .finally(() => setLoadingMore(false))
  }

  const handleClick = (notification) => {
    markNotificationRead(notification.id).catch(() => {})
    setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n)))
    const target = notificationTarget(notification)
    if (target) navigate(target)
  }

  const handleMarkAllRead = () => {
    markAllNotificationsRead()
      .then(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
        notifySuccess('Đã đánh dấu tất cả đã đọc.')
      })
      .catch(() => notifyError('Có lỗi xảy ra, thử lại sau.'))
  }

  const hasUnread = notifications.some((n) => !n.is_read)

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5">Thông báo</Typography>
        <Button onClick={handleMarkAllRead} disabled={!hasUnread}>
          Đánh dấu tất cả đã đọc
        </Button>
      </Stack>

      <Paper variant="outlined">
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">Không có thông báo nào</Typography>
          </Box>
        ) : (
          <List disablePadding>
            {notifications.map((n, index) => (
              <Box key={n.id}>
                {index > 0 && <Divider component="li" />}
                <ListItemButton onClick={() => handleClick(n)} selected={!n.is_read} sx={{ py: 1.5 }}>
                  <ListItemText primary={notificationLabel(n)} secondary={new Date(n.created_at).toLocaleString('vi-VN')} />
                </ListItemButton>
              </Box>
            ))}
          </List>
        )}
      </Paper>

      {next && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button onClick={handleLoadMore} disabled={loadingMore}>
            {loadingMore ? <CircularProgress size={20} /> : 'Xem thêm'}
          </Button>
        </Box>
      )}
    </Box>
  )
}
