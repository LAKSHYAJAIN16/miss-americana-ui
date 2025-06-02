// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/ytproxy': {
        target: 'https://www.youtube.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ytproxy/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.removeHeader('user-agent') // Not allowed by browser
            proxyReq.setHeader('access-control-allow-credentials', 'true') // Ensure protocol is HTTPS
          })
        }
      }
    }
  }
})
