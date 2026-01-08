/**
 * Application Types
 * Core types for Convex Panel desktop and web applications
 */

// ============================================================================
// Authentication & User Management
// ============================================================================

export interface User {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string;
  profilePictureUrl?: string; // Alias for avatarUrl, used by some APIs
}

export interface Team {
  id: number;
  name: string;
  slug: string;
  referralCode?: string;
}

export interface Project {
  id: number;
  name: string;
  slug: string;
  teamId: number;
}

export interface Deployment {
  id: number;
  name: string;
  deploymentType: "prod" | "dev" | "preview";
  projectId: number;
  kind?: "cloud" | "local";
  creator?: number;
  previewIdentifier?: string | null;
  url?: string;
}

// ============================================================================
// Component Types
// ============================================================================

export interface ConvexComponent {
  /** The actual component ID for API calls (null = root app) */
  id: string | null;
  /** Component name if available */
  name: string | null;
  /** Display path (e.g., "_App", "betterAuth") */
  path: string;
  /** Component state */
  state?: "active" | "unmounted";
}

// Table & Schema Types are exported from tables.ts

// ============================================================================
// View Types
// ============================================================================

export type DataViewMode = "table" | "list" | "json" | "raw";
