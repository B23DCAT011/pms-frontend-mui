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
    },
  })
}
