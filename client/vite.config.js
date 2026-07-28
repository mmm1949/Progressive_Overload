import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(), // 2. Add it to your plugins array
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
