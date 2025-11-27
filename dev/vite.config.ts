import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, '.'),
  resolve: {
    alias: {
      // Resolve imports to source files for live editing
      'convex-panel': path.resolve(__dirname, '../src'),
    },
  },
  server: {
    port: 5173,
    fs: {
      allow: ['..'],
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'convex/react',
      '@monaco-editor/react',
      'monaco-editor/esm/vs/editor/editor.api',
    ],
  },
  build: {
    commonjsOptions: {
      include: [/monaco-editor/, /node_modules/],
    },
  },
});

