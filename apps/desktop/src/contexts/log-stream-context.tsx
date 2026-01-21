/**
 * LogStreamContext - Single centralized log stream
 *
 * This is a direct port of the Convex dashboard's useLogs.ts pattern.
 * Uses a simple while loop with AbortController for cleanup.
 *
 * Optimizations:
 * - Pauses when browser tab is hidden (visibility API)
 * - Pauses when user navigates away from /logs route
 * - Pauses after 1 minute of user inactivity
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import { useIdle } from "react-use";
import {
  streamFunctionLogs,
  processFunctionLogs,
  type FunctionExecutionLog,
} from "@convex-panel/shared/api";

// Idle timeout for pausing log stream (1 minute)
const IDLE_TIMEOUT_MS = 60000;

// Configuration
const MAX_LOGS = 10000;
const RETRY_DELAY_MS = 500;

// Simple backoff with jitter (matching dashboard-common's backoffWithJitter)
function backoffWithJitter(numFailures: number): number {
  const baseDelay = RETRY_DELAY_MS * Math.pow(2, numFailures - 1);
  const jitter = Math.random() * baseDelay * 0.5;
  return Math.min(baseDelay + jitter, 30000); // Cap at 30 seconds
}

interface LogStreamContextValue {
  logs: FunctionExecutionLog[];
  isConnected: boolean;
  error: Error | null;
  clearLogs: () => void;
}

const LogStreamContext = createContext<LogStreamContextValue>({
  logs: [],
  isConnected: false,
  error: null,
  clearLogs: () => {},
});

interface LogStreamProviderProps {
  children: ReactNode;
  deploymentUrl: string | null;
  authToken: string | null;
}

/**
 * Query function logs - direct port of queryFunctionLogs from dashboard-common
 * Returns a cleanup function that aborts the loop
 *
 * Enhanced with:
 * - shouldFetch callback for route/idle awareness
 */
function queryFunctionLogs(
  deploymentUrl: string,
  authHeader: string,
  startCursor: number,
  receiveLogs: (newLogs: FunctionExecutionLog[], cursor: number) => void,
  onConnected: () => void,
  onDisconnected: () => void,
  onError: (error: Error | null) => void,
  shouldFetchRef: React.MutableRefObject<boolean>,
): () => void {
  const abortController = new AbortController();
  const timeoutIds: ReturnType<typeof setTimeout>[] = [];

  const loop = async () => {
    let cursor = startCursor;
    let numFailures = 0;
    let isDisconnected = false;

    while (!abortController.signal.aborted) {
      // Pause when tab is hidden
      if (document.visibilityState !== "visible") {
        await new Promise<void>((resolve) => {
          const handler = () => {
            if (document.visibilityState === "visible") {
              document.removeEventListener("visibilitychange", handler);
              resolve();
            }
          };
          document.addEventListener("visibilitychange", handler);

          // Check periodically if we've been aborted
          const checkAbort = setInterval(() => {
            if (abortController.signal.aborted) {
              document.removeEventListener("visibilitychange", handler);
              clearInterval(checkAbort);
              resolve();
            }
          }, 500);
        });

        if (abortController.signal.aborted) {
          return;
        }
      }

      // Pause when not on /logs route or user is idle
      // Check the ref which is updated reactively by the component
      if (!shouldFetchRef.current) {
        await new Promise<void>((resolve) => {
          // Poll every 500ms to check if we should resume
          const checkInterval = setInterval(() => {
            if (shouldFetchRef.current || abortController.signal.aborted) {
              clearInterval(checkInterval);
              resolve();
            }
          }, 500);
        });

        if (abortController.signal.aborted) {
          return;
        }
      }

      try {
        console.log(
          `[LogStream] Fetching logs from cursor=${cursor}, url=${deploymentUrl}`,
        );
        const { entries, newCursor } = await streamFunctionLogs(
          deploymentUrl,
          authHeader,
          cursor,
          undefined, // sessionId
          undefined, // clientRequestCounter
          undefined, // limit
          undefined, // fetchFn - uses native fetch
          abortController.signal,
        );
        console.log(
          `[LogStream] Got ${entries.length} entries, newCursor=${newCursor}`,
        );

        // Reconnected after being disconnected
        if (isDisconnected) {
          isDisconnected = false;
          onConnected();
        }

        numFailures = 0;
        cursor =
          typeof newCursor === "number"
            ? newCursor
            : parseInt(String(newCursor), 10) || cursor;
        onError(null);

        // Process and send logs to callback
        if (entries.length > 0) {
          const processed = processFunctionLogs(entries, null);
          receiveLogs(processed, cursor);
        }
      } catch (e: any) {
        console.error(`[LogStream] Error fetching logs:`, e);
        // Check if aborted
        if (e instanceof DOMException && e.code === DOMException.ABORT_ERR) {
          return;
        }
        if (e?.name === "AbortError") {
          return;
        }

        numFailures += 1;

        // Show error after 5 failures
        if (numFailures > 5) {
          isDisconnected = true;
          onDisconnected();
          onError(e instanceof Error ? e : new Error(String(e)));
        }
      }

      // Backoff on failure
      if (numFailures > 0) {
        const nextBackoff = backoffWithJitter(numFailures);
        await new Promise<void>((resolve) => {
          const timeoutId = setTimeout(() => {
            resolve();
            const idx = timeoutIds.indexOf(timeoutId);
            if (idx !== -1) timeoutIds.splice(idx, 1);
          }, nextBackoff);
          timeoutIds.push(timeoutId);
        });
      }
    }
  };

  void loop();

  // Return cleanup function
  return () => {
    abortController.abort();
    timeoutIds.forEach(clearTimeout);
  };
}

export function LogStreamProvider({
  children,
  deploymentUrl,
  authToken,
}: LogStreamProviderProps) {
  // Debug: log on every render to see if provider is mounting
  console.log(
    `[LogStreamProvider] Rendering with deploymentUrl=${deploymentUrl}, authToken=${authToken ? "present" : "missing"}`,
  );

  const [logs, setLogs] = useState<FunctionExecutionLog[]>([]);
  const [cursor, setCursor] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Route awareness - only stream logs when on /logs route
  const location = useLocation();
  const isOnLogsRoute = location.pathname.startsWith("/logs");

  // Idle detection - pause after 1 minute of inactivity
  const isIdle = useIdle(IDLE_TIMEOUT_MS);
  const isUserActive = !isIdle;

  // Combined check for whether we should be fetching logs
  const shouldFetch = isOnLogsRoute && isUserActive;

  // Use a ref to pass the shouldFetch state to the async loop
  // This allows the loop to check the current value without restarting
  const shouldFetchRef = useRef(shouldFetch);
  shouldFetchRef.current = shouldFetch;

  const clearLogs = useCallback(() => {
    setLogs([]);
    setCursor(0);
  }, []);

  // Process received logs - matching dashboard's receiveLogs callback
  const receiveLogs = useCallback(
    (newLogs: FunctionExecutionLog[], newCursor: number) => {
      setLogs((prev) => {
        // Dedupe by ID
        const idSet = new Set(prev.map((l) => l.id));
        const uniqueNewLogs = newLogs.filter((l) => !idSet.has(l.id));

        if (uniqueNewLogs.length === 0) return prev;

        // Merge, sort by timestamp descending, and limit
        const merged = [...uniqueNewLogs, ...prev];
        return merged
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, MAX_LOGS);
      });
      setCursor(newCursor);
      setIsConnected(true);
    },
    [],
  );

  const onConnected = useCallback(() => {
    setIsConnected(true);
  }, []);

  const onDisconnected = useCallback(() => {
    setIsConnected(false);
  }, []);

  const onError = useCallback((err: Error | null) => {
    setError(err);
  }, []);

  useEffect(() => {
    // Don't start if missing credentials
    if (!deploymentUrl || !authToken) {
      console.log(
        `[LogStream] Missing credentials: deploymentUrl=${deploymentUrl}, authToken=${authToken ? "present" : "missing"}`,
      );
      setIsConnected(false);
      return;
    }

    // Don't start the stream if not on the logs route
    // This prevents unnecessary network requests when on other routes
    if (!isOnLogsRoute) {
      console.log(
        `[LogStream] Not on /logs route (current: ${location.pathname}), skipping stream`,
      );
      return;
    }

    console.log(
      `[LogStream] Starting log stream for ${deploymentUrl} (route: ${location.pathname}, active: ${isUserActive})`,
    );

    // Start the query loop - returns cleanup function
    // This matches the exact pattern from dashboard-common's useLogs
    // The loop will internally check shouldFetchRef to pause when not on /logs or idle
    return queryFunctionLogs(
      deploymentUrl,
      authToken,
      cursor,
      receiveLogs,
      onConnected,
      onDisconnected,
      onError,
      shouldFetchRef,
    );
  }, [deploymentUrl, authToken, isOnLogsRoute]); // Added isOnLogsRoute to deps

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({ logs, isConnected, error, clearLogs }),
    [logs, isConnected, error, clearLogs],
  );

  return (
    <LogStreamContext.Provider value={contextValue}>
      {children}
    </LogStreamContext.Provider>
  );
}

/**
 * Hook to access the centralized log stream.
 * Optionally filter logs by function identifier.
 */
export function useLogStream(functionIdentifier?: string | null) {
  const context = useContext(LogStreamContext);

  // Memoize filtered logs to prevent recalculation on every render
  const filteredLogs = useMemo(() => {
    if (!functionIdentifier) {
      return context.logs;
    }

    // Normalize function identifiers for comparison
    const normalizeId = (id: string) =>
      id.replace(/\.js:/g, ":").replace(/\.js$/g, "");
    const normalizedTarget = normalizeId(functionIdentifier);

    return context.logs.filter((log) => {
      const logId = normalizeId(log.functionIdentifier || "");
      return logId === normalizedTarget;
    });
  }, [context.logs, functionIdentifier]);

  // Return filtered or unfiltered based on whether we're filtering
  if (!functionIdentifier) {
    return context;
  }

  return {
    ...context,
    logs: filteredLogs,
  };
}
