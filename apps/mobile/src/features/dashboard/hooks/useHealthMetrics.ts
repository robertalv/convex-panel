import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchFailureRate,
  fetchCacheHitRate,
  fetchSchedulerLag,
} from "../../../api";
import { useDeployment } from "../../../contexts/DeploymentContext";
import { useAuth } from "../../../contexts/AuthContext";
import { STALE_TIME, REFETCH_INTERVAL } from "../../../contexts/QueryContext";
import { mobileFetch } from "../../../utils/fetch";
import { useUdfExecutionStats } from "./useUdfExecutionStats";

export interface TimeSeriesDataPoint {
  time: number;
  value: number | null;
}

interface LatencyPercentiles {
  p50: number;
  p95: number;
  p99: number;
}

interface HealthMetrics {
  // Failure rate
  failureRate: number;
  failureRateTrend: string;
  failureRateData: TimeSeriesDataPoint[];
  failureRateLoading: boolean;
  failureRateError: string | null;

  // Cache hit rate
  cacheHitRate: number;
  cacheHitRateTrend: string;
  cacheHitRateData: TimeSeriesDataPoint[];
  cacheHitRateLoading: boolean;
  cacheHitRateError: string | null;

  // Scheduler lag
  schedulerLag: number;
  schedulerLagTrend: string;
  schedulerLagData: TimeSeriesDataPoint[];
  schedulerLagLoading: boolean;
  schedulerLagError: string | null;

  // Latency percentiles
  latencyPercentiles: LatencyPercentiles;
  latencyLoading: boolean;
  latencyError: string | null;

  // Request rate
  requestRate: number;
  requestRateTrend: string;
  requestRateData: TimeSeriesDataPoint[];
  requestRateLoading: boolean;
  requestRateError: string | null;

  // Global state
  isLoading: boolean;
  hasError: boolean;

  // Actions
  refetch: () => void;
  refetchFailureRate: () => void;
  refetchCacheHitRate: () => void;
  refetchSchedulerLag: () => void;
  refetchLatency: () => void;
  refetchRequestRate: () => void;
}

// Query key factory for consistent key management
export const healthMetricsKeys = {
  all: ["healthMetrics"] as const,
  failureRate: (deploymentUrl: string) =>
    [...healthMetricsKeys.all, "failureRate", deploymentUrl] as const,
  cacheHitRate: (deploymentUrl: string) =>
    [...healthMetricsKeys.all, "cacheHitRate", deploymentUrl] as const,
  schedulerLag: (deploymentUrl: string) =>
    [...healthMetricsKeys.all, "schedulerLag", deploymentUrl] as const,
  latency: (deploymentUrl: string) =>
    [...healthMetricsKeys.all, "latency", deploymentUrl] as const,
  requestRate: (deploymentUrl: string) =>
    [...healthMetricsKeys.all, "requestRate", deploymentUrl] as const,
};

/**
 * Transform API response to TimeSeriesDataPoint array.
 * API returns: Array<[string, Array<[{secs_since_epoch: number}, number | null]>]>
 */
function transformTimeSeries(
  data: Array<[string, Array<[{ secs_since_epoch: number }, number | null]>]>,
): TimeSeriesDataPoint[] {
  if (!data || data.length === 0) return [];

  // Get the first function's time series (aggregate across all)
  const allPoints: TimeSeriesDataPoint[] = [];

  for (const [, timeSeries] of data) {
    for (const [timestamp, value] of timeSeries) {
      allPoints.push({
        time: timestamp.secs_since_epoch,
        value: value,
      });
    }
  }

  // Sort by time and deduplicate
  allPoints.sort((a, b) => a.time - b.time);

  return allPoints;
}

/**
 * Calculate trend percentage from time series data.
 */
function calculateTrend(data: TimeSeriesDataPoint[]): string {
  if (data.length < 2) return "";

  const validData = data.filter((d) => d.value !== null);
  if (validData.length < 2) return "";

  const recent = validData.slice(-5);
  const earlier = validData.slice(0, 5);

  const recentAvg =
    recent.reduce((sum, d) => sum + (d.value ?? 0), 0) / recent.length;
  const earlierAvg =
    earlier.reduce((sum, d) => sum + (d.value ?? 0), 0) / earlier.length;

  if (earlierAvg === 0) return recentAvg > 0 ? "+100%" : "";

  const change = ((recentAvg - earlierAvg) / earlierAvg) * 100;
  const prefix = change >= 0 ? "+" : "";
  return `${prefix}${change.toFixed(1)}%`;
}

/**
 * Get the latest value from time series data.
 */
function getLatestValue(data: TimeSeriesDataPoint[]): number {
  const validData = data.filter((d) => d.value !== null);
  if (validData.length === 0) return 0;
  return validData[validData.length - 1].value ?? 0;
}

/**
 * Hook for fetching and managing health metrics data.
 * Uses React Query for caching and automatic refetching.
 */
export function useHealthMetrics(): HealthMetrics {
  const { deployment } = useDeployment();
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const deploymentUrl = deployment?.url ?? null;
  const authToken = session?.accessToken ?? null;
  const enabled = Boolean(deploymentUrl && authToken);

  // Failure rate query
  const failureRateQuery = useQuery({
    queryKey: healthMetricsKeys.failureRate(deploymentUrl ?? ""),
    queryFn: async () => {
      const data = await fetchFailureRate(
        deploymentUrl!,
        authToken!,
        mobileFetch,
      );
      return transformTimeSeries(data);
    },
    enabled,
    staleTime: STALE_TIME.health,
    refetchInterval: REFETCH_INTERVAL.health,
    refetchOnMount: false,
  });

  // Cache hit rate query
  const cacheHitRateQuery = useQuery({
    queryKey: healthMetricsKeys.cacheHitRate(deploymentUrl ?? ""),
    queryFn: async () => {
      const data = await fetchCacheHitRate(
        deploymentUrl!,
        authToken!,
        mobileFetch,
      );
      return transformTimeSeries(data);
    },
    enabled,
    staleTime: STALE_TIME.health,
    refetchInterval: REFETCH_INTERVAL.health,
    refetchOnMount: false,
  });

  // Scheduler lag query
  const schedulerLagQuery = useQuery({
    queryKey: healthMetricsKeys.schedulerLag(deploymentUrl ?? ""),
    queryFn: async () => {
      const data = await fetchSchedulerLag(
        deploymentUrl!,
        authToken!,
        mobileFetch,
      );
      // Scheduler lag returns array of [timestamp, value] directly
      const transformed: TimeSeriesDataPoint[] = Array.isArray(data)
        ? data.map(
            ([timestamp, value]: [
              { secs_since_epoch: number },
              number | null,
            ]) => ({
              time: timestamp.secs_since_epoch,
              value,
            }),
          )
        : [];
      return transformed;
    },
    enabled,
    staleTime: STALE_TIME.health,
    refetchInterval: REFETCH_INTERVAL.health,
    refetchOnMount: false,
  });

  // Latency percentiles query - derived from shared UDF execution stats
  const { entries: udfEntries } = useUdfExecutionStats();

  const latencyPercentiles = useMemo(() => {
    if (!udfEntries || udfEntries.length === 0) {
      return { p50: 0, p95: 0, p99: 0 };
    }

    // Get execution times from entries
    const executionTimes: number[] = [];
    udfEntries.forEach((entry: any) => {
      let execTime =
        entry.execution_time_ms ||
        entry.executionTimeMs ||
        entry.execution_time ||
        entry.executionTime;
      if (execTime) {
        // Convert to milliseconds if needed
        if (execTime < 1000 && execTime > 0) {
          execTime = execTime * 1000;
        }
        if (execTime > 0) {
          executionTimes.push(execTime);
        }
      }
    });

    if (executionTimes.length === 0) {
      return { p50: 0, p95: 0, p99: 0 };
    }

    // Calculate percentiles
    const sorted = executionTimes.sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];

    return { p50, p95, p99 };
  }, [udfEntries]);

  // Request rate query - derived from shared UDF execution stats
  const requestRateData = useMemo(() => {
    if (!udfEntries || udfEntries.length === 0) {
      return [];
    }

    const now = Math.floor(Date.now() / 1000);
    const twentySixMinutesAgo = now - 26 * 60;
    const numBuckets = 26;
    const bucketSizeSeconds = (26 * 60) / numBuckets;

    // Initialize buckets
    const buckets: number[] = Array(numBuckets).fill(0);

    // Count invocations per bucket
    udfEntries.forEach((entry: any) => {
      let entryTime =
        entry.timestamp || entry.execution_timestamp || entry.unix_timestamp;
      if (entryTime > 1e12) {
        entryTime = Math.floor(entryTime / 1000);
      }

      if (entryTime >= twentySixMinutesAgo && entryTime <= now) {
        const bucketIndex = Math.floor(
          (entryTime - twentySixMinutesAgo) / bucketSizeSeconds,
        );
        const clampedIndex = Math.max(0, Math.min(numBuckets - 1, bucketIndex));
        buckets[clampedIndex]++;
      }
    });

    // Convert to TimeSeriesDataPoint format
    const result: TimeSeriesDataPoint[] = [];
    for (let i = 0; i < numBuckets; i++) {
      const bucketTime = twentySixMinutesAgo + i * bucketSizeSeconds;
      result.push({
        time: bucketTime,
        value: buckets[i],
      });
    }

    return result;
  }, [udfEntries]);

  // Latency percentiles query (keep for loading/error state only)
  const latencyQuery = useQuery({
    queryKey: healthMetricsKeys.latency(deploymentUrl ?? ""),
    queryFn: async () => {
      // This is now a no-op since we derive from shared stats
      return { p50: 0, p95: 0, p99: 0 };
    },
    enabled: false, // Disabled since we compute from shared stats
    staleTime: STALE_TIME.health,
    refetchInterval: REFETCH_INTERVAL.health,
    refetchOnMount: false,
  });

  // Request rate query (keep for loading/error state only)
  const requestRateQuery = useQuery({
    queryKey: healthMetricsKeys.requestRate(deploymentUrl ?? ""),
    queryFn: async () => {
      // This is now a no-op since we derive from shared stats
      return [];
    },
    enabled: false, // Disabled since we compute from shared stats
    staleTime: STALE_TIME.health,
    refetchInterval: REFETCH_INTERVAL.health,
    refetchOnMount: false,
  });

  // Compute derived values
  const failureRateData = failureRateQuery.data ?? [];
  const failureRate = getLatestValue(failureRateData);
  const failureRateTrend = useMemo(
    () => calculateTrend(failureRateData),
    [failureRateData],
  );

  const cacheHitRateData = cacheHitRateQuery.data ?? [];
  const cacheHitRate = getLatestValue(cacheHitRateData);
  const cacheHitRateTrend = useMemo(
    () => calculateTrend(cacheHitRateData),
    [cacheHitRateData],
  );

  const schedulerLagData = schedulerLagQuery.data ?? [];
  const schedulerLag = getLatestValue(schedulerLagData);
  const schedulerLagTrend = useMemo(
    () => calculateTrend(schedulerLagData),
    [schedulerLagData],
  );

  // Latency and request rate computed above from shared stats
  const requestRate = getLatestValue(requestRateData);
  const requestRateTrend = useMemo(
    () => calculateTrend(requestRateData),
    [requestRateData],
  );

  // Refetch functions
  const refetchFailureRate = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: healthMetricsKeys.failureRate(deploymentUrl ?? ""),
    });
  }, [queryClient, deploymentUrl]);

  const refetchCacheHitRate = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: healthMetricsKeys.cacheHitRate(deploymentUrl ?? ""),
    });
  }, [queryClient, deploymentUrl]);

  const refetchSchedulerLag = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: healthMetricsKeys.schedulerLag(deploymentUrl ?? ""),
    });
  }, [queryClient, deploymentUrl]);

  const refetchLatency = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: healthMetricsKeys.latency(deploymentUrl ?? ""),
    });
  }, [queryClient, deploymentUrl]);

  const refetchRequestRate = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: healthMetricsKeys.requestRate(deploymentUrl ?? ""),
    });
  }, [queryClient, deploymentUrl]);

  const refetch = useCallback(() => {
    refetchFailureRate();
    refetchCacheHitRate();
    refetchSchedulerLag();
    refetchLatency();
    refetchRequestRate();
  }, [
    refetchFailureRate,
    refetchCacheHitRate,
    refetchSchedulerLag,
    refetchLatency,
    refetchRequestRate,
  ]);

  // Aggregate loading and error states
  const isLoading =
    failureRateQuery.isLoading ||
    cacheHitRateQuery.isLoading ||
    schedulerLagQuery.isLoading;

  const hasError = Boolean(
    failureRateQuery.error ||
      cacheHitRateQuery.error ||
      schedulerLagQuery.error,
  );

  return {
    // Failure rate
    failureRate,
    failureRateTrend,
    failureRateData,
    failureRateLoading: failureRateQuery.isLoading,
    failureRateError: failureRateQuery.error?.message ?? null,

    // Cache hit rate
    cacheHitRate,
    cacheHitRateTrend,
    cacheHitRateData,
    cacheHitRateLoading: cacheHitRateQuery.isLoading,
    cacheHitRateError: cacheHitRateQuery.error?.message ?? null,

    // Scheduler lag
    schedulerLag,
    schedulerLagTrend,
    schedulerLagData,
    schedulerLagLoading: schedulerLagQuery.isLoading,
    schedulerLagError: schedulerLagQuery.error?.message ?? null,

    // Latency percentiles (derived from shared UDF stats)
    latencyPercentiles,
    latencyLoading: false,
    latencyError: null,

    // Request rate (derived from shared UDF stats)
    requestRate,
    requestRateTrend,
    requestRateData,
    requestRateLoading: false,
    requestRateError: null,

    // Global state
    isLoading,
    hasError,

    // Actions
    refetch,
    refetchFailureRate,
    refetchCacheHitRate,
    refetchSchedulerLag,
    refetchLatency,
    refetchRequestRate,
  };
}
