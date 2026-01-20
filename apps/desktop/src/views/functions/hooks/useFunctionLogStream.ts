import { useEffect, useRef, useState } from "react";
import {
  processFunctionLogs,
  streamFunctionLogs,
  streamUdfExecution,
  INTERVALS,
  type FunctionExecutionLog,
  type ModuleFunction,
} from "@convex-panel/shared/api";

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

  const abortRef = useRef<AbortController | null>(null);
  const isStreamingRef = useRef(false);
  // Use a ref for cursor so the streaming loop always has access to the latest value
  const cursorRef = useRef<number | string>(0);

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

    if (isPaused) {
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

    const loop = async () => {
      setIsLoading(true);
      while (!cancelled && isStreamingRef.current) {
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

          await new Promise((resolve) =>
            setTimeout(resolve, INTERVALS.POLLING_INTERVAL),
          );
        } catch (err: any) {
          if (err?.name === "AbortError") {
            break;
          }
          setError(err instanceof Error ? err : new Error(String(err)));

          await new Promise((resolve) =>
            setTimeout(resolve, INTERVALS.RETRY_DELAY),
          );
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
