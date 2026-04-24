import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// tells vite we're using react + jsx
export default defineConfig({
  plugins: [react()],
  // host: true binds 0.0.0.0 so the Vite dev server is reachable from
  // outside the container (when running under docker compose --profile full).
  // port: 3000 keeps the same URL in both host-dev and container paths.
  server: {
    port: 3000,
    host: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setupTests.js',
    css: true,
  },
})
