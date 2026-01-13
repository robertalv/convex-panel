// Patch module resolution for metro-cache-key and metro-runtime before any modules are loaded
// This ensures the patch is applied even in worker processes spawned by Metro
const path = require('path');
const fs = require('fs');
const Module = require('module');

const workspaceRoot = path.resolve(__dirname, '../..');
const projectRoot = __dirname;
const originalResolveFilename = Module._resolveFilename;

function resolveMetroPackage(packageName, version, request, parent) {
  // Handle both package name and package.json requests
  const isPackageJsonRequest = request.endsWith('/package.json');
  const basePackageName = isPackageJsonRequest ? request.replace('/package.json', '') : request;
  
  if (basePackageName !== packageName) {
    return null;
  }

  // Try multiple resolution paths including pnpm virtual store
  const resolutionPaths = [
    path.resolve(workspaceRoot, 'node_modules'),
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, `node_modules/.pnpm/${packageName}@${version}/node_modules`),
  ];
  
  // Also try to find it in any package location in pnpm store
  try {
    const pnpmStorePath = path.resolve(workspaceRoot, 'node_modules/.pnpm');
    if (fs.existsSync(pnpmStorePath)) {
      const entries = fs.readdirSync(pnpmStorePath);
      for (const entry of entries) {
        if (entry.startsWith(`${packageName}@`)) {
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
        const resolved = require.resolve(request, {
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
    return require.resolve(request, { paths: allPaths });
  } catch (e) {
    // Fall through to default resolution
    return null;
  }
}

Module._resolveFilename = function(request, parent, isMain, options) {
  // Handle metro-cache-key
  const metroCacheKeyResolved = resolveMetroPackage('metro-cache-key', '0.83.3', request, parent);
  if (metroCacheKeyResolved) {
    return metroCacheKeyResolved;
  }
  
  // Handle metro-runtime
  const metroRuntimeResolved = resolveMetroPackage('metro-runtime', '0.83.3', request, parent);
  if (metroRuntimeResolved) {
    return metroRuntimeResolved;
  }
  
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

