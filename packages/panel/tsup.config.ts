import { defineConfig } from 'tsup';

export default defineConfig([
  // Main entry point
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: false,
    external: [
      'react',
      'react-dom',
      'convex',
      'next',
      'monaco-editor',
      '@monaco-editor/react',
      'vite',
      // Exclude CSS files from bundle - they are injected at runtime
      '**/*.css',
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
      // Mark CSS files as external to prevent bundling
      options.external = [...(options.external || []), '*.css'];
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

