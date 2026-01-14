/**
 * Shared types and interfaces for API operations
 */

/**
 * Custom fetch function type for platform-specific fetch implementations
 * (e.g., Tauri's fetch for CORS-free requests)
 */
export type FetchFn = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export type TableMetric = "rowsRead" | "rowsWritten";

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
      kind: "occRetried" | "occFailedPermanently";
      details: {
        occCalls: number;
        occTableName?: string;
        hourlyCounts: HourlyCount[];
        recentEvents: OccRecentEvent[];
      };
    }
  | {
      kind:
        | "bytesReadLimit"
        | "bytesReadThreshold"
        | "documentsReadLimit"
        | "documentsReadThreshold";
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
  deploymentType: "dev" | "prod" | "preview";
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
 * Function execution stats
 */
export interface FunctionExecutionStats {
  identifier: string;
  udf_type: string;
  timestamp: number;
  success: boolean;
  execution_time_ms?: number;
  cachedResult?: boolean;
  error_message?: string;
}

/**
 * Stream UDF execution response
 */
export interface StreamUdfExecutionResponse {
  entries: FunctionExecutionStats[];
  new_cursor: number;
}

/**
 * Aggregated function stats for charting
 */
export interface AggregatedFunctionStats {
  invocations: number[];
  errors: number[];
  executionTimes: number[];
  cacheHits: number[];
}

/**
 * Function execution JSON from API
 * Raw response format from Convex streaming endpoints
 */
export interface FunctionExecutionJson {
  udf_type: string;
  component_path?: string;
  identifier: string;
  log_lines?: any[];
  timestamp: number;
  cached_result?: boolean;
  execution_time: number;
  success?: any;
  error?: string;
  request_id: string;
  caller?: string;
  parent_execution_id?: string;
  execution_id: string;
  usage_stats: {
    database_read_bytes: number;
    database_write_bytes: number;
    database_read_documents: number;
    storage_read_bytes: number;
    storage_write_bytes: number;
    vector_index_read_bytes?: number;
    vector_index_write_bytes?: number;
    memory_used_mb: number;
  };
  return_bytes?: number;
  occ_info?: {
    table_name: string;
    document_id: string;
    write_source: string;
    retry_count: number;
  };
  execution_timestamp?: number;
  identity_type: string;
  environment?: string;
}

/**
 * Processed function execution log
 * Normalized format for UI consumption
 */
export interface FunctionExecutionLog {
  id: string;
  kind: "log" | "outcome"; // Distinguishes between log lines and outcome entries
  functionIdentifier: string;
  functionName: string;
  udfType: "query" | "mutation" | "action" | "httpAction";
  componentPath?: string;
  timestamp: number;
  startedAt: number;
  completedAt: number;
  durationMs: number;
  success: boolean;
  error?: string;
  logLines: string[];
  usageStats: FunctionExecutionJson["usage_stats"];
  requestId: string;
  executionId: string;
  parentExecutionId?: string | null;
  caller?: string;
  environment?: string;
  identityType: string;
  returnBytes?: number;
  cachedResult?: boolean;
  raw: FunctionExecutionJson;
}

/**
 * Multi-select value type for filtering
 * Can be an array of selected values or 'all' for select all
 */
export type MultiSelectValue = string[] | "all";

/**
 * Log entry from Convex
 */
export interface LogEntry {
  id?: string;
  timestamp: number;
  unix_timestamp?: number;
  message?: string;
  log_level?: string;
  status?: string;
  error_message?: string;
  function_name?: string;
  function_path?: string;
  execution_time_ms?: number;
  request_id?: string;
  udf_type?: string;
  cached_result?: boolean;
  [key: string]: any;
}

/**
 * Logs response from API
 */
export interface LogsResponse {
  logs: LogEntry[];
  cursor?: string;
  hasMore?: boolean;
}
