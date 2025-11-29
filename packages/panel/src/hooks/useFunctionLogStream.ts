import { useEffect, useRef, useState } from 'react';
import { FunctionExecutionLog, ModuleFunction } from '../types';
import { INTERVALS } from '../utils/constants';
import { processFunctionLogs, streamFunctionLogs, streamUdfExecution } from '../utils/api';

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
  // Cursor is an opaque token from Convex, not a wall-clock timestamp.
  // Start from 0 so we actually receive recent executions; the server will
  // advance us via `new_cursor` on each response.
  const [cursor, setCursor] = useState<number | string>(() => 0);

  const abortRef = useRef<AbortController | null>(null);
  const isStreamingRef = useRef(false);

  const reset = () => {
    setLogs([]);
    // Reset back to the initial cursor so we can refetch from the server's
    // notion of the beginning; it will immediately advance us.
    setCursor(0);
    setError(null);
  };

  useEffect(() => {
    reset();
  }, [selectedFunction?.identifier]);

  useEffect(() => {
    if (!deploymentUrl || !authToken || !selectedFunction || useMockData) {
      return;
    }

    if (isPaused) {
      // When paused, stop any in-flight request
      abortRef.current?.abort();
      isStreamingRef.current = false;
      return;
    }

    isStreamingRef.current = true;
    abortRef.current = new AbortController();

    let cancelled = false;

    const loop = async () => {
      setIsLoading(true);
      while (!cancelled && isStreamingRef.current) {
        try {
          const { entries, newCursor } = useProgressEvents
            ? await streamFunctionLogs(deploymentUrl, authToken, cursor)
            : await streamUdfExecution(deploymentUrl, authToken, cursor);

          const processed = processFunctionLogs(entries, selectedFunction);
          if (processed.length > 0) {
            setLogs((prev) => {
              const existingIds = new Set(prev.map((l) => l.id));
              const merged = [...prev];
              processed.forEach((log) => {
                if (!existingIds.has(log.id)) {
                  merged.push(log);
                }
              });
              return merged.sort((a, b) => b.startedAt - a.startedAt);
            });
          }

          if (typeof newCursor === 'number') {
            setCursor(newCursor);
          }
          setError(null);

          await new Promise((resolve) => setTimeout(resolve, INTERVALS.POLLING_INTERVAL));
        } catch (err: any) {
          if (err?.name === 'AbortError') {
            break;
          }
          setError(err instanceof Error ? err : new Error(String(err)));
          
          await new Promise((resolve) => setTimeout(resolve, INTERVALS.RETRY_DELAY));
        }
      }
      setIsLoading(false);
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
    cursor,
  ]);

  return {
    logs,
    isLoading,
    error,
    cursor,
    reset,
  };
}


