import { useMemo } from "react";
import { useUdfExecutionStats } from "./useUdfExecutionStats";

export interface UsageMetrics {
  // Database metrics
  databaseReadBytes: number;
  databaseWriteBytes: number;
  databaseReadDocuments: number;

  // Storage metrics
  storageReadBytes: number;
  storageWriteBytes: number;

  // Vector index metrics
  vectorIndexReadBytes: number;
  vectorIndexWriteBytes: number;

  // Memory
  totalMemoryUsedMb: number;
  peakMemoryUsedMb: number;

  // Aggregated
  totalBytesRead: number;
  totalBytesWritten: number;
}

interface UsageMetricsResult extends UsageMetrics {
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Hook for aggregating usage metrics from UDF execution stats.
 * Uses shared UDF execution stats to avoid duplicate fetches.
 */
export function useUsageMetrics(): UsageMetricsResult {
  const { entries, isLoading, error, refetch } = useUdfExecutionStats();

  const metrics = useMemo(() => {
    if (!entries || entries.length === 0) {
      return {
        databaseReadBytes: 0,
        databaseWriteBytes: 0,
        databaseReadDocuments: 0,
        storageReadBytes: 0,
        storageWriteBytes: 0,
        vectorIndexReadBytes: 0,
        vectorIndexWriteBytes: 0,
        totalMemoryUsedMb: 0,
        peakMemoryUsedMb: 0,
        totalBytesRead: 0,
        totalBytesWritten: 0,
      };
    }

    let databaseReadBytes = 0;
    let databaseWriteBytes = 0;
    let databaseReadDocuments = 0;
    let storageReadBytes = 0;
    let storageWriteBytes = 0;
    let vectorIndexReadBytes = 0;
    let vectorIndexWriteBytes = 0;
    let totalMemoryUsedMb = 0;
    let peakMemoryUsedMb = 0;

    for (const entry of entries) {
      const raw = entry as any;
      const stats = raw.usage_stats || raw.usageStats;

      if (stats) {
        databaseReadBytes +=
          stats.database_read_bytes ?? stats.databaseReadBytes ?? 0;
        databaseWriteBytes +=
          stats.database_write_bytes ?? stats.databaseWriteBytes ?? 0;
        databaseReadDocuments +=
          stats.database_read_documents ?? stats.databaseReadDocuments ?? 0;
        storageReadBytes +=
          stats.storage_read_bytes ?? stats.storageReadBytes ?? 0;
        storageWriteBytes +=
          stats.storage_write_bytes ?? stats.storageWriteBytes ?? 0;
        vectorIndexReadBytes +=
          stats.vector_index_read_bytes ?? stats.vectorIndexReadBytes ?? 0;
        vectorIndexWriteBytes +=
          stats.vector_index_write_bytes ?? stats.vectorIndexWriteBytes ?? 0;

        const memUsed = stats.memory_used_mb ?? stats.memoryUsedMb ?? 0;
        totalMemoryUsedMb += memUsed;
        peakMemoryUsedMb = Math.max(peakMemoryUsedMb, memUsed);
      }
    }

    const totalBytesRead =
      databaseReadBytes + storageReadBytes + vectorIndexReadBytes;
    const totalBytesWritten =
      databaseWriteBytes + storageWriteBytes + vectorIndexWriteBytes;

    return {
      databaseReadBytes,
      databaseWriteBytes,
      databaseReadDocuments,
      storageReadBytes,
      storageWriteBytes,
      vectorIndexReadBytes,
      vectorIndexWriteBytes,
      totalMemoryUsedMb,
      peakMemoryUsedMb,
      totalBytesRead,
      totalBytesWritten,
    };
  }, [entries]);

  return {
    ...metrics,
    isLoading,
    error,
    refetch,
  };
}
