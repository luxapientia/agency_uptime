import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const staticPath = path.join(__dirname, '../CentralServer/public');

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    base: env.VITE_ROOT_URL || '/',
    plugins: [react()],
    build: {
      outDir: staticPath,
      emptyOutDir: true, // Clean the output directory before build
    },
    server: {
      host: '0.0.0.0', // Allow external connections
      port: 5173, // Default Vite port
      strictPort: false, // Allow fallback to next available port
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:3000',
          changeOrigin: true,
        }
      }
    }
  }
})
