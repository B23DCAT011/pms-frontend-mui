import { createTheme } from '@mui/material/styles'

export default function getTheme(mode) {
  return createTheme({
    palette: {
      mode,
      primary: {
        light: '#f79a52', // brand-400
        main: '#f27a18', // brand-500
        dark: '#d96a12', // brand-600
        contrastText: '#ffffff',
      },
      ...(mode === 'dark' && {
        // Xám-xanh đậm thay vì đen xám (#121212) mặc định của MUI — "paper" sáng hơn
        // "default" 1 chút để Paper/Card vẫn nổi khối rõ trên nền, không cần dựa hẳn vào
        // border để phân biệt.
        background: {
          default: '#15171e',
          paper: '#1c1f28',
        },
      }),
    },
  })
}
