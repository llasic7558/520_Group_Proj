import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// tells vite we're using react + jsx
export default defineConfig({
  plugins: [react()],
})
