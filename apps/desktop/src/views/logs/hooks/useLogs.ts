/**
 * useLogs Hook
 * Streams and manages log data from the Convex deployment
 *
 * Polling Strategy:
 * - Minimum 2s between ANY requests (hard floor)
 * - Active streaming (logs received): 2s between requests
 * - Idle (no logs): Progressive backoff from 3s to 15s
 * - Tab hidden: Polling is paused entirely
 * - Errors: Exponential backoff with jitter
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  streamFunctionLogs,
  processFunctionLogs,
} from "@convex-panel/shared/api";
import { backoffWithJitter } from "@convex-panel/shared";
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

// Polling intervals - MINIMUM 2s between ANY requests
const MIN_REQUEST_INTERVAL = 2000; // Hard floor - never request faster than this
const ACTIVE_POLLING_INTERVAL = 2000; // 2s when receiving logs
const MIN_IDLE_INTERVAL = 3000; // Start at 3s when idle
const MAX_IDLE_INTERVAL = 15000; // Max 15s when idle for extended periods
const IDLE_BACKOFF_MULTIPLIER = 1.5; // Increase by 50% each consecutive idle response

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
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof document === "undefined") return true;
    return !document.hidden;
  });

  // Use refs for values that change but shouldn't trigger re-renders
  const cursorRef = useRef<number | string>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const selectedFunctionRef = useRef(selectedFunction);
  const lastRequestTimeRef = useRef<number>(0);

  // Track document visibility
  useEffect(() => {
    if (typeof document === "undefined") return;

    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

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

  // Long-polling loop
  useEffect(() => {
    // Don't start streaming if paused, hidden, missing credentials, or using mock data
    if (isPaused || !isVisible || !deploymentUrl || !authToken || useMockData) {
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
    let consecutiveIdleResponses = 0;
    let isDisconnected = false;

    // Helper to enforce minimum request interval
    const waitForMinInterval = async () => {
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTimeRef.current;
      if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    };

    // Continuous async loop for long-polling
    const streamLogs = async () => {
      while (isActive) {
        // Enforce minimum interval between requests
        await waitForMinInterval();

        if (!isActive) break;

        // Create new abort controller for this request
        const controller = new AbortController();
        abortControllerRef.current = controller;

        // Record request time BEFORE making the request
        lastRequestTimeRef.current = Date.now();

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

            // Determine additional delay based on whether we received logs
            let additionalDelayMs: number;
            if (response.entries.length > 0) {
              // Got logs - use active interval and reset idle counter
              consecutiveIdleResponses = 0;
              additionalDelayMs = ACTIVE_POLLING_INTERVAL;
            } else {
              // No logs - use progressive idle backoff
              consecutiveIdleResponses++;
              additionalDelayMs = Math.min(
                MIN_IDLE_INTERVAL *
                  Math.pow(
                    IDLE_BACKOFF_MULTIPLIER,
                    consecutiveIdleResponses - 1,
                  ),
                MAX_IDLE_INTERVAL,
              );
            }

            // Wait the additional delay (on top of the minimum interval enforced at loop start)
            if (isActive && additionalDelayMs > 0) {
              await new Promise((resolve) =>
                setTimeout(resolve, additionalDelayMs),
              );
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

          // Backoff before retry (in addition to minimum interval)
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
    isVisible,
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
