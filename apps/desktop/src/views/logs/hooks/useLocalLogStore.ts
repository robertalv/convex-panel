/**
 * useLocalLogStore Hook
 * React hook that bridges to Tauri SQLite log storage backend
 */

import { invoke } from "@tauri-apps/api/core";
import { useCallback, useState, useEffect } from "react";
import type { LogEntry } from "../types";

// Matches Rust types
export interface LogFilters {
  deployment?: string;
  start_ts?: number;
  end_ts?: number;
  levels?: string[];
  topics?: string[];
  function_path?: string;
  request_id?: string;
  success?: boolean;
}

export interface LogQueryResult {
  logs: LocalLogEntry[];
  total_count: number;
  has_more: boolean;
  cursor?: string;
}

export interface LocalLogEntry {
  id: string;
  ts: number;
  deployment: string;
  request_id?: string;
  execution_id?: string;
  topic?: string;
  level?: string;
  function_path?: string;
  function_name?: string;
  udf_type?: string;
  success?: boolean;
  duration_ms?: number;
  message: string;
  json_blob: string;
  created_at: number;
}

export interface IngestResult {
  inserted: number;
  duplicates: number;
  errors: number;
}

export interface LogStats {
  total_logs: number;
  oldest_ts?: number;
  newest_ts?: number;
  db_size_bytes: number;
  logs_by_deployment: [string, number][];
}

export interface LogStoreSettings {
  retention_days: number;
  enabled: boolean;
}

export interface UseLocalLogStoreReturn {
  // Ingest
  ingestLogs: (logs: LogEntry[], deployment: string) => Promise<IngestResult>;

  // Query
  queryLogs: (
    filters: LogFilters,
    limit?: number,
    cursor?: string,
  ) => Promise<LogQueryResult>;
  searchLogs: (
    query: string,
    filters: LogFilters,
    limit?: number,
    cursor?: string,
  ) => Promise<LogQueryResult>;
  getLogById: (id: string) => Promise<LocalLogEntry | null>;

  // Stats & Settings
  getStats: () => Promise<LogStats>;
  stats: LogStats | null;
  refreshStats: () => Promise<void>;

  getSettings: () => Promise<LogStoreSettings>;
  settings: LogStoreSettings | null;
  updateSettings: (settings: Partial<LogStoreSettings>) => Promise<void>;

  // Maintenance
  deleteOlderThan: (days: number) => Promise<number>;
  clearLogs: () => Promise<void>;
  optimizeDb: () => Promise<void>;

  // State
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to interact with the local SQLite log store
 */
export function useLocalLogStore(): UseLocalLogStoreReturn {
  const [stats, setStats] = useState<LogStats | null>(null);
  const [settings, setSettings] = useState<LogStoreSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Ingest logs
  const ingestLogs = useCallback(
    async (logs: LogEntry[], deployment: string): Promise<IngestResult> => {
      try {
        setError(null);

        // Helper to convert float fields to integers in nested objects
        const sanitizeNumericFields = (obj: any): any => {
          if (obj === null || obj === undefined) return obj;
          if (typeof obj !== "object") return obj;
          if (Array.isArray(obj)) return obj.map(sanitizeNumericFields);

          const sanitized: any = {};
          for (const [key, value] of Object.entries(obj)) {
            // Convert known timestamp and duration fields to integers
            if (
              (key.includes("timestamp") ||
                key.includes("time") ||
                key === "execution_time" ||
                key === "ts") &&
              typeof value === "number"
            ) {
              sanitized[key] = Math.floor(value);
            } else if (typeof value === "object") {
              sanitized[key] = sanitizeNumericFields(value);
            } else {
              sanitized[key] = value;
            }
          }
          return sanitized;
        };

        // Convert LogEntry to IngestLogEntry format expected by Rust
        const ingestEntries = logs.map((log) => ({
          id: log.id,
          timestamp: Math.floor(log.timestamp), // Ensure integer
          functionIdentifier: log.functionIdentifier,
          functionName: log.functionName,
          udfType: log.udfType,
          requestId: log.requestId,
          executionId: log.executionId,
          success: log.success,
          durationMs: Math.floor(log.durationMs), // Convert float to integer
          error: log.error,
          logLines: log.logLines,
          raw: sanitizeNumericFields(log.raw), // Sanitize nested timestamp fields
        }));

        const result = await invoke<IngestResult>("ingest_logs", {
          logs: ingestEntries,
          deployment,
        });
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        console.error("[useLocalLogStore] Ingest failed:", error);
        return { inserted: 0, duplicates: 0, errors: logs.length };
      }
    },
    [],
  );

  // Query logs
  const queryLogs = useCallback(
    async (
      filters: LogFilters,
      limit?: number,
      cursor?: string,
    ): Promise<LogQueryResult> => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await invoke<LogQueryResult>("query_logs", {
          filters,
          limit,
          cursor,
        });
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        console.error("[useLocalLogStore] Query failed:", error);
        return { logs: [], total_count: 0, has_more: false };
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // Search logs with FTS
  const searchLogs = useCallback(
    async (
      query: string,
      filters: LogFilters,
      limit?: number,
      cursor?: string,
    ): Promise<LogQueryResult> => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await invoke<LogQueryResult>("search_logs", {
          query,
          filters,
          limit,
          cursor,
        });
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        console.error("[useLocalLogStore] Search failed:", error);
        return { logs: [], total_count: 0, has_more: false };
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // Get log by ID
  const getLogById = useCallback(async (id: string) => {
    try {
      setError(null);
      const result = await invoke<LocalLogEntry | null>("get_log_by_id", {
        id,
      });
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error("[useLocalLogStore] Get by ID failed:", error);
      return null;
    }
  }, []);

  // Get stats
  const getStats = useCallback(async (): Promise<LogStats> => {
    try {
      setError(null);
      const result = await invoke<LogStats>("get_log_stats");
      setStats(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error("[useLocalLogStore] Get stats failed:", error);
      return {
        total_logs: 0,
        db_size_bytes: 0,
        logs_by_deployment: [],
      };
    }
  }, []);

  const refreshStats = useCallback(async () => {
    await getStats();
  }, [getStats]);

  // Get settings
  const getSettings = useCallback(async (): Promise<LogStoreSettings> => {
    try {
      setError(null);
      const result = await invoke<LogStoreSettings>("get_log_store_settings");
      setSettings(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error("[useLocalLogStore] Get settings failed:", error);
      return { retention_days: 30, enabled: true };
    }
  }, []);

  // Update settings
  const updateSettings = useCallback(
    async (updates: Partial<LogStoreSettings>) => {
      try {
        setError(null);
        const currentSettings = settings || {
          retention_days: 30,
          enabled: true,
        };
        const newSettings = { ...currentSettings, ...updates };
        await invoke("set_log_store_settings", { settings: newSettings });
        setSettings(newSettings);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        console.error("[useLocalLogStore] Update settings failed:", error);
        throw error;
      }
    },
    [settings],
  );

  // Delete older than N days
  const deleteOlderThan = useCallback(
    async (days: number): Promise<number> => {
      try {
        setError(null);
        const deleted = await invoke<number>("delete_logs_older_than", {
          days,
        });
        await refreshStats();
        return deleted;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        console.error("[useLocalLogStore] Delete older than failed:", error);
        return 0;
      }
    },
    [refreshStats],
  );

  // Clear all logs
  const clearLogs = useCallback(async () => {
    try {
      setError(null);
      await invoke("clear_all_logs");
      await refreshStats();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error("[useLocalLogStore] Clear logs failed:", error);
      throw error;
    }
  }, [refreshStats]);

  // Optimize database
  const optimizeDb = useCallback(async () => {
    try {
      setError(null);
      await invoke("optimize_log_db");
      await refreshStats();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error("[useLocalLogStore] Optimize DB failed:", error);
      throw error;
    }
  }, [refreshStats]);

  // Load initial stats and settings on mount
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      if (!mounted) return;
      await getStats();
      if (!mounted) return;
      await getSettings();
    };

    loadData();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  return {
    ingestLogs,
    queryLogs,
    searchLogs,
    getLogById,
    getStats,
    stats,
    refreshStats,
    getSettings,
    settings,
    updateSettings,
    deleteOlderThan,
    clearLogs,
    optimizeDb,
    isLoading,
    error,
  };
}

export default useLocalLogStore;
