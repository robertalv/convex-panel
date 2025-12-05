import { defineConfig } from 'tsup';

// ALL heavy dependencies that should NOT be bundled
const sharedExternal = [
  'react',
  'react-dom',
  'react/jsx-runtime',
  'convex',
  'convex/react',
  'convex/browser',
  
  // Heavy UI libraries - DON'T bundle these!
  'monaco-editor',
  '@monaco-editor/react',
  'lucide-react',
  'framer-motion',
  'recharts',
  'sonner',
  'react-window',
  'react-helmet',
  'react-hotkeys-hook',
  'react-use',
  
  // Utilities
  'date-fns',
  'classnames',
  'lodash',
  'swr',
  'debounce',
  
  // Framework specific
  'vite',
  'next',
  'next/*',
  'svelte',
  'vue',
  '@nuxt/*',
];

// Shared esbuild options
const getEsbuildOptions = (useClient = false) => (options: any) => {
  if (useClient) {
    options.banner = { js: '"use client";' };
  }
  options.external = [...(options.external || []), '*.css'];
  options.treeShaking = true;
  options.legalComments = 'none';
};

export default defineConfig([
  // Main entry point (core library)
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: true, // Enable code splitting
    treeshake: true,
    sourcemap: true,
    clean: true,
    minify: true,
    external: sharedExternal,
    injectStyle: false,
    target: 'es2020',
    outExtension({ format }) {
      return {
        js: format === 'esm' ? '.esm.js' : '.js',
      };
    },
    esbuildOptions: getEsbuildOptions(true),
  },
  
  // Vite plugin (minimal bundle)
  {
    entry: ['src/vite/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false, // Keep as single bundle for plugin
    treeshake: true,
    sourcemap: true,
    minify: true,
    external: [...sharedExternal, 'vite'],
    target: 'es2020',
    outDir: 'dist',
    outExtension({ format }) {
      return {
        js: format === 'esm' ? '.esm.js' : '.js',
      };
    },
    esbuildOptions: getEsbuildOptions(false),
  },
  
  // Next.js adapter
  {
    entry: ['src/nextjs/index.tsx'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: true, // Enable splitting for Next.js
    treeshake: true,
    sourcemap: true,
    minify: true,
    external: [...sharedExternal, 'next', 'next/*'],
    injectStyle: false,
    target: 'es2020',
    outDir: 'dist/nextjs',
    outExtension({ format }) {
      return {
        js: format === 'esm' ? '.esm.js' : '.js',
      };
    },
    esbuildOptions: getEsbuildOptions(true),
  },
  
  // React/Vite adapter
  {
    entry: ['src/react/index.tsx'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: true, // Enable splitting
    treeshake: true,
    sourcemap: true,
    minify: true,
    external: sharedExternal,
    injectStyle: false,
    target: 'es2020',
    outDir: 'dist/react',
    outExtension({ format }) {
      return {
        js: format === 'esm' ? '.esm.js' : '.js',
      };
    },
    esbuildOptions: getEsbuildOptions(false),
  },
  
  // Svelte adapter
  {
    entry: ['src/svelte/index.tsx'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: true,
    treeshake: true,
    sourcemap: true,
    minify: true,
    external: [...sharedExternal, 'svelte', '**/*.svelte', '*.svelte'],
    injectStyle: false,
    target: 'es2020',
    outDir: 'dist/svelte',
    outExtension({ format }) {
      return {
        js: format === 'esm' ? '.esm.js' : '.js',
      };
    },
    esbuildOptions: getEsbuildOptions(false),
  },
  
  // Vue adapter
  {
    entry: ['src/vue/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: true,
    treeshake: true,
    sourcemap: true,
    minify: true,
    external: [...sharedExternal, 'vue', '**/*.vue', '*.vue'],
    injectStyle: false,
    target: 'es2020',
    outDir: 'dist/vue',
    outExtension({ format }) {
      return {
        js: format === 'esm' ? '.esm.js' : '.js',
      };
    },
    esbuildOptions(options) {
      options.external = [...(options.external || []), '*.css', '*.vue'];
      options.treeShaking = true;
      options.legalComments = 'none';
    },
  },
]);