// Patch module resolution for metro-cache-key before any modules are loaded
// This ensures the patch is applied even in worker processes spawned by Metro
const path = require('path');
const fs = require('fs');
const Module = require('module');

const workspaceRoot = path.resolve(__dirname, '../..');
const projectRoot = __dirname;
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function(request, parent, isMain, options) {
  if (request === 'metro-cache-key') {
    // Try multiple resolution paths including pnpm virtual store
    const resolutionPaths = [
      path.resolve(workspaceRoot, 'node_modules'),
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules/.pnpm/metro-cache-key@0.80.12/node_modules'),
    ];
    
    // Also try to find it in any metro-cache-key location in pnpm store
    try {
      const pnpmStorePath = path.resolve(workspaceRoot, 'node_modules/.pnpm');
      if (fs.existsSync(pnpmStorePath)) {
        const entries = fs.readdirSync(pnpmStorePath);
        for (const entry of entries) {
          if (entry.startsWith('metro-cache-key@')) {
            resolutionPaths.push(path.resolve(pnpmStorePath, entry, 'node_modules'));
          }
        }
      }
    } catch (e) {
      // Ignore errors when reading pnpm store
    }
    
    for (const resolutionPath of resolutionPaths) {
      try {
        if (fs.existsSync(resolutionPath)) {
          const resolved = require.resolve('metro-cache-key', {
            paths: [resolutionPath]
          });
          if (fs.existsSync(resolved)) {
            return resolved;
          }
        }
      } catch (e) {
        // Continue to next path
      }
    }
    
    // If all else fails, try default resolution but with expanded paths
    try {
      const parentPaths = parent && parent.paths ? parent.paths : [];
      const allPaths = [...resolutionPaths, ...parentPaths];
      if (Module._nodeModulePaths) {
        allPaths.push(...Module._nodeModulePaths(workspaceRoot));
        allPaths.push(...Module._nodeModulePaths(projectRoot));
      }
      return require.resolve('metro-cache-key', { paths: allPaths });
    } catch (e) {
      // Fall through to default resolution
    }
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

