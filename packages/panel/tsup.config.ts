import { defineConfig } from 'tsup';

export default defineConfig([
  // Main entry point
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    external: [
      'react',
      'react-dom',
      'convex',
      'next',
      'monaco-editor',
      '@monaco-editor/react',
      'vite',
    ],
    injectStyle: false,
    outExtension({ format }) {
      return {
        js: format === 'esm' ? '.esm.js' : '.js',
      };
    },
    esbuildOptions(options) {
      options.banner = {
        js: '"use client";',
      };
    },
    loader: {
      '.css': 'css',
    },
  },
  // Vite plugin entry point
  {
    entry: ['src/vite.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    external: ['vite'],
    outDir: 'dist',
    outExtension({ format }) {
      return {
        js: format === 'esm' ? '.esm.js' : '.js',
      };
    },
  },
]);

