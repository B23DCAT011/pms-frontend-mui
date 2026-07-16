import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/pms-frontend-mui/' : '/',
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
  },
}))
