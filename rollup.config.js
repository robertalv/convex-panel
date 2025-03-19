const resolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const typescript = require('@rollup/plugin-typescript');
const terser = require('@rollup/plugin-terser');
const peerDepsExternal = require('rollup-plugin-peer-deps-external');
const url = require('@rollup/plugin-url');
const pkg = require('./package.json');
const fs = require('fs');
const path = require('path');

// Ensure the dist/styles directory exists
const stylesDir = path.join(__dirname, 'dist', 'styles');
if (!fs.existsSync(stylesDir)) {
  fs.mkdirSync(stylesDir, { recursive: true });
}

// Copy CSS files to dist/styles
const cssFiles = fs.readdirSync(path.join(__dirname, 'src', 'styles'))
  .filter(file => file.endsWith('.css'));

cssFiles.forEach(file => {
  const srcPath = path.join(__dirname, 'src', 'styles', file);
  const destPath = path.join(stylesDir, file);
  fs.copyFileSync(srcPath, destPath);
});

// Custom plugin to handle CSS imports as strings
const cssImport = () => ({
  name: 'css-import',
  transform(code, id) {
    if (id.endsWith('.css')) {
      const css = fs.readFileSync(id, 'utf-8');
      return {
        code: `export default ${JSON.stringify(css)};`,
        map: { mappings: '' }
      };
    }
  }
});

module.exports = {
  input: 'src/index.ts',
  output: [
    {
      dir: 'dist',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
      entryFileNames: 'index.js',
      chunkFileNames: 'chunks/[name]-[hash].js'
    },
    {
      dir: 'dist',
      format: 'esm',
      sourcemap: true,
      exports: 'named',
      entryFileNames: 'index.esm.js',
      chunkFileNames: 'chunks/[name]-[hash].esm.js'
    }
  ],
  plugins: [
    peerDepsExternal(),
    resolve({
      browser: true,
      preferBuiltins: false,
      resolveOnly: [
        /^(?!@monaco-editor\/react)/,
        /^(?!monaco-editor)/
      ]
    }),
    commonjs(),
    cssImport(),
    url({
      include: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.svg', '**/*.gif'],
      limit: 10000,
    }),
    typescript({
      tsconfig: './tsconfig.json',
      exclude: ['**/__tests__/**', '**/*.test.ts', '**/*.test.tsx'],
      declaration: true,
      declarationDir: './dist/types',
      rootDir: 'src',
      outDir: './dist'
    }),
    terser()
  ],
  external: [
    ...Object.keys(pkg.peerDependencies || {}),
    ...Object.keys(pkg.dependencies || {}),
    'monaco-editor',
    '@monaco-editor/react',
    /^monaco-editor\/.*/,
    /^@monaco-editor\/react\/.*/
  ],
}; 