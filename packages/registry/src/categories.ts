/**
 * Category definitions and metadata
 */

import type {
  CategoryInfo,
  ComponentCategory,
  PackageManagerConfig,
  PackageManager,
} from "./types";

/**
 * Category definitions with metadata
 */
export const CATEGORIES: Record<ComponentCategory, CategoryInfo> = {
  ai: {
    id: "ai",
    label: "AI",
    description: "AI and machine learning components",
    icon: "sparkles",
    order: 1,
  },
  auth: {
    id: "auth",
    label: "Authentication",
    description: "Authentication and authorization components",
    icon: "shield",
    order: 2,
  },
  backend: {
    id: "backend",
    label: "Backend",
    description: "Backend utilities and helpers",
    icon: "server",
    order: 3,
  },
  database: {
    id: "database",
    label: "Database",
    description: "Database utilities and extensions",
    icon: "database",
    order: 4,
  },
  "durable-functions": {
    id: "durable-functions",
    label: "Durable Functions",
    description: "Long-running and scheduled functions",
    icon: "clock",
    order: 5,
  },
  integrations: {
    id: "integrations",
    label: "Integrations",
    description: "Third-party service integrations",
    icon: "plug",
    order: 6,
  },
  payments: {
    id: "payments",
    label: "Payments",
    description: "Payment processing integrations",
    icon: "credit-card",
    order: 7,
  },
  storage: {
    id: "storage",
    label: "Storage",
    description: "File and object storage",
    icon: "folder",
    order: 8,
  },
};

/**
 * Get all categories sorted by order
 */
export function getCategories(): CategoryInfo[] {
  return Object.values(CATEGORIES).sort((a, b) => a.order - b.order);
}

/**
 * Get category by ID
 */
export function getCategoryById(
  id: ComponentCategory,
): CategoryInfo | undefined {
  return CATEGORIES[id];
}

/**
 * Get category label
 */
export function getCategoryLabel(id: ComponentCategory): string {
  return CATEGORIES[id]?.label ?? id;
}

/**
 * Package manager configurations
 */
export const PACKAGE_MANAGERS: Record<PackageManager, PackageManagerConfig> = {
  npm: {
    id: "npm",
    name: "npm",
    installCommand: "npm install",
    icon: "npm",
  },
  pnpm: {
    id: "pnpm",
    name: "pnpm",
    installCommand: "pnpm add",
    icon: "pnpm",
  },
  yarn: {
    id: "yarn",
    name: "Yarn",
    installCommand: "yarn add",
    icon: "yarn",
  },
  bun: {
    id: "bun",
    name: "Bun",
    installCommand: "bun add",
    icon: "bun",
  },
};

/**
 * Get all package managers
 */
export function getPackageManagers(): PackageManagerConfig[] {
  return Object.values(PACKAGE_MANAGERS);
}

/**
 * Get install command for a package
 */
export function getInstallCommand(
  packageName: string,
  packageManager: PackageManager = "npm",
): string {
  const config = PACKAGE_MANAGERS[packageManager];
  return `${config.installCommand} ${packageName}`;
}
