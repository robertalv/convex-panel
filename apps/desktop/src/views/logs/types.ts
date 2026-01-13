/**
 * Logs Feature Types
 * Types for the desktop logs view
 * Matches dashboard-common types
 */

import type { FunctionExecutionLog } from "@convex-panel/shared/api";

// Re-export shared types
export type { FunctionExecutionLog };
export type { ConvexComponent } from "@/types/desktop";

/**
 * Log entry as displayed in the UI
 * Extends FunctionExecutionLog with UI-specific fields
 */
export interface LogEntry extends FunctionExecutionLog {
  // Additional UI-specific fields
  localizedTimestamp?: string;
}

/**
 * Log level types matching dashboard-common
 */
export type LogLevel = "DEBUG" | "ERROR" | "WARN" | "INFO" | "LOG";

/**
 * Log type filter options
 */
export type LogType =
  | "success"
  | "failure"
  | "debug"
  | "log / info"
  | "warn"
  | "error";

export const LOG_TYPES: LogType[] = [
  "success",
  "failure",
  "debug",
  "log / info",
  "warn",
  "error",
];

/**
 * Function type for log display
 */
export type FunctionType = "query" | "mutation" | "action" | "httpAction";

/**
 * UDF Type matching dashboard
 */
export type UdfType = "Query" | "Mutation" | "Action" | "HttpAction";

/**
 * Log outcome matching dashboard-common
 */
export type LogOutcome = {
  status: "success" | "failure";
  statusCode: string | null;
};

/**
 * UDF log output matching dashboard-common
 */
export type UdfLogOutput = {
  isTruncated: boolean;
  isUnstructured?: boolean;
  messages: string[];
  timestamp?: number;
  level?: LogLevel | "FAILURE";
  subfunction?: string;
};

/**
 * Common UDF log fields
 */
export type UdfLogCommon = {
  id: string;
  udfType: UdfType;
  localizedTimestamp: string;
  timestamp: number;
  call: string;
  cachedResult?: boolean;
  requestId: string;
  executionId: string;
};

/**
 * UDF log outcome entry
 */
export type UdfLogOutcome = {
  outcome: LogOutcome;
  executionTimeMs: number | null;
  cachedResult?: boolean;
  kind: "outcome";
  error?: string;
  usageStats?: UsageStats;
  returnBytes?: number;
  caller: string;
  environment: "isolate" | "node";
  identityType: string;
  parentExecutionId: string | null;
  executionTimestamp?: number;
};

/**
 * Unified UDF log type
 */
export type UdfLog = UdfLogCommon &
  (UdfLogOutcome | { output: UdfLogOutput; kind: "log" });

/**
 * Module function from discovery
 */
export interface ModuleFunction {
  name: string;
  identifier: string;
  udfType: FunctionType;
  visibility: {
    kind: "public" | "internal";
  };
  args?: string;
  returns?: string;
  componentId?: string | null;
  componentPath?: string;
  file: {
    path: string;
  };
}

/**
 * Filter state for logs
 */
export interface LogFilters {
  searchQuery: string;
  selectedComponents: (string | null)[] | "all";
  selectedFunctions: ModuleFunction[] | "all";
  selectedLogTypes: LogType[];
}

/**
 * Detail tab in log sheet
 */
export type DetailTab = "execution" | "request" | "functions";

/**
 * Usage stats for log entry
 */
export interface UsageStats {
  database_read_bytes: number;
  database_write_bytes: number;
  database_read_documents: number;
  storage_read_bytes: number;
  storage_write_bytes: number;
  vector_index_read_bytes: number;
  vector_index_write_bytes: number;
  memory_used_mb: number;
}

/**
 * Export format options
 */
export type ExportFormat = "json" | "csv" | "txt";
