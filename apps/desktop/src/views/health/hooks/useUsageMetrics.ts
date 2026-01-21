import { useMemo } from "react";
import { useUdfExecutionStats } from "./useUdfExecutionStats";

/**
 * A single data point for time-series charts
 */
export interface UsageDataPoint {
  timestamp: number;
  label: string;
  databaseReadBytes: number;
  databaseWriteBytes: number;
  databaseReadDocuments: number;
  storageReadBytes: number;
  storageWriteBytes: number;
}

export interface UsageMetrics {
  databaseReadBytes: number;
  databaseWriteBytes: number;
  databaseReadDocuments: number;
  storageReadBytes: number;
  storageWriteBytes: number;
  vectorIndexReadBytes: number;
  vectorIndexWriteBytes: number;
  totalMemoryUsedMb: number;
  peakMemoryUsedMb: number;
  totalBytesRead: number;
  totalBytesWritten: number;
  timeSeries: UsageDataPoint[];
}

interface UsageMetricsResult extends UsageMetrics {
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const BUCKET_SIZE_MS = 5 * 60 * 1000;

/**
 * Format timestamp to a short time label (e.g., "2:30p")
 */
function formatTimeLabel(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "p" : "a";
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, "0");
  return `${displayHours}:${displayMinutes}${ampm}`;
}

/**
 * Hook for aggregating usage metrics from UDF execution stats.
 * Uses shared UDF execution stats to avoid duplicate fetches.
 * Also computes time-series data grouped by 5-minute buckets.
 */
export function useUsageMetrics(): UsageMetricsResult {
  const { entries, isLoading, error, refetch } = useUdfExecutionStats();

  const metrics = useMemo(() => {
    const emptyResult = {
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
      timeSeries: [] as UsageDataPoint[],
    };

    if (!entries || entries.length === 0) {
      return emptyResult;
    }

    // Totals for aggregation
    let databaseReadBytes = 0;
    let databaseWriteBytes = 0;
    let databaseReadDocuments = 0;
    let storageReadBytes = 0;
    let storageWriteBytes = 0;
    let vectorIndexReadBytes = 0;
    let vectorIndexWriteBytes = 0;
    let totalMemoryUsedMb = 0;
    let peakMemoryUsedMb = 0;

    const bucketMap = new Map<number, UsageDataPoint>();

    for (const entry of entries) {
      const raw = entry as any;
      const stats = raw.usage_stats || raw.usageStats;
      const timestamp = raw.timestamp as number;

      if (stats) {
        const dbReadBytes =
          stats.database_read_bytes ?? stats.databaseReadBytes ?? 0;
        const dbWriteBytes =
          stats.database_write_bytes ?? stats.databaseWriteBytes ?? 0;
        const dbReadDocs =
          stats.database_read_documents ?? stats.databaseReadDocuments ?? 0;
        const stReadBytes =
          stats.storage_read_bytes ?? stats.storageReadBytes ?? 0;
        const stWriteBytes =
          stats.storage_write_bytes ?? stats.storageWriteBytes ?? 0;
        const viReadBytes =
          stats.vector_index_read_bytes ?? stats.vectorIndexReadBytes ?? 0;
        const viWriteBytes =
          stats.vector_index_write_bytes ?? stats.vectorIndexWriteBytes ?? 0;

        databaseReadBytes += dbReadBytes;
        databaseWriteBytes += dbWriteBytes;
        databaseReadDocuments += dbReadDocs;
        storageReadBytes += stReadBytes;
        storageWriteBytes += stWriteBytes;
        vectorIndexReadBytes += viReadBytes;
        vectorIndexWriteBytes += viWriteBytes;

        const memUsed = stats.memory_used_mb ?? stats.memoryUsedMb ?? 0;
        totalMemoryUsedMb += memUsed;
        peakMemoryUsedMb = Math.max(peakMemoryUsedMb, memUsed);

        if (timestamp) {
          const bucketTimestamp =
            Math.floor(timestamp / BUCKET_SIZE_MS) * BUCKET_SIZE_MS;

          const existing = bucketMap.get(bucketTimestamp);
          if (existing) {
            existing.databaseReadBytes += dbReadBytes;
            existing.databaseWriteBytes += dbWriteBytes;
            existing.databaseReadDocuments += dbReadDocs;
            existing.storageReadBytes += stReadBytes;
            existing.storageWriteBytes += stWriteBytes;
          } else {
            bucketMap.set(bucketTimestamp, {
              timestamp: bucketTimestamp,
              label: formatTimeLabel(bucketTimestamp),
              databaseReadBytes: dbReadBytes,
              databaseWriteBytes: dbWriteBytes,
              databaseReadDocuments: dbReadDocs,
              storageReadBytes: stReadBytes,
              storageWriteBytes: stWriteBytes,
            });
          }
        }
      }
    }

    const totalBytesRead =
      databaseReadBytes + storageReadBytes + vectorIndexReadBytes;
    const totalBytesWritten =
      databaseWriteBytes + storageWriteBytes + vectorIndexWriteBytes;

    const timeSeries = Array.from(bucketMap.values()).sort(
      (a, b) => a.timestamp - b.timestamp,
    );

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
      timeSeries,
    };
  }, [entries]);

  return {
    ...metrics,
    isLoading,
    error,
    refetch,
  };
}
