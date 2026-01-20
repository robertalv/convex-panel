// Load metro-resolve-patch before any modules are loaded
// This ensures proper module resolution for metro packages in pnpm workspaces
require("./metro-resolve-patch");

// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const fs = require("fs");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch all files in the monorepo (merge with defaults)
config.watchFolders = [...(config.watchFolders || []), workspaceRoot];

// Let Metro handle workspace packages
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Configure path aliases to match TypeScript paths
config.resolver.alias = {
  "@": path.resolve(projectRoot, "src"),
};

// Ensure Metro can resolve the alias properly
config.resolver.sourceExts = [...(config.resolver.sourceExts || []), "tsx", "ts"];

// Custom resolver to handle @ alias
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Handle @ alias
  if (moduleName.startsWith("@/")) {
    const aliasPath = moduleName.replace("@/", "");
    const absolutePath = path.resolve(projectRoot, "src", aliasPath);
    
    // Try to resolve with extensions
    const extensions = [".tsx", ".ts", ".jsx", ".js", ".json", ""];
    for (const ext of extensions) {
      const fullPath = absolutePath + ext;
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
        return {
          filePath: fullPath,
          type: "sourceFile",
        };
      }
    }
    
    // If not found, try as directory with index file
    if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isDirectory()) {
      for (const ext of extensions) {
        const indexPath = path.join(absolutePath, `index${ext}`);
        if (fs.existsSync(indexPath)) {
          return {
            filePath: indexPath,
            type: "sourceFile",
          };
        }
      }
    }
  }
  
  // Fall back to default resolver
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
