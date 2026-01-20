/**
 * Marketplace types for Convex Components
 * Used for fetching and displaying components from convex.dev/components
 */

/**
 * Component categories as used on convex.dev/components
 */
export type MarketplaceCategory =
  | "ai"
  | "backend"
  | "database"
  | "durable-functions"
  | "integrations"
  | "payments";

/**
 * Display-friendly category names
 */
export const MARKETPLACE_CATEGORY_LABELS: Record<MarketplaceCategory, string> =
  {
    ai: "AI",
    backend: "Backend",
    database: "Database",
    "durable-functions": "Durable Functions",
    integrations: "Integrations",
    payments: "Payments",
  };

/**
 * A component from the Convex marketplace
 */
export interface MarketplaceComponent {
  /** Unique identifier (e.g., "rate-limiter", "agent") */
  id: string;
  /** Display name (e.g., "Rate Limiter", "AI Agent") */
  title: string;
  /** Short description */
  description: string;
  /** Category */
  category: MarketplaceCategory;
  /** npm package name (e.g., "@convex-dev/rate-limiter") */
  npmPackage: string;
  /** GitHub repository URL */
  repoUrl: string;
  /** Weekly downloads from npm */
  weeklyDownloads: number;
  /** Author information */
  author: {
    username: string;
    avatar: string;
  };
  /** Component image (optional) */
  image?: {
    src: string;
    width?: number;
    height?: number;
  };
}

/**
 * Package manager types
 */
export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

/**
 * Package manager configuration
 */
export interface PackageManagerConfig {
  name: PackageManager;
  displayName: string;
  installCommand: string;
  addCommand: string;
  lockFile: string;
}

/**
 * Package manager configurations
 */
export const PACKAGE_MANAGER_CONFIGS: Record<
  PackageManager,
  PackageManagerConfig
> = {
  npm: {
    name: "npm",
    displayName: "npm",
    installCommand: "npm install",
    addCommand: "npm install",
    lockFile: "package-lock.json",
  },
  pnpm: {
    name: "pnpm",
    displayName: "pnpm",
    installCommand: "pnpm install",
    addCommand: "pnpm add",
    lockFile: "pnpm-lock.yaml",
  },
  yarn: {
    name: "yarn",
    displayName: "Yarn",
    installCommand: "yarn install",
    addCommand: "yarn add",
    lockFile: "yarn.lock",
  },
  bun: {
    name: "bun",
    displayName: "Bun",
    installCommand: "bun install",
    addCommand: "bun add",
    lockFile: "bun.lockb",
  },
};

/**
 * Installation step status
 */
export type InstallStepStatus =
  | "pending"
  | "running"
  | "success"
  | "error"
  | "skipped";

/**
 * A step in the installation process
 */
export interface InstallStep {
  id: string;
  name: string;
  description: string;
  status: InstallStepStatus;
  output?: string;
  error?: string;
}

/**
 * Installation options
 */
export interface InstallOptions {
  /** npm package name */
  packageName: string;
  /** Component ID (for config naming) */
  componentId: string;
  /** Project directory path */
  projectPath: string;
  /** Package manager to use */
  packageManager: PackageManager;
  /** Whether to auto-configure convex.config.ts */
  autoConfigureConfig: boolean;
}

/**
 * Installation result
 */
export interface InstallResult {
  success: boolean;
  steps: InstallStep[];
  error?: string;
}

/**
 * Response from fetching marketplace components
 */
export interface MarketplaceResponse {
  components: MarketplaceComponent[];
  fetchedAt: number;
  source: "remote" | "cache" | "static";
}
