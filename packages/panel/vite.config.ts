import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
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
