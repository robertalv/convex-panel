/**
 * Shared types and interfaces for API operations
 */

/**
 * Environment variable type
 */
export interface EnvironmentVariable {
  name: string;
  value: string;
}

/**
 * Component type
 */
export interface Component {
  id: string;
  name: string;
  path: string;
  args: Record<string, any>;
  state: "active" | "inactive";
}

/**
 * Backup-related types and interfaces
 */
export interface CloudBackupResponse {
  id: number;
  sourceDeploymentId: number;
  sourceDeploymentName?: string;
  state: "requested" | "inProgress" | "complete" | "failed" | "canceled";
  requestedTime: number;
  includeStorage: boolean;
  snapshotId?: string;
  expirationTime?: number;
}

export interface PeriodicBackupConfig {
  sourceDeploymentId: number;
  cronspec: string;
  expirationDeltaSecs: number;
  nextRun: number;
  includeStorage: boolean;
}

/**
 * Deployment response from Convex API
 */
export interface DeploymentResponse {
  id: number;
  name: string;
  projectId: number;
  deploymentType: "dev" | "prod" | "preview";
  kind: "cloud" | "local";
  creator?: number;
  isActive?: boolean;
}

/**
 * Project response from Convex API
 */
export interface ProjectResponse {
  id: number;
  name: string;
  slug: string;
  teamId: number;
}

/**
 * Team response from Convex API
 */
export interface TeamResponse {
  id: number;
  name: string;
  slug: string;
}

/**
 * Profile response from Convex API
 */
export interface ProfileResponse {
  id: number;
  email?: string;
  teams?: TeamResponse[];
}

/**
 * Token details response
 */
export interface TokenDetails {
  type: "projectToken" | "teamToken" | string;
  teamId?: number | string;
  projectId?: number | string;
}

/**
 * Deployment credentials (URLs and admin key)
 */
export interface DeploymentCredentials {
  deploymentUrl: string;
  httpActionsUrl: string;
  adminKey: string;
}

/**
 * Deployment info response
 */
export interface DeploymentInfo {
  name: string;
  projectName?: string;
  deploymentType: "dev" | "prod" | "preview";
  kind: "cloud" | "local";
}
