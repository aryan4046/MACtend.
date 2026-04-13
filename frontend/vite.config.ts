import { defineConfig } from 'vite'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    // ✅ FORCE Raspberry Pi hotspot interface
    host: true,
    
    // ✅ Prevent Vite from hiding our bat messages
    clearScreen: false,

    // ✅ frontend port
    port: 5173,
    strictPort: true,

    // ✅ allow mobile access
    cors: true,
    https: false,

    // ✅ Fix mobile hot reload issues
    hmr: {
      host: "0.0.0.0",
      protocol: "ws"
    },

    // ✅ Backend Flask proxy

  },

  assetsInclude: ['**/*.svg', '**/*.csv'],
})