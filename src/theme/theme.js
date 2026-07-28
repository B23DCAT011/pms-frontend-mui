import { createTheme } from '@mui/material/styles'

export default function getTheme(mode) {
  const isDark = mode === 'dark'

  return createTheme({
    palette: {
      mode,
      primary: {
        light: '#f79a52', // brand-400
        main: '#f27a18', // brand-500
        dark: '#d96a12', // brand-600
        contrastText: '#ffffff',
      },
      ...(isDark
        ? {
            // Xám-xanh đậm thay vì đen xám (#121212) mặc định của MUI — "paper" sáng hơn
            // "default" 1 chút để Paper/Card vẫn nổi khối rõ trên nền, không cần dựa hẳn vào
            // border để phân biệt.
            background: { default: '#15171e', paper: '#1c1f28' },
            divider: 'rgba(255,255,255,0.09)',
          }
        : {
            // Nền xám rất nhạt (không phải trắng tinh) để Card/Paper trắng nổi lên trên nó —
            // cùng nguyên tắc với dark mode ở trên, chỉ đảo chiều sáng/tối.
            background: { default: '#f7f8fa', paper: '#ffffff' },
            divider: 'rgba(0,0,0,0.08)',
          }),
    },

    shape: { borderRadius: 10 },

    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h4: { fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em' },
      h5: { fontSize: '1.35rem', fontWeight: 700, letterSpacing: '-0.015em' },
      h6: { fontSize: '1.05rem', fontWeight: 600, letterSpacing: '-0.01em' },
      subtitle2: { fontWeight: 600 },
      button: { textTransform: 'none', fontWeight: 600 },
    },

    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
      },
      MuiCard: {
        defaultProps: { variant: 'outlined' },
      },
      MuiPaper: {
        styleOverrides: {
          // Paper mặc định của MUI phủ thêm background-image gradient ở dark mode, làm màu
          // nền lệch khỏi giá trị đã khai ở palette.background.paper.
          root: { backgroundImage: 'none' },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            '&.Mui-selected': {
              backgroundColor: theme.palette.primary.main + (isDark ? '2b' : '1f'),
              '&:hover': { backgroundColor: theme.palette.primary.main + (isDark ? '3b' : '2f') },
            },
          }),
        },
      },
      MuiTextField: {
        defaultProps: { size: 'small' },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          // Ô đã autofill có 2 thứ tô nền đè lên: Chrome tô nền của chính nó, và MUI hardcode
          // `0 0 0 100px #266798 inset` (xanh) cho dark mode ngay trên slot `input` này.
          //
          // Không set đè `background-color` được (Chrome khoá bằng !important). Cách phủ lại
          // bằng box-shadow inset thì kín nền nhưng chỉ phủ trong lòng thẻ <input> — không
          // với tới vùng adornment (nút con mắt), nên lộ mép ở ranh giới hai vùng.
          //
          // Nên thay vì phủ đè, chặn luôn: đặt transition-delay cực lớn cho background-color
          // khiến màu nền của Chrome không bao giờ kịp hiện, và tắt box-shadow của MUI. Kết
          // quả là ô giữ nguyên nền trong suốt như ô chưa autofill, không phụ thuộc màu nền
          // của phần tử cha. Chỉ còn màu chữ phải chỉ định tay vì Chrome ép qua
          // -webkit-text-fill-color.
          input: ({ theme }) => ({
            '&:-webkit-autofill, &:-webkit-autofill:hover, &:-webkit-autofill:focus': {
              transition: 'background-color 600000s 0s, color 600000s 0s',
              WebkitBoxShadow: 'none',
              WebkitTextFillColor: theme.palette.text.primary,
              caretColor: theme.palette.text.primary,
            },
          }),
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 600 },
        },
      },
      MuiTooltip: {
        defaultProps: { arrow: true },
      },
    },
  })
}
