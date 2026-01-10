import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchFailureRate,
  fetchCacheHitRate,
  fetchSchedulerLag,
  fetchLatencyPercentiles,
  fetchUdfRate,
  type FetchFn,
} from "@convex-panel/shared/api";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { useDeployment } from "@/contexts/DeploymentContext";
import { STALE_TIME, REFETCH_INTERVAL } from "@/contexts/QueryContext";
import type { TimeSeriesDataPoint } from "../components/MetricChart";

// Use Tauri's fetch for CORS-free HTTP requests in the desktop app
const desktopFetch: FetchFn = (input, init) => tauriFetch(input, init);

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
  const { deploymentUrl, authToken } = useDeployment();
  const queryClient = useQueryClient();

  const enabled = Boolean(deploymentUrl && authToken);

  // Failure rate query
  const failureRateQuery = useQuery({
    queryKey: healthMetricsKeys.failureRate(deploymentUrl ?? ""),
    queryFn: async () => {
      const data = await fetchFailureRate(
        deploymentUrl!,
        authToken!,
        desktopFetch,
      );
      return transformTimeSeries(data);
    },
    enabled,
    staleTime: STALE_TIME.health,
    refetchInterval: REFETCH_INTERVAL.health,
    refetchOnMount: false,
    placeholderData: (previousData) => previousData ?? [],
  });

  // Cache hit rate query
  const cacheHitRateQuery = useQuery({
    queryKey: healthMetricsKeys.cacheHitRate(deploymentUrl ?? ""),
    queryFn: async () => {
      const data = await fetchCacheHitRate(
        deploymentUrl!,
        authToken!,
        desktopFetch,
      );
      return transformTimeSeries(data);
    },
    enabled,
    staleTime: STALE_TIME.health,
    refetchInterval: REFETCH_INTERVAL.health,
    refetchOnMount: false,
    placeholderData: (previousData) => previousData ?? [],
  });

  // Scheduler lag query
  const schedulerLagQuery = useQuery({
    queryKey: healthMetricsKeys.schedulerLag(deploymentUrl ?? ""),
    queryFn: async () => {
      const data = await fetchSchedulerLag(
        deploymentUrl!,
        authToken!,
        desktopFetch,
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
    placeholderData: (previousData) => previousData ?? [],
  });

  // Latency percentiles query
  const latencyQuery = useQuery({
    queryKey: healthMetricsKeys.latency(deploymentUrl ?? ""),
    queryFn: async () => {
      const data = await fetchLatencyPercentiles(
        deploymentUrl!,
        authToken!,
        desktopFetch,
      );
      // Data format: [[50, [[timestamp, value]]], [95, [...]], [99, [...]]]
      const percentiles: LatencyPercentiles = { p50: 0, p95: 0, p99: 0 };

      for (const [percentile, timeSeries] of data) {
        const latestValue =
          timeSeries.length > 0
            ? (timeSeries[timeSeries.length - 1][1] ?? 0)
            : 0;
        if (percentile === 50) percentiles.p50 = latestValue;
        else if (percentile === 95) percentiles.p95 = latestValue;
        else if (percentile === 99) percentiles.p99 = latestValue;
      }

      return percentiles;
    },
    enabled,
    staleTime: STALE_TIME.health,
    refetchInterval: REFETCH_INTERVAL.health,
    refetchOnMount: false,
  });

  // Request rate query
  const requestRateQuery = useQuery({
    queryKey: healthMetricsKeys.requestRate(deploymentUrl ?? ""),
    queryFn: async () => {
      const data = await fetchUdfRate(deploymentUrl!, authToken!, desktopFetch);
      return transformTimeSeries(data);
    },
    enabled,
    staleTime: STALE_TIME.health,
    refetchInterval: REFETCH_INTERVAL.health,
    refetchOnMount: false,
    placeholderData: (previousData) => previousData ?? [],
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

  const latencyPercentiles = latencyQuery.data ?? { p50: 0, p95: 0, p99: 0 };

  const requestRateData = requestRateQuery.data ?? [];
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
    schedulerLagQuery.isLoading ||
    latencyQuery.isLoading ||
    requestRateQuery.isLoading;

  const hasError = Boolean(
    failureRateQuery.error ||
    cacheHitRateQuery.error ||
    schedulerLagQuery.error ||
    latencyQuery.error ||
    requestRateQuery.error,
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

    // Latency percentiles
    latencyPercentiles,
    latencyLoading: latencyQuery.isLoading,
    latencyError: latencyQuery.error?.message ?? null,

    // Request rate
    requestRate,
    requestRateTrend,
    requestRateData,
    requestRateLoading: requestRateQuery.isLoading,
    requestRateError: requestRateQuery.error?.message ?? null,

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
