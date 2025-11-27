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

// Copy CSS files to dist/styles (if src/styles exists)
const srcStylesDir = path.join(__dirname, 'src', 'styles');
if (fs.existsSync(srcStylesDir)) {
  const cssFiles = fs.readdirSync(srcStylesDir)
    .filter(file => file.endsWith('.css'));

  cssFiles.forEach(file => {
    const srcPath = path.join(srcStylesDir, file);
    const destPath = path.join(stylesDir, file);
    fs.copyFileSync(srcPath, destPath);
  });
}

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

// Custom plugin to handle Monaco Editor's this context
const fixMonacoThis = () => ({
  name: 'fix-monaco-this',
  transform(code, id) {
    if (id.includes('monaco-editor')) {
      // Replace the problematic __decorate expression
      return code.replace(
        /var __decorate = \(this && this\.__decorate\) \|\|/g,
        'var __decorate = (typeof window !== "undefined" ? window : global).__decorate ||'
      );
    }
    return null;
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
      chunkFileNames: 'chunks/[name]-[hash].js',
      strict: false,
      freeze: false,
      esModule: false,
      globals: {
        'monaco-editor': 'monaco'
      }
    },
    {
      dir: 'dist',
      format: 'esm',
      sourcemap: true,
      exports: 'named',
      entryFileNames: 'index.esm.js',
      chunkFileNames: 'chunks/[name]-[hash].esm.js',
      strict: false,
      freeze: false,
      globals: {
        'monaco-editor': 'monaco'
      }
    }
  ],
  plugins: [
    peerDepsExternal(),
    resolve({
      browser: true,
      preferBuiltins: false,
      mainFields: ['module', 'main', 'browser']
    }),
    fixMonacoThis(),
    commonjs({
      include: /node_modules/,
      transformMixedEsModules: true,
      ignoreDynamicRequires: true
    }),
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
    terser({
      format: {
        comments: false
      },
      mangle: {
        keep_fnames: true,
        keep_classnames: true
      }
    })
  ],
  external: [
    ...Object.keys(pkg.peerDependencies || {}),
    ...Object.keys(pkg.dependencies || {}),
    /^monaco-editor/
  ],
  onwarn(warning, warn) {
    // Skip certain warnings
    if (warning.code === 'THIS_IS_UNDEFINED' || 
        warning.code === 'CIRCULAR_DEPENDENCY' ||
        warning.code === 'EVAL') {
      return;
    }
    // Use default for everything else
    warn(warning);
  }
}; 