import { defineConfig } from 'tsup';

export default defineConfig({
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
});

