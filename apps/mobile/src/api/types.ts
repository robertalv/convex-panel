/**
 * API Types for Mobile App
 * Local types extracted from @convex-panel/shared
 */

/**
 * Custom fetch function type for platform-specific fetch implementations
 */
export type FetchFn = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

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
