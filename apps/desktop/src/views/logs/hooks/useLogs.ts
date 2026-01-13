/**
 * useLogs Hook
 * Streams and manages log data from the Convex deployment
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  streamFunctionLogs,
  processFunctionLogs,
} from "@convex-panel/shared/api";
import type { LogEntry, ModuleFunction } from "../types";

export interface UseLogsOptions {
  deploymentUrl: string | null;
  authToken: string | null;
  useMockData?: boolean;
  isPaused?: boolean;
  onError?: (error: string) => void;
  selectedFunction?: ModuleFunction | null;
  fetchFn?: typeof fetch;
}

export interface UseLogsReturn {
  logs: LogEntry[];
  isLoading: boolean;
  error: Error | null;
  isPaused: boolean;
  setIsPaused: (paused: boolean) => void;
  clearLogs: () => void;
  refreshLogs: () => void;
}

const POLLING_INTERVAL = 2000;
const MAX_LOGS = 100; // Reduced for pagination - one page worth

// Singleton cache shared across all hook instances to handle StrictMode double-mounting
// This prevents duplicate fetches when React mounts/unmounts/remounts in StrictMode
const globalCache = {
  seenIds: new Set<string>(),
  cursor: 0 as number | string,
  isFetching: false,
};

export function useLogs({
  deploymentUrl,
  authToken,
  useMockData = false,
  isPaused: externalIsPaused,
  onError,
  selectedFunction,
  fetchFn = fetch,
}: UseLogsOptions): UseLogsReturn {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isPaused, setIsPausedState] = useState(false);

  // Use refs for values that shouldn't trigger re-renders
  // Initialize from global cache to handle StrictMode remounts
  const cursorRef = useRef<number | string>(globalCache.cursor);
  const abortControllerRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set(globalCache.seenIds));

  // Sync external pause state
  useEffect(() => {
    if (externalIsPaused !== undefined) {
      setIsPausedState(externalIsPaused);
    }
  }, [externalIsPaused]);

  const setIsPaused = useCallback((paused: boolean) => {
    setIsPausedState(paused);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
    cursorRef.current = 0;
    globalCache.cursor = 0;
    seenIdsRef.current.clear();
    globalCache.seenIds.clear();
    setError(null);
  }, []);

  const refreshLogs = useCallback(() => {
    clearLogs();
    setIsPausedState(false);
  }, [clearLogs]);

  // Use ref for selectedFunction to avoid recreating fetchLogs
  const selectedFunctionRef = useRef(selectedFunction);
  useEffect(() => {
    selectedFunctionRef.current = selectedFunction;
  }, [selectedFunction]);

  // Fetch logs function - stable reference
  const fetchLogs = useCallback(async () => {
    // Guard against concurrent fetches using global flag
    if (globalCache.isFetching) {
      return;
    }

    if (!deploymentUrl || !authToken || useMockData) {
      return;
    }

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    globalCache.isFetching = true;
    setIsLoading(true);

    try {
      const response = await streamFunctionLogs(
        deploymentUrl,
        authToken,
        cursorRef.current,
        undefined, // sessionId
        undefined, // clientRequestCounter
        50, // limit - reduced for better performance
        fetchFn,
      );

      // Process the raw entries into FunctionExecutionLog format
      const processedLogs = processFunctionLogs(
        response.entries,
        selectedFunctionRef.current
          ? { identifier: selectedFunctionRef.current.identifier }
          : null,
      );

      console.log(
        `[useLogs] Fetched ${response.entries.length} raw entries, processed to ${processedLogs.length} logs. Cursor: ${cursorRef.current} -> ${response.newCursor}`,
      );

      if (processedLogs.length > 0) {
        setLogs((prevLogs) => {
          // Build a set of existing log IDs from prevLogs for fast lookup
          const existingIds = new Set(prevLogs.map((l) => l.id));

          // Filter out logs we've already seen OR that exist in prevLogs
          const newLogs = processedLogs.filter((log) => {
            // Skip if we've seen this ID before
            if (seenIdsRef.current.has(log.id) || existingIds.has(log.id)) {
              return false;
            }
            seenIdsRef.current.add(log.id);
            return true;
          });

          console.log(
            `[useLogs] After dedup: ${newLogs.length} new logs out of ${processedLogs.length} processed. Total in state: ${prevLogs.length}`,
          );

          // If no new logs, return unchanged
          if (newLogs.length === 0) {
            return prevLogs;
          }

          // Merge and sort by timestamp descending (newest first)
          const merged = [...newLogs, ...prevLogs];

          // Remove any duplicate IDs that might have slipped through
          const seen = new Set<string>();
          const deduplicated = merged.filter((log) => {
            if (seen.has(log.id)) {
              return false;
            }
            seen.add(log.id);
            return true;
          });

          // Sort by timestamp descending
          deduplicated.sort((a, b) => b.timestamp - a.timestamp);

          // Limit total logs
          const limited = deduplicated.slice(0, MAX_LOGS);

          // Update seen IDs to match kept logs
          const keptIds = new Set(limited.map((l) => l.id));
          seenIdsRef.current = keptIds;
          globalCache.seenIds = new Set(keptIds);

          return limited;
        });
      }

      // Update cursor for next fetch
      if (response.newCursor && response.newCursor !== cursorRef.current) {
        cursorRef.current = response.newCursor;
        globalCache.cursor = response.newCursor;
      }

      setError(null);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      onError?.(errorObj.message);
    } finally {
      globalCache.isFetching = false;
      setIsLoading(false);
    }
  }, [deploymentUrl, authToken, useMockData, fetchFn, onError]);

  // Polling effect - only depends on stable values
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Don't start polling if paused or missing credentials
    if (isPaused || !deploymentUrl || !authToken || useMockData) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setIsLoading(false);
      return;
    }

    // Initial fetch
    fetchLogs();

    // Set up polling interval
    intervalRef.current = setInterval(() => {
      fetchLogs();
    }, POLLING_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused, deploymentUrl, authToken, useMockData]);

  return {
    logs,
    isLoading,
    error,
    isPaused,
    setIsPaused,
    clearLogs,
    refreshLogs,
  };
}
