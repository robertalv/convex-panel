/**
 * Shared types and interfaces for API operations
 */

export type TableMetric = 'rowsRead' | 'rowsWritten';

export interface TimeseriesBucket {
  time: Date;
  metric: number | null;
}

/**
 * Insight type definitions based on Convex dashboard
 */
export type HourlyCount = {
  hour: string;
  count: number;
};

export type OccRecentEvent = {
  timestamp: string;
  id: string;
  request_id: string;
  occ_document_id?: string;
  occ_write_source?: string;
  occ_retry_count: number;
};

export type BytesReadRecentEvent = {
  timestamp: string;
  id: string;
  request_id: string;
  calls: { table_name: string; bytes_read: number; documents_read: number }[];
  success: boolean;
};

export type Insight = { functionId: string; componentPath: string | null } & (
  | {
      kind: 'occRetried' | 'occFailedPermanently';
      details: {
        occCalls: number;
        occTableName?: string;
        hourlyCounts: HourlyCount[];
        recentEvents: OccRecentEvent[];
      };
    }
  | {
      kind:
        | 'bytesReadLimit'
        | 'bytesReadThreshold'
        | 'documentsReadLimit'
        | 'documentsReadThreshold';
      details: {
        count: number;
        hourlyCounts: HourlyCount[];
        recentEvents: BytesReadRecentEvent[];
      };
    }
);

export interface EnvironmentVariable {
  name: string;
  value: string;
}

export interface FileMetadata {
  _id: string;
  _creationTime: number;
  storageId: string;
  contentType?: string;
  size?: number;
  name?: string;
  sha256?: string;
  url?: string;
}

/**
 * Deployment credentials and info
 */
export interface DeploymentCredentials {
  deploymentUrl: string;
  httpActionsUrl: string;
  adminKey: string;
}

export interface DeploymentInfo {
  deploymentName: string;
  deploymentType: 'dev' | 'prod' | 'preview';
  [key: string]: any;
}

export interface DeployKey {
  id: string;
  name?: string;
  expiresAt?: number;
  [key: string]: any;
}

/**
 * Deployment response from Convex API
 */
export interface DeploymentResponse {
  id: number;
  name: string;
  projectId: number;
  deploymentType: 'dev' | 'prod' | 'preview';
  kind: 'cloud' | 'local';
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
 * Authentication provider types
 */
export interface OIDCProvider {
  domain: string;
  applicationID: string;
}

export interface CustomJWTProvider {
  type: string;
  issuer: string;
  jwks: string;
  algorithm: string;
  applicationID?: string;
}

export type AuthProvider = OIDCProvider | CustomJWTProvider;

/**
 * Component type
 */
export interface Component {
  id: string;
  name: string;
  path: string;
  args: Record<string, any>;
  state: 'active' | 'inactive';
}

/**
 * Backup-related types and interfaces
 */
export interface CloudBackupResponse {
  id: number;
  sourceDeploymentId: number;
  sourceDeploymentName?: string;
  state: 'requested' | 'inProgress' | 'complete' | 'failed' | 'canceled';
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

