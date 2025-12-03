import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { convexPanel } from './src/vite';

export { convexPanel } from './src/vite';
export type { ConvexPanelVitePluginConfig } from './src/vite';

// Default config for the panel package itself
export default defineConfig({
  plugins: [react(), convexPanel()],
  optimizeDeps: {
    include: [
      '@monaco-editor/react',
      'monaco-editor/esm/vs/editor/editor.api',
    ],
  },
  build: {
    commonjsOptions: {
      include: [/monaco-editor/],
    },
  },
});
