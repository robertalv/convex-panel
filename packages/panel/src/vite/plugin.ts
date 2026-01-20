import type { Plugin } from 'vite';

/**
 * Remove ConvexPanel imports and JSX usage from production builds.
 * This ensures zero bundle size impact in production.
 */
function removeConvexPanel(code: string, id: string): { code: string; map?: any } | null {
  // Skip node_modules and other external files
  if (id.includes('node_modules') || id.includes('?raw')) {
    return null;
  }

  let transformed = code;
  let hasChanges = false;

  const importPatterns = [
    /import\s+ConvexPanel\s+from\s+["']convex-panel["'];?\n?/g,
    /import\s*{\s*ConvexPanel\s*}\s+from\s+["']convex-panel["'];?\n?/g,
    /import\s+ConvexPanel\s*,\s*\{[^}]*\}\s+from\s+["']convex-panel["'];?\n?/g,
    /import\s+.*\s+as\s+ConvexPanel\s+from\s+["']convex-panel["'];?\n?/g,
  ];

  importPatterns.forEach((pattern) => {
    if (pattern.test(transformed)) {
      transformed = transformed.replace(pattern, '');
      hasChanges = true;
    }
  });

  const cssImportPattern = /import\s+["']convex-panel\/styles\.css["'];?\n?/g;
  if (cssImportPattern.test(transformed)) {
    transformed = transformed.replace(cssImportPattern, '');
    hasChanges = true;
  }

  const jsxPatterns = [
    /<ConvexPanel\s+[^/>]*\/\s*>/g,
    /<ConvexPanel\s*\/\s*>/g,
    /<ConvexPanel\s+[^>]*>[\s\S]*?<\/ConvexPanel>/g,
    /<ConvexPanel>[\s\S]*?<\/ConvexPanel>/g,
  ];

  jsxPatterns.forEach((pattern) => {
    if (pattern.test(transformed)) {
      transformed = transformed.replace(pattern, '');
      hasChanges = true;
    }
  });

  const commentPattern = /\/\*[\s\S]*?ConvexPanel[\s\S]*?\*\//g;
  if (commentPattern.test(transformed)) {
    transformed = transformed.replace(commentPattern, '');
    hasChanges = true;
  }

  if (!hasChanges) {
    return null;
  }

  return {
    code: transformed,
  };
}

export type ConvexPanelVitePluginConfig = {
  /**
   * Whether to remove ConvexPanel from production builds.
   * @default true
   */
  removeOnBuild?: boolean;

  /**
   * Whether to log when ConvexPanel code is removed.
   * @default false
   */
  logging?: boolean;
};

/**
 * Vite plugin to automatically remove ConvexPanel from production builds.
 * 
 * @example
 * ```ts
 * // vite.config.ts
 * import { defineConfig } from 'vite';
 * import { convexPanel } from 'convex-panel/vite';
 * 
 * export default defineConfig({
 *   plugins: [
 *     convexPanel(),
 *     // ... other plugins
 *   ],
 * });
 * ```
 */
export function convexPanel(config: ConvexPanelVitePluginConfig = {}): Plugin {
  const removeOnBuild = config.removeOnBuild ?? true;

  return {
    name: 'convex-panel:remove-on-build',
    enforce: 'pre',
    apply(config, { command }) {
      return (
        (command !== 'serve' || config.mode === 'production') &&
        removeOnBuild
      );
    },
    transform(code, id) {
      if (!code) return null;

      const transform = removeConvexPanel(code, id);
      if (!transform) return null;

      return transform;
    },
  };
}



