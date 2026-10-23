import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
// @ts-expect-error Import pure ESM server handler for Vite development middleware
import { handleAIEndpoint } from './server/aiRouter.js';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load server-side environment variables from .env and .env.local (including non-VITE keys)
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'echotutor-ai-backend',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const reqUrl = (req as { url?: string }).url;
            if (reqUrl && reqUrl.startsWith('/api/ai')) {
              handleAIEndpoint(req, res, env);
            } else {
              next();
            }
          });
        },
      },
    ],
    server: {
      port: 5173,
      host: true,
    },
  };
});
