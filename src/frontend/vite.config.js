import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables from .env files into the Node.js process
  // This is needed to access them inside vite.config.js
  const env = loadEnv(mode, process.cwd(), '');

  // Define the target URL for the proxy.
  // It uses VITE_API_URL from the environment, falling back to a hardcoded local URL 
  // if the variable isn't found (for maximum stability).
  const PROXY_TARGET = env.VITE_API_URL || 'http://127.0.0.1:8000';

  return {
    plugins: [react()],
    server: {
      // The proxy block is ignored in production builds.
      proxy: {
        '/api': {
          target: PROXY_TARGET,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
