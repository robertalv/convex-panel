import { defineConfig, loadEnv, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { convexPanel } from '../../packages/panel/src/vite'

import path from 'path';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Load all env variables from .env files (Vite loads them automatically)
  const env = loadEnv(mode, process.cwd(), '');
  const convexAccessToken = env.CONVEX_ACCESS_TOKEN || process.env.CONVEX_ACCESS_TOKEN || '';
  
  // Expose CONVEX_ACCESS_TOKEN as VITE_CONVEX_ACCESS_TOKEN so it's available in import.meta.env
  // Vite only exposes env vars starting with VITE_ to the client
  // We need to set this before Vite processes env vars, so we do it here
  if (convexAccessToken) {
    process.env.VITE_CONVEX_ACCESS_TOKEN = convexAccessToken;
  }
  
  return {
    plugins: [
      // Plugin to ensure CONVEX_ACCESS_TOKEN is exposed as VITE_CONVEX_ACCESS_TOKEN
      // This runs early in the plugin chain
      {
        name: 'expose-convex-access-token',
        config() {
          // This runs before other plugins, ensuring the env var is set early
          const token = env.CONVEX_ACCESS_TOKEN || process.env.CONVEX_ACCESS_TOKEN || '';
          if (token && !process.env.VITE_CONVEX_ACCESS_TOKEN) {
            process.env.VITE_CONVEX_ACCESS_TOKEN = token;
          }
        },
      } as PluginOption,
      react(), 
      tailwindcss(),
      convexPanel() as PluginOption,
    ],
    resolve: {
      alias: {
        '@shared': path.resolve(__dirname, '../../packages/shared/src'),
        'convex-panel/styles.css': path.resolve(
          __dirname,
          '../../packages/panel/src/styles/tailwind.css',
        ),
        'convex-panel/nextjs': path.resolve(
          __dirname,
          '../../packages/panel/src/nextjs/index.tsx',
        ),
        'convex-panel/react': path.resolve(
          __dirname,
          '../../packages/panel/src/react/index.tsx',
        ),
        'convex-panel': path.resolve(__dirname, '../../packages/panel/src/index.ts'),
      },
      // Ensure all packages (including convex-panel and framer-motion)
      // share a single React instance to avoid "invalid hook call" errors.
      dedupe: ['react', 'react-dom'],
    },
    define: {
      __CONVEX_ACCESS_TOKEN__: JSON.stringify(convexAccessToken),
    },
  };
})
