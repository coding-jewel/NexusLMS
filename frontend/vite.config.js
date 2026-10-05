import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    allowedHosts: ['.localhost'],
    // the browser calls /api on its own address, and Vite forwards it to Spring Boot
    proxy: { '/api': 'http://localhost:8080' },
  },
})