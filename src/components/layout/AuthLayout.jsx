import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import ViewKanbanOutlinedIcon from '@mui/icons-material/ViewKanbanOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined'
import logo from '../../assets/kiai-logo.png'

const FEATURES = [
  { icon: ViewKanbanOutlinedIcon, text: 'Quản lý dự án và công việc trên bảng Kanban' },
  { icon: GroupsOutlinedIcon, text: 'Giao việc, thảo luận và đính kèm tài liệu' },
  { icon: NotificationsActiveOutlinedIcon, text: 'Thông báo và nhắc hạn tự động' },
]

// Vòng tròn trang trí, nhắc lại hình khối trong logo KIAI. Đặt tràn ra ngoài mép để
// tạo chiều sâu mà không cần ảnh nền.
function Blob({ size, top, left, right, bottom, opacity }) {
  return (
    <Box
      aria-hidden
      sx={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: '50%',
        bgcolor: '#fff',
        opacity,
        top,
        left,
        right,
        bottom,
      }}
    />
  )
}

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex' }}>
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          width: '44%',
          maxWidth: 560,
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
          p: 6,
          color: '#fff',
          background: 'linear-gradient(145deg, #f79a52 0%, #f27a18 45%, #cf4718 100%)',
        }}
      >
        <Blob size={320} top={-120} right={-90} opacity={0.12} />
        <Blob size={180} bottom={-40} left={-60} opacity={0.1} />
        <Blob size={80} bottom={140} left={130} opacity={0.14} />

        <Box sx={{ position: 'relative', bgcolor: '#fff', borderRadius: 2, px: 2, py: 1.25, alignSelf: 'flex-start' }}>
          <Box component="img" src={logo} alt="KIAI" sx={{ height: 30, display: 'block' }} />
        </Box>

        <Box sx={{ position: 'relative' }}>
          <Typography variant="h3" sx={{ fontWeight: 700, letterSpacing: '-0.02em', mb: 1.5 }}>
            Hệ thống quản lý công việc nội bộ
          </Typography>
          <Typography sx={{ opacity: 0.9, mb: 4, maxWidth: 420 }}>
            Theo dõi tiến độ dự án, phân công và trao đổi công việc trong cùng một nơi.
          </Typography>

          <Stack spacing={2}>
            {FEATURES.map(({ icon: Icon, text }) => (
              <Stack key={text} direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    bgcolor: 'rgba(255,255,255,0.18)',
                  }}
                >
                  <Icon fontSize="small" />
                </Box>
                <Typography variant="body2" sx={{ opacity: 0.95 }}>
                  {text}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>

        <Typography variant="caption" sx={{ position: 'relative', opacity: 0.7 }}>
          © {new Date().getFullYear()} KIAI Software
        </Typography>
      </Box>

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 3, sm: 5 },
          // `paper` (không phải `default`) để nửa chứa form nổi rõ tách khỏi nửa gradient
          // thương hiệu — ở light mode là nền trắng, đúng kiểu bố cục 2 cột thường thấy.
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          {/* Panel thương hiệu bị ẩn dưới md nên logo phải xuất hiện lại ở đây,
              không thì màn hình nhỏ mất hoàn toàn nhận diện. */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'center', mb: 4 }}>
            <Box component="img" src={logo} alt="KIAI" sx={{ height: 34 }} />
          </Box>

          <Typography variant="h5" sx={{ mb: subtitle ? 0.5 : 3 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography color="text.secondary" variant="body2" sx={{ mb: 3 }}>
              {subtitle}
            </Typography>
          )}

          {children}
        </Box>
      </Box>
    </Box>
  )
}
