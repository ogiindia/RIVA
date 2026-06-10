import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // ── RIVA Java backend (Spring Boot :8080) ─────────────────────────────
  const rivaHost = env.VITE_RIVA_HOST || '127.0.0.1'
  const rivaPort = env.VITE_RIVA_PORT || '8080'
  const rivaUrl  = `http://${rivaHost}:${rivaPort}`

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      hmr: { path: '/__vite_hmr', host: env.VITE_PUBLIC_HOST || undefined },
      proxy: {
        // RIVA Java backend — strip the /riva prefix before forwarding
        '/riva': {
          target: rivaUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/riva/, ''),
        },
      },
    },
  }
})
