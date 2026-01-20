/**
 * Convex Components Registry
 *
 * This package provides access to the Convex component registry,
 * including component metadata, categories, and installation utilities.
 */

// Types
export type {
  ComponentCategory,
  ComponentStatus,
  PackageManager,
  ComponentAuthor,
  ComponentImage,
  ComponentDoc,
  RegistryComponent,
  CategoryInfo,
  InstallStep,
  PackageManagerConfig,
  RegistryResponse,
} from "./types";

// Categories
export {
  CATEGORIES,
  getCategories,
  getCategoryById,
  getCategoryLabel,
  PACKAGE_MANAGERS,
  getPackageManagers,
  getInstallCommand,
} from "./categories";

// Registry API
export {
  getComponents,
  getComponentById,
  getComponentsByCategory,
  getComponentsByStatus,
  searchComponents,
  filterComponents,
  getComponentCountByCategory,
  getAllTags,
  sortComponents,
} from "./registry";

// README fetching services
export {
  fetchReadmeFromGitHub,
  fetchReadmeFromNpm,
  fetchComponentReadme,
} from "./services/readme-fetcher";

// README cache utilities
export {
  getCachedReadme,
  setCachedReadme,
  clearCachedReadme,
  clearAllCachedReadmes,
  getCacheAge,
} from "./services/readme-cache";

// README React hook
export {
  useComponentReadme,
  type UseComponentReadmeResult,
} from "./hooks/useComponentReadme";
