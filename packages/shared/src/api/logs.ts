/**
 * Log streaming and processing functions
 * Handles all log-related API operations including streaming UDF execution logs
 */

import { ROUTES } from "./constants";
import { normalizeToken } from "./helpers";
import type {
  FetchFn,
  FunctionExecutionJson,
  FunctionExecutionLog,
} from "./types";

// Default fetch function - uses native fetch
const defaultFetch: FetchFn = (input, init) => fetch(input, init);

/**
 * Stream UDF execution logs from the Convex API
 * @param deploymentUrl - The URL of the Convex deployment
 * @param authToken - The authentication token
 * @param cursor - The cursor to start streaming from
 * @param limit - Optional limit for number of entries
 * @param fetchFn - Optional custom fetch function (for Tauri/CORS-free environments)
 * @returns The streamed UDF execution logs
 */
export async function streamUdfExecution(
  deploymentUrl: string,
  authToken: string,
  cursor: number | string = 0,
  limit?: number,
  fetchFn: FetchFn = defaultFetch,
): Promise<{ entries: FunctionExecutionJson[]; newCursor: number | string }> {
  const urlObj = new URL(`${deploymentUrl}${ROUTES.STREAM_UDF_EXECUTION}`);
  urlObj.searchParams.set("cursor", String(cursor));
  if (limit) {
    urlObj.searchParams.set("limit", String(limit));
  }
  const url = urlObj.toString();

  const normalizedToken = normalizeToken(authToken);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  let response: Response;
  let data: any;

  try {
    response = await fetchFn(url, {
      headers: {
        Authorization: normalizedToken,
        "Content-Type": "application/json",
        "Convex-Client": "dashboard-1.0.0",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Failed to stream UDF executions: HTTP ${response.status} - ${text}`,
      );
    }

    data = await response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error("Request timeout: The API took too long to respond");
    }
    throw error;
  }

  let entries = (data.entries || []) as FunctionExecutionJson[];

  let newCursor: number | string = cursor;

  return {
    entries,
    newCursor,
  };
}

/**
 * Stream function logs from the Convex API
 * @param deploymentUrl - The URL of the Convex deployment
 * @param authToken - The authentication token
 * @param cursor - The cursor to start streaming from
 * @param sessionId - The session ID to stream from
 * @param clientRequestCounter - The client request counter to stream from
 * @param limit - Optional limit for number of entries
 * @param fetchFn - Optional custom fetch function (for Tauri/CORS-free environments)
 * @returns The streamed function logs
 */
export async function streamFunctionLogs(
  deploymentUrl: string,
  authToken: string,
  cursor: number | string = 0,
  sessionId?: string,
  clientRequestCounter?: number,
  limit?: number,
  fetchFn: FetchFn = defaultFetch,
): Promise<{ entries: FunctionExecutionJson[]; newCursor: number | string }> {
  const params = new URLSearchParams({
    cursor: String(cursor),
  });

  if (sessionId && clientRequestCounter !== undefined) {
    params.set("session_id", sessionId);
    params.set("client_request_counter", String(clientRequestCounter));
  }

  if (limit) {
    params.set("limit", String(limit));
  }

  const url = `${deploymentUrl}${ROUTES.STREAM_FUNCTION_LOGS}?${params.toString()}`;

  const normalizedToken = normalizeToken(authToken);

  const response = await fetchFn(url, {
    headers: {
      Authorization: normalizedToken,
      "Content-Type": "application/json",
      "Convex-Client": "dashboard-1.0.0",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Failed to stream function logs: HTTP ${response.status} - ${text}`,
    );
  }

  const data = await response.json();

  let entries = (data.entries || []) as FunctionExecutionJson[];

  return {
    entries,
    newCursor: data.new_cursor ?? cursor,
  };
}

/**
 * Process function logs
 * @param entries - The function execution logs to process
 * @param selectedFunction - The function to filter by (optional)
 * @returns The processed function logs
 */
export function processFunctionLogs(
  entries: FunctionExecutionJson[],
  selectedFunction?: { identifier: string } | null,
): FunctionExecutionLog[] {
  if (!entries || entries.length === 0) return [];

  const targetIdentifier = selectedFunction?.identifier;

  const normalizeIdentifier = (id: string | undefined | null) =>
    (id || "").replace(/\.js:/g, ":").replace(/\.js$/g, "");

  const matchesSelected = (entry: FunctionExecutionJson) => {
    if (!selectedFunction) return true;

    const raw: any = entry as any;
    const entryPath: string | undefined = raw.udf_path || raw.identifier;

    const normalizedEntryId = normalizeIdentifier(entryPath);
    const normalizedTargetId = normalizeIdentifier(targetIdentifier);

    return (
      normalizedEntryId.length > 0 &&
      normalizedTargetId.length > 0 &&
      normalizedEntryId === normalizedTargetId
    );
  };

  const matchingEntries = entries.filter(matchesSelected);
  const effectiveEntries = selectedFunction ? matchingEntries : entries;

  return effectiveEntries.map((entry) => {
    const raw: any = entry as any;

    const udfTypeRaw = (raw.udf_type || raw.udfType || "query") as string;
    const componentPath = raw.component_path || raw.componentPath;

    const identifierRaw =
      raw.identifier ||
      raw.udf_path ||
      (componentPath ? `${componentPath}:${raw.identifier}` : "");

    const timestampSec = raw.timestamp ?? raw.execution_timestamp ?? 0;
    const startedAtMs =
      timestampSec > 1e12 ? timestampSec : timestampSec * 1000;

    let executionTimeSeconds = 0;
    if (raw.executionTime != null) {
      executionTimeSeconds = raw.executionTime;
    } else if (raw.execution_time != null) {
      executionTimeSeconds = raw.execution_time;
    } else if (raw.executionTimeMs != null) {
      executionTimeSeconds = raw.executionTimeMs / 1000;
    } else if (raw.execution_time_ms != null) {
      executionTimeSeconds = raw.execution_time_ms / 1000;
    }
    const durationMs = executionTimeSeconds * 1000;
    const completedAtMs = startedAtMs + durationMs;

    const rawLogLines = raw.log_lines || raw.logLines;

    const logLines =
      rawLogLines && Array.isArray(rawLogLines) && rawLogLines.length > 0
        ? rawLogLines.map((line: any) =>
            typeof line === "string" ? line : JSON.stringify(line),
          )
        : [];

    const success =
      raw.error == null &&
      (raw.success === undefined ||
        raw.success === null ||
        raw.success === true ||
        (typeof raw.success === "object" && raw.success !== null));

    const functionName =
      typeof identifierRaw === "string" && identifierRaw.includes(":")
        ? identifierRaw.split(":").slice(-1)[0]
        : identifierRaw;

    const functionIdentifier =
      componentPath && identifierRaw
        ? `${componentPath}:${identifierRaw}`
        : identifierRaw;

    return {
      id:
        raw.execution_id ||
        raw.executionId ||
        `${identifierRaw}-${startedAtMs}`,
      functionIdentifier,
      functionName,
      udfType: (udfTypeRaw.toLowerCase() || "query") as any,
      componentPath,
      timestamp: startedAtMs,
      startedAt: startedAtMs,
      completedAt: completedAtMs,
      durationMs,
      success,
      error: raw.error || raw.error_message,
      logLines,
      usageStats: (() => {
        const stats = raw.usage_stats || raw.usageStats;
        if (stats) {
          return {
            database_read_bytes:
              stats.database_read_bytes ?? stats.databaseReadBytes ?? 0,
            database_write_bytes:
              stats.database_write_bytes ?? stats.databaseWriteBytes ?? 0,
            database_read_documents:
              stats.database_read_documents ?? stats.databaseReadDocuments ?? 0,
            storage_read_bytes:
              stats.storage_read_bytes ?? stats.storageReadBytes ?? 0,
            storage_write_bytes:
              stats.storage_write_bytes ?? stats.storageWriteBytes ?? 0,
            vector_index_read_bytes:
              stats.vector_index_read_bytes ?? stats.vectorIndexReadBytes ?? 0,
            vector_index_write_bytes:
              stats.vector_index_write_bytes ??
              stats.vectorIndexWriteBytes ??
              0,
            memory_used_mb: stats.memory_used_mb ?? stats.memoryUsedMb ?? 0,
          };
        }
        return {
          database_read_bytes: 0,
          database_write_bytes: 0,
          database_read_documents: 0,
          storage_read_bytes: 0,
          storage_write_bytes: 0,
          vector_index_read_bytes: 0,
          vector_index_write_bytes: 0,
          memory_used_mb: 0,
        };
      })(),
      requestId: raw.request_id || raw.requestId || "",
      executionId: raw.execution_id || raw.executionId || "",
      caller: raw.caller,
      environment:
        raw.environment === "isolate" ? "Convex" : raw.environment || "Convex",
      identityType: (() => {
        const identity = raw.identity_type || raw.identityType || "";
        if (!identity) return "";
        return (
          identity.charAt(0).toUpperCase() + identity.slice(1).toLowerCase()
        );
      })(),
      returnBytes: raw.return_bytes || raw.returnBytes,
      cachedResult: raw.cached_result || raw.cachedResult || false,
      raw: raw,
    } as FunctionExecutionLog;
  });
}
