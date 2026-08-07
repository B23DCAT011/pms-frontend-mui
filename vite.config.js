import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base mặc định là '/': app nằm ở gốc tên miền EC2. Trước đây phải đặt '/pms-frontend-mui/'
// vì GitHub Pages phục vụ site trong thư mục con mang tên repo.
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
  },
})
