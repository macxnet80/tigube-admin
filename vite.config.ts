import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Kein host: true — sonst ruft Vite os.networkInterfaces() auf (fehlschlägt z. B. in Sandbox/VPN).
  // 127.0.0.1: stabiler als „localhost“ (IPv4/IPv6-Auflösung), strictPort: kein stiller Wechsel auf 5176.
  server: {
    port: 5175,
    host: '127.0.0.1',
    strictPort: true,
  },
  preview: {
    port: 4175,
    host: '127.0.0.1',
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
