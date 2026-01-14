/**
 * useLogs Hook
 * Streams and manages log data from the Convex deployment
 *
 * Polling Strategy:
 * - Active streaming (logs received): 500ms between requests (2 req/sec)
 * - Idle (no logs): 2000ms between requests (0.5 req/sec)
 * - This prevents excessive polling while maintaining responsiveness
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  streamFunctionLogs,
  processFunctionLogs,
} from "@convex-panel/shared/api";
import type { LogEntry, ModuleFunction } from "../types";
import type { FunctionExecutionJson } from "@convex-panel/shared/api";

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
  clearLogs: () => void;
}

// Match dashboard-common's MAX_LOGS
const MAX_LOGS = 10000;
// Backoff configuration for retries
const INITIAL_BACKOFF_MS = 500;
const MAX_BACKOFF_MS = 30000;
const BACKOFF_MULTIPLIER = 2;
const JITTER_FACTOR = 0.1;

function backoffWithJitter(attemptNumber: number): number {
  const baseBackoff = Math.min(
    INITIAL_BACKOFF_MS * Math.pow(BACKOFF_MULTIPLIER, attemptNumber),
    MAX_BACKOFF_MS,
  );
  const jitter = baseBackoff * JITTER_FACTOR * (Math.random() - 0.5);
  return Math.floor(baseBackoff + jitter);
}

export function useLogs({
  deploymentUrl,
  authToken,
  useMockData = false,
  isPaused = false,
  onError,
  selectedFunction,
  fetchFn = fetch,
}: UseLogsOptions): UseLogsReturn {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Use refs for values that change but shouldn't trigger re-renders
  const cursorRef = useRef<number | string>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const selectedFunctionRef = useRef(selectedFunction);

  // Update selectedFunction ref without triggering re-render
  useEffect(() => {
    selectedFunctionRef.current = selectedFunction;
  }, [selectedFunction]);

  const clearLogs = useCallback(() => {
    setLogs([]);
    cursorRef.current = 0;
    setError(null);
  }, []);

  // Process and append new logs
  const receiveLogs = useCallback(
    (entries: FunctionExecutionJson[], newCursor: number | string) => {
      // Process the raw entries into FunctionExecutionLog format
      const processedLogs = processFunctionLogs(
        entries,
        selectedFunctionRef.current
          ? { identifier: selectedFunctionRef.current.identifier }
          : null,
      );

      if (processedLogs.length > 0) {
        setLogs((prevLogs) => {
          // Merge new logs with existing, newest first
          const merged = [...processedLogs, ...prevLogs];

          // Deduplicate by ID
          const seen = new Set<string>();
          const deduplicated = merged.filter((log) => {
            if (seen.has(log.id)) {
              return false;
            }
            seen.add(log.id);
            return true;
          });

          // Sort by timestamp descending (newest first)
          deduplicated.sort((a, b) => b.timestamp - a.timestamp);

          // Limit total logs to MAX_LOGS
          return deduplicated.slice(0, MAX_LOGS);
        });
      }

      // Update cursor for next fetch
      cursorRef.current = newCursor;
      setError(null);
    },
    [],
  );

  // Long-polling loop - matches dashboard-common implementation
  useEffect(() => {
    // Don't start streaming if paused, missing credentials, or using mock data
    if (isPaused || !deploymentUrl || !authToken || useMockData) {
      // Cancel any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setIsLoading(false);
      return;
    }

    let isActive = true;
    let numFailures = 0;
    let isDisconnected = false;

    // Continuous async loop for long-polling
    const streamLogs = async () => {
      while (isActive) {
        // Create new abort controller for this request
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
          setIsLoading(true);

          const response = await streamFunctionLogs(
            deploymentUrl,
            authToken,
            cursorRef.current,
            undefined, // sessionId
            undefined, // clientRequestCounter
            50, // limit per request
            fetchFn,
          );

          // Only process if still active (not aborted)
          if (isActive && !controller.signal.aborted) {
            // If we were disconnected and now reconnected
            if (isDisconnected) {
              isDisconnected = false;
              console.log("[useLogs] Reconnected to log stream");
            }

            // Reset failure count on success
            numFailures = 0;

            // Process logs
            receiveLogs(response.entries, response.newCursor);

            // Add polling delay to prevent excessive requests
            // Use shorter delay if logs were received (active streaming)
            // Use longer delay if no logs (idle state)
            if (isActive) {
              const delayMs = response.entries.length > 0 ? 500 : 2000;
              await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
          }
        } catch (err: any) {
          // Check if request was aborted (expected during cleanup)
          if (err.name === "AbortError" || controller.signal.aborted) {
            break;
          }

          // Increment failure count
          numFailures += 1;

          // Show error after multiple failures
          if (numFailures > 3 && !isDisconnected) {
            isDisconnected = true;
            const errorMsg =
              err instanceof Error ? err.message : "Failed to stream logs";
            console.error("[useLogs] Disconnected from log stream:", errorMsg);
            onError?.(errorMsg);
            setError(
              err instanceof Error ? err : new Error("Failed to stream logs"),
            );
          }

          // Backoff before retry
          if (numFailures > 0 && isActive) {
            const backoffMs = backoffWithJitter(numFailures - 1);
            await new Promise((resolve) => setTimeout(resolve, backoffMs));
          }
        } finally {
          setIsLoading(false);
        }
      }
    };

    // Start the streaming loop
    void streamLogs();

    // Cleanup function
    return () => {
      isActive = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [
    deploymentUrl,
    authToken,
    isPaused,
    useMockData,
    fetchFn,
    receiveLogs,
    onError,
  ]);

  return {
    logs,
    isLoading,
    error,
    clearLogs,
  };
}
