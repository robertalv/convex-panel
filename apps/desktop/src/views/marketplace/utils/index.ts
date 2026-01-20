/**
 * Marketplace utility functions
 * Centralized exports for better organization
 */

export { detectPackageManagerFromLockFiles } from "./package-manager";
export {
  extractComponentPackagesFromConfig,
  getInstalledComponentsFromConfig,
} from "./convex-config";
export { getInstalledPackages } from "./installed-packages";
