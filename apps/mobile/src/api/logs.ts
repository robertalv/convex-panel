/**
 * Logs API Client
 * REST API client for Convex function execution logs
 */

export interface LogEntry {
  timestamp: number; // Unix timestamp in milliseconds
  topic: string; // "console", "http", etc.
  function?: {
    type: string; // "query", "mutation", "action"
    path: string; // "componentName:functionName"
    cached: boolean; // Whether result was cached
    request_id: string; // Unique request identifier
  };
  log_level: string; // "DEBUG", "INFO", "WARN", "ERROR"
  message: string; // Log message content
  execution_time_ms?: number; // Function execution time
  status?: "success" | "error" | "failure";
  error_message?: string; // Error details if failed
  raw: any; // Full raw response data
}

export interface FetchLogsResponse {
  logs: LogEntry[];
  newCursor: string | number;
}

/**
 * Fetch logs from Convex deployment
 * Uses /api/app_metrics/stream_function_logs endpoint
 * Requires Convex admin token (from dashboard session)
 */
export async function fetchLogs(
  deploymentUrl: string,
  accessToken: string,
  cursor: string | number = "0",
  functionId?: string,
  limit: number = 50,
): Promise<FetchLogsResponse> {
  try {
    // Build URL with query parameters
    const url = new URL(
      `${deploymentUrl}/api/app_metrics/stream_function_logs`,
    );

    // Normalize cursor (treat "now" and empty as "0")
    const cursorValue =
      cursor === "now" || cursor === "" || !cursor ? "0" : String(cursor);
    url.searchParams.set("cursor", cursorValue);

    if (functionId) {
      url.searchParams.set("function", functionId);
    }

    if (limit) {
      url.searchParams.set("limit", String(limit));
    }

    console.log("[Logs API] Fetching logs from:", url.toString());

    // Build headers with Convex admin authorization
    const headers: HeadersInit = {
      "convex-client": "dashboard-0.0.0",
      "content-type": "application/json",
    };

    // Add Convex admin token
    if (accessToken) {
      headers.authorization = `Convex ${accessToken}`;
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers,
    });

    console.log(
      "[Logs API] Response status:",
      response.status,
      response.statusText,
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Logs API] Response error:", errorText);
      throw new Error(
        `Failed to fetch logs: ${response.statusText} - ${errorText}`,
      );
    }

    const data = await response.json();

    console.log("[Logs API] Response data:", {
      entriesCount: data.entries?.length || 0,
      newCursor: data.newCursor || data.new_cursor,
      sampleEntry: data.entries?.[0],
    });

    // Format logs to consistent structure
    const formattedLogs: LogEntry[] = (data.entries || []).map((entry: any) => {
      // Normalize timestamp (handle both seconds and milliseconds)
      const timestamp = entry.timestamp
        ? entry.timestamp > 1e12
          ? entry.timestamp
          : entry.timestamp * 1000
        : Date.now();

      // Extract function info with various field name variants
      const udfType = entry.udfType || entry.udf_type || entry.type;
      const identifier = entry.identifier || entry.udf_path || entry.function;
      const requestId =
        entry.requestId || entry.request_id || entry.execution_id;

      // Normalize execution time (handle both seconds and milliseconds)
      const executionTime = entry.executionTime
        ? entry.executionTime < 1000
          ? entry.executionTime * 1000
          : entry.executionTime
        : entry.execution_time_ms || entry.executionTimeMs;

      // Determine status from success field or explicit status
      const success = entry.success;
      let status: "success" | "error" | "failure" | undefined;

      if (entry.status) {
        status = entry.status;
      } else if (success === null || success === undefined) {
        status = undefined;
      } else if (typeof success === "object" && success !== null) {
        status = "success";
      } else if (success === true) {
        status = "success";
      } else {
        status = "error";
      }

      return {
        timestamp,
        topic: entry.topic || "console",
        function: identifier
          ? {
              type: udfType,
              path: identifier,
              cached: entry.cachedResult || entry.cached || false,
              request_id: requestId,
            }
          : undefined,
        log_level: entry.level || entry.log_level || "INFO",
        message:
          entry.message || entry.logLines?.join("\n") || JSON.stringify(entry),
        execution_time_ms: executionTime,
        status,
        error_message: entry.error || entry.error_message,
        raw: entry,
      };
    });

    console.log("[Logs API] Formatted logs:", {
      count: formattedLogs.length,
      hasMore: !!data.newCursor,
    });

    return {
      logs: formattedLogs,
      newCursor: data.newCursor || data.new_cursor || cursor,
    };
  } catch (error) {
    console.error("[Logs API] Error fetching logs:", error);
    throw error;
  }
}
