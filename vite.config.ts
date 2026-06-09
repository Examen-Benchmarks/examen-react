import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, 'src'),
      '@examen/crud': resolve(import.meta.dirname, 'packages/crud/src/index.ts'),
    },
  },
  server: {
    // Proxy API calls to the Go backend so the browser talks same-origin:
    // no CORS, and the HttpOnly `examen_session` cookie is set/sent against
    // the dev origin. The app calls `/api/*`; we strip the prefix on the way
    // out (the backend mounts routes at the root, e.g. `/projects`).
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
