/**
 * Convex Components Registry Types
 *
 * Type definitions for the component registry.
 */

/**
 * Component categories
 */
export type ComponentCategory =
  | "ai"
  | "auth"
  | "backend"
  | "database"
  | "durable-functions"
  | "integrations"
  | "payments"
  | "storage";

/**
 * Component status
 */
export type ComponentStatus = "stable" | "beta" | "coming-soon" | "deprecated";

/**
 * Package manager types
 */
export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

/**
 * Component author information
 */
export interface ComponentAuthor {
  /** Author's display name or username */
  name: string;
  /** URL to author's avatar image */
  avatar?: string;
  /** Author's GitHub username */
  github?: string;
  /** Author's website URL */
  url?: string;
}

/**
 * Component image/logo
 */
export interface ComponentImage {
  /** Image source URL */
  src: string;
  /** Image width */
  width?: number;
  /** Image height */
  height?: number;
  /** Alt text for accessibility */
  alt?: string;
}

/**
 * Documentation section for the detail panel
 */
export interface ComponentDoc {
  /** Section title */
  title: string;
  /** Section content (markdown supported) */
  content: string;
}

/**
 * A component in the registry
 */
export interface RegistryComponent {
  /** Unique identifier (slug) */
  id: string;
  /** Display name */
  name: string;
  /** Short description */
  description: string;
  /** Detailed description for the detail panel */
  longDescription?: string;
  /** Category */
  category: ComponentCategory;
  /** Component status */
  status: ComponentStatus;
  /** npm package name */
  npmPackage: string;
  /** GitHub repository URL */
  repoUrl: string;
  /** Documentation URL */
  docsUrl?: string;
  /** Weekly npm downloads */
  weeklyDownloads?: number;
  /** Component author */
  author: ComponentAuthor;
  /** Component logo/image */
  image?: ComponentImage;
  /** Documentation sections for detail panel */
  docs?: ComponentDoc[];
  /** Tags for search/filtering */
  tags?: string[];
  /** Version of the component */
  version?: string;
  /** Date added to registry (ISO string) */
  addedAt?: string;
  /** Date last updated (ISO string) */
  updatedAt?: string;
}

/**
 * Category metadata
 */
export interface CategoryInfo {
  /** Category ID */
  id: ComponentCategory;
  /** Display label */
  label: string;
  /** Category description */
  description: string;
  /** Icon name (for UI rendering) */
  icon: string;
  /** Display order */
  order: number;
}

/**
 * Installation step for progress tracking
 */
export interface InstallStep {
  id: string;
  label: string;
  status: "pending" | "running" | "completed" | "error";
  error?: string;
}

/**
 * Package manager configuration
 */
export interface PackageManagerConfig {
  id: PackageManager;
  name: string;
  installCommand: string;
  icon?: string;
}

/**
 * Registry response with metadata
 */
export interface RegistryResponse {
  /** List of components */
  components: RegistryComponent[];
  /** Total count */
  total: number;
  /** Data source */
  source: "static" | "remote" | "cache";
  /** Last updated timestamp */
  updatedAt: string;
}
