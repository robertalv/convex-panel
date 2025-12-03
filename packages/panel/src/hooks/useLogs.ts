import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchLogsFromApi } from '../utils/api/logs';
import type { LogEntry, FetchLogsResponse } from '../types';

export interface UseLogsOptions {
  convexUrl?: string;
  accessToken: string;
  useMockData?: boolean;
  isPaused?: boolean;
  onError?: (error: string) => void;
  functionId?: string;
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

export function useLogs({
  convexUrl,
  accessToken,
  useMockData = false,
  isPaused: initialIsPaused = false,
  onError,
  functionId,
}: UseLogsOptions): UseLogsReturn {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isPaused, setIsPaused] = useState(initialIsPaused);
  const [cursor, setCursor] = useState<number | string>('now');
  const abortControllerRef = useRef<AbortController | null>(null);
  const isStreamingRef = useRef(false);

  const clearLogs = useCallback(() => {
    setLogs([]);
    setCursor('now');
    setError(null);
  }, []);

  const refreshLogs = useCallback(() => {
    clearLogs();
    setIsPaused(false);
  }, [clearLogs]);

  // Fetch logs function
  const fetchLogs = useCallback(async () => {
    if (!convexUrl || !accessToken || isPaused) {
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      setIsLoading(true);
      setError(null);

      const response: FetchLogsResponse = await fetchLogsFromApi({
        cursor,
        convexUrl,
        accessToken,
        signal,
        useMockData,
        functionId,
      });

      if (signal.aborted) return;

      if (response.logs && response.logs.length > 0) {
        setLogs((prevLogs) => {
          // Merge new logs, avoiding duplicates based on timestamp and request_id
          const existingIds = new Set(
            prevLogs.map((log: LogEntry) => `${log.timestamp}-${log.function?.request_id || ''}`)
          );
          const newLogs = response.logs.filter(
            (log: LogEntry) => !existingIds.has(`${log.timestamp}-${log.function?.request_id || ''}`)
          );
          // Sort by timestamp descending (newest first)
          return [...newLogs, ...prevLogs].sort((a, b) => b.timestamp - a.timestamp);
        });
      }

      if (response.newCursor) {
        setCursor(response.newCursor);
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return;
      }
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      if (onError) {
        onError(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [convexUrl, accessToken, cursor, isPaused, useMockData, onError, functionId]);

  // Polling effect
  useEffect(() => {
    if (isPaused || !convexUrl || !accessToken) {
      isStreamingRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      return;
    }

    isStreamingRef.current = true;

    // Initial fetch
    fetchLogs();

    // Set up polling interval
    const intervalId = setInterval(() => {
      if (isStreamingRef.current && !isPaused) {
        fetchLogs();
      }
    }, POLLING_INTERVAL);

    return () => {
      clearInterval(intervalId);
      isStreamingRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchLogs, isPaused, convexUrl, accessToken]);

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
