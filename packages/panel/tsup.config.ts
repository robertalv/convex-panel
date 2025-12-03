import { defineConfig } from 'tsup';

export default defineConfig([
  // Main entry point
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: true,
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
    entry: ['src/vite/index.ts'],
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
  // Next.js entry point
  {
    entry: ['src/nextjs/index.tsx'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    external: [
      'react',
      'react-dom',
      'convex',
      'next',
      'monaco-editor',
      '@monaco-editor/react',
      // Exclude CSS files from bundle
      '**/*.css',
    ],
    injectStyle: false,
    outDir: 'dist/nextjs',
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
  // React/Vite entry point
  {
    entry: ['src/react/index.tsx'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    external: [
      'react',
      'react-dom',
      'convex',
      'monaco-editor',
      '@monaco-editor/react',
      // Exclude CSS files from bundle
      '**/*.css',
    ],
    injectStyle: false,
    outDir: 'dist/react',
    outExtension({ format }) {
      return {
        js: format === 'esm' ? '.esm.js' : '.js',
      };
    },
    esbuildOptions(options) {
      // Mark CSS files as external to prevent bundling
      options.external = [...(options.external || []), '*.css'];
    },
  },
  // Svelte entry point
  {
    entry: ['src/svelte/index.tsx'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    external: [
      'react',
      'react-dom',
      'convex',
      'svelte',
      'monaco-editor',
      '@monaco-editor/react',
      // Exclude CSS and Svelte files from bundle
      '**/*.css',
      '**/*.svelte',
    ],
    injectStyle: false,
    outDir: 'dist/svelte',
    outExtension({ format }) {
      return {
        js: format === 'esm' ? '.esm.js' : '.js',
      };
    },
    esbuildOptions(options) {
      // Mark CSS and Svelte files as external to prevent bundling
      options.external = [...(options.external || []), '*.css', '*.svelte'];
    },
  },
  // Vue entry point
  {
    entry: ['src/vue/index.ts'],
    format: ['cjs', 'esm'],
    dts: false,
    splitting: false,
    sourcemap: true,
    external: [
      'react',
      'react-dom',
      'convex',
      'vue',
      'monaco-editor',
      '@monaco-editor/react',
      // Exclude CSS and Vue files from bundle
      '**/*.css',
      '**/*.vue',
    ],
    injectStyle: false,
    outDir: 'dist/vue',
    outExtension({ format }) {
      return {
        js: format === 'esm' ? '.esm.js' : '.js',
      };
    },
    esbuildOptions(options) {
      // Mark CSS and Vue files as external to prevent bundling
      options.external = [...(options.external || []), '*.css', '*.vue'];
    },
  },
]);

