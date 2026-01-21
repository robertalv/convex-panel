import { useEffect, useRef, useState } from "react";
import {
  processFunctionLogs,
  streamFunctionLogs,
  streamUdfExecution,
  type FunctionExecutionLog,
  type ModuleFunction,
} from "@convex-panel/shared/api";
import { backoffWithJitter } from "@convex-panel/shared";

interface UseFunctionLogStreamOptions {
  deploymentUrl?: string;
  authToken?: string;
  selectedFunction: ModuleFunction | null;
  isPaused: boolean;
  useProgressEvents?: boolean;
  useMockData?: boolean;
}

interface UseFunctionLogStreamResult {
  logs: FunctionExecutionLog[];
  isLoading: boolean;
  error: Error | null;
  cursor: number | string;
  reset: () => void;
}

// Polling intervals - MINIMUM 2s between ANY requests
const MIN_REQUEST_INTERVAL = 2000; // Hard floor - never request faster than this
const ACTIVE_POLLING_INTERVAL = 2000; // 2s when receiving logs
const MIN_IDLE_INTERVAL = 3000; // Start at 3s when idle
const MAX_IDLE_INTERVAL = 15000; // Max 15s when idle for extended periods
const IDLE_BACKOFF_MULTIPLIER = 1.5; // Increase by 50% each consecutive idle response

export function useFunctionLogStream({
  deploymentUrl,
  authToken,
  selectedFunction,
  isPaused,
  useProgressEvents = false,
  useMockData = false,
}: UseFunctionLogStreamOptions): UseFunctionLogStreamResult {
  const [logs, setLogs] = useState<FunctionExecutionLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof document === "undefined") return true;
    return !document.hidden;
  });

  const abortRef = useRef<AbortController | null>(null);
  const isStreamingRef = useRef(false);
  // Use a ref for cursor so the streaming loop always has access to the latest value
  const cursorRef = useRef<number | string>(0);
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

  const reset = () => {
    setLogs([]);
    // Reset back to the initial cursor so we can refetch from the server's
    // notion of the beginning; it will immediately advance us.
    cursorRef.current = 0;
    setError(null);

    abortRef.current?.abort();
    isStreamingRef.current = false;
  };

  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFunction?.identifier]);

  useEffect(() => {
    if (!deploymentUrl || !authToken || !selectedFunction || useMockData) {
      return;
    }

    // Pause when tab is hidden or manually paused
    if (isPaused || !isVisible) {
      // When paused, stop any in-flight request
      abortRef.current?.abort();
      isStreamingRef.current = false;
      setIsLoading(false);
      return;
    }

    abortRef.current?.abort();
    isStreamingRef.current = true;
    abortRef.current = new AbortController();

    let cancelled = false;
    let numFailures = 0;
    let consecutiveIdleResponses = 0;

    // Helper to enforce minimum request interval
    const waitForMinInterval = async () => {
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTimeRef.current;
      if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    };

    const loop = async () => {
      setIsLoading(true);
      while (!cancelled && isStreamingRef.current) {
        // Enforce minimum interval between requests
        await waitForMinInterval();

        if (cancelled || !isStreamingRef.current) break;

        // Record request time BEFORE making the request
        lastRequestTimeRef.current = Date.now();

        try {
          // Use cursorRef.current to always get the latest cursor value
          const currentCursor = cursorRef.current;
          const signal = abortRef.current?.signal;
          const { entries, newCursor } = useProgressEvents
            ? await streamFunctionLogs(
                deploymentUrl,
                authToken,
                currentCursor,
                undefined,
                undefined,
                undefined,
                undefined,
                signal,
              )
            : await streamUdfExecution(
                deploymentUrl,
                authToken,
                currentCursor,
                undefined,
                undefined,
                signal,
              );

          const processed = processFunctionLogs(entries, selectedFunction);
          if (processed.length > 0) {
            setLogs((prev) => {
              const existingIds = new Set(
                prev.map((l: FunctionExecutionLog) => l.id),
              );
              const merged = [...prev];
              processed.forEach((log: FunctionExecutionLog) => {
                if (!existingIds.has(log.id)) {
                  merged.push(log);
                }
              });
              return merged.sort((a, b) => b.startedAt - a.startedAt);
            });
          }

          // Update the cursor ref with the new cursor from the API
          if (newCursor !== undefined && newCursor !== null) {
            cursorRef.current = newCursor;
          }
          setError(null);

          // Reset failure count on success
          numFailures = 0;

          // Determine additional delay based on whether we received logs
          let additionalDelayMs: number;
          if (processed.length > 0) {
            // Got logs - use active interval and reset idle counter
            consecutiveIdleResponses = 0;
            additionalDelayMs = ACTIVE_POLLING_INTERVAL;
          } else {
            // No logs - use progressive idle backoff
            consecutiveIdleResponses++;
            additionalDelayMs = Math.min(
              MIN_IDLE_INTERVAL *
                Math.pow(IDLE_BACKOFF_MULTIPLIER, consecutiveIdleResponses - 1),
              MAX_IDLE_INTERVAL,
            );
          }

          // Wait the additional delay
          if (!cancelled && isStreamingRef.current && additionalDelayMs > 0) {
            await new Promise((resolve) =>
              setTimeout(resolve, additionalDelayMs),
            );
          }
        } catch (err: any) {
          if (err?.name === "AbortError") {
            break;
          }
          setError(err instanceof Error ? err : new Error(String(err)));

          // Increment failure count and use exponential backoff with jitter
          numFailures += 1;
          const backoffMs = backoffWithJitter(numFailures - 1);
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
        }
      }
      if (!cancelled) {
        setIsLoading(false);
      }
    };

    loop();

    return () => {
      cancelled = true;
      isStreamingRef.current = false;
      abortRef.current?.abort();
    };
  }, [
    deploymentUrl,
    authToken,
    selectedFunction,
    isPaused,
    isVisible,
    useProgressEvents,
    useMockData,
  ]);

  return {
    logs,
    isLoading,
    error,
    cursor: cursorRef.current,
    reset,
  };
}
