/**
 * React Query hook for streaming logs
 * Implements auto-refresh with pause/resume capability
 */

import { useQuery } from "@tanstack/react-query";
import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { fetchLogs, type LogEntry } from "../../../api/logs";
import { filterLogsByClauses } from "../../filters/factory";

/**
 * Query keys factory for logs
 */
export const logsQueryKeys = {
  all: ["logs"] as const,
  stream: (deploymentUrl: string) =>
    [...logsQueryKeys.all, "stream", deploymentUrl] as const,
};

/**
 * Hook for streaming logs with auto-refresh
 * Features:
 * - Auto-refreshes every 3 seconds when not paused
 * - Maintains cursor-based pagination
 * - Deduplicates logs by timestamp + request_id
 * - Memory efficient (keeps last 500 logs)
 */
export function useLogStream(
  deploymentUrl: string | null,
  accessToken?: string,
  limit: number = 50,
) {
  const [isPaused, setIsPaused] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const cursorRef = useRef<string | number>("0");
  const seenLogsRef = useRef<Set<string>>(new Set());
  const prevDeploymentUrlRef = useRef<string | null>(null);

  // Fetch logs with React Query
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: logsQueryKeys.stream(deploymentUrl || ""),
    queryFn: async () => {
      if (!deploymentUrl || !accessToken) {
        throw new Error("No deployment or access token");
      }

      return fetchLogs(
        deploymentUrl,
        accessToken,
        cursorRef.current,
        undefined,
        limit,
      );
    },
    enabled: !!deploymentUrl && !!accessToken && !isPaused,
    refetchInterval: isPaused ? false : 3000, // Poll every 3 seconds when not paused
    staleTime: 0, // Always consider data stale to enable real-time updates
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
  });

  // Reset logs state when deployment changes
  useEffect(() => {
    if (deploymentUrl !== prevDeploymentUrlRef.current) {
      // Deployment changed - reset all logs state
      setLogs([]);
      seenLogsRef.current.clear();
      cursorRef.current = "0";
      setIsPaused(false);
      console.log("[useLogStream] Reset logs state for deployment change");
      prevDeploymentUrlRef.current = deploymentUrl;
    } else if (!deploymentUrl) {
      // Deployment cleared
      setLogs([]);
      seenLogsRef.current.clear();
      cursorRef.current = "0";
      prevDeploymentUrlRef.current = null;
    }
  }, [deploymentUrl]);

  // Process new logs when data arrives
  useEffect(() => {
    if (data?.logs && data.logs.length > 0) {
      const newLogs: LogEntry[] = [];

      for (const log of data.logs) {
        // Create unique key for deduplication
        const logKey = `${log.timestamp}-${log.function?.request_id || ""}`;

        if (!seenLogsRef.current.has(logKey)) {
          seenLogsRef.current.add(logKey);
          newLogs.push(log);
        }
      }

      if (newLogs.length > 0) {
        setLogs((prevLogs) => {
          // Add new logs to the beginning (newest first)
          const combined = [...newLogs, ...prevLogs];

          // Keep only last 500 logs for memory efficiency
          return combined.slice(0, 500);
        });

        // Update cursor for next fetch
        cursorRef.current = data.newCursor;
      }
    }
  }, [data]);

  // Pause streaming
  const pause = useCallback(() => {
    setIsPaused(true);
  }, []);

  // Resume streaming
  const resume = useCallback(() => {
    setIsPaused(false);
    // Trigger immediate refetch when resuming
    refetch();
  }, [refetch]);

  // Clear all logs
  const clearLogs = useCallback(() => {
    setLogs([]);
    seenLogsRef.current.clear();
    cursorRef.current = "now"; // Start from now after clear
  }, []);

  return {
    logs,
    isLoading,
    error: error as Error | null,
    isPaused,
    pause,
    resume,
    clearLogs,
    refetch,
  };
}

/**
 * Helper to filter logs by search query
 */
export function filterLogsBySearch(
  logs: LogEntry[],
  search: string,
): LogEntry[] {
  if (!search.trim()) return logs;

  const query = search.toLowerCase();

  return logs.filter((log) => {
    // Search in message
    if (log.message.toLowerCase().includes(query)) return true;

    // Search in function path
    if (log.function?.path.toLowerCase().includes(query)) return true;

    // Search in error message
    if (log.error_message?.toLowerCase().includes(query)) return true;

    // Search in request ID
    if (log.function?.request_id.toLowerCase().includes(query)) return true;

    return false;
  });
}

/**
 * Helper to filter logs by type/status
 */
export function filterLogsByType(
  logs: LogEntry[],
  types: Set<string>,
): LogEntry[] {
  if (types.size === 0) return logs;

  return logs.filter((log) => {
    if (log.status && types.has(log.status)) return true;
    if (log.log_level && types.has(log.log_level.toLowerCase())) return true;
    return false;
  });
}

/**
 * Helper to apply clause-based filters (matching DataFilterSheet pattern)
 */
export function filterLogsByFilters(
  logs: LogEntry[],
  filters: {
    clauses: Array<{ type: string; value: string; enabled: boolean }>;
  },
): LogEntry[] {
  return filterLogsByClauses(logs, filters);
}
