import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Vercel injects VITE_ prefixed variables during build.
    // We map them to process.env.API_KEY so the existing code structure works without modification.
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || process.env.VITE_API_KEY || ''),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
  }
})
