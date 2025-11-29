import { defineConfig, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { convexPanel } from '../../packages/panel/src/vite-plugin'

import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    convexPanel() as PluginOption
  ],
  resolve: {
    alias: {
      '@convex-panel/panel/styles.css': path.resolve(__dirname, '../../packages/panel/src/styles/tailwind.css'),
      '@convex-panel/panel': path.resolve(__dirname, '../../packages/panel/src/index.ts'),
    },
  },
})
