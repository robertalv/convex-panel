import { useState, useEffect, useCallback } from "react";
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
 * Uses real API data only - no mock data.
 */
export function useHealthMetrics(): HealthMetrics {
  const { deploymentUrl, authToken } = useDeployment();

  // Failure rate state
  const [failureRateData, setFailureRateData] = useState<TimeSeriesDataPoint[]>(
    [],
  );
  const [failureRateLoading, setFailureRateLoading] = useState(true);
  const [failureRateError, setFailureRateError] = useState<string | null>(null);

  // Cache hit rate state
  const [cacheHitRateData, setCacheHitRateData] = useState<
    TimeSeriesDataPoint[]
  >([]);
  const [cacheHitRateLoading, setCacheHitRateLoading] = useState(true);
  const [cacheHitRateError, setCacheHitRateError] = useState<string | null>(
    null,
  );

  // Scheduler lag state
  const [schedulerLagData, setSchedulerLagData] = useState<
    TimeSeriesDataPoint[]
  >([]);
  const [schedulerLagLoading, setSchedulerLagLoading] = useState(true);
  const [schedulerLagError, setSchedulerLagError] = useState<string | null>(
    null,
  );

  // Latency state
  const [latencyPercentiles, setLatencyPercentiles] =
    useState<LatencyPercentiles>({
      p50: 0,
      p95: 0,
      p99: 0,
    });
  const [latencyLoading, setLatencyLoading] = useState(true);
  const [latencyError, setLatencyError] = useState<string | null>(null);

  // Request rate state
  const [requestRateData, setRequestRateData] = useState<TimeSeriesDataPoint[]>(
    [],
  );
  const [requestRateLoading, setRequestRateLoading] = useState(true);
  const [requestRateError, setRequestRateError] = useState<string | null>(null);

  // Fetch failure rate
  const refetchFailureRate = useCallback(async () => {
    if (!deploymentUrl || !authToken) {
      setFailureRateLoading(false);
      return;
    }

    setFailureRateLoading(true);
    setFailureRateError(null);

    try {
      const data = await fetchFailureRate(
        deploymentUrl,
        authToken,
        desktopFetch,
      );
      const transformed = transformTimeSeries(data);
      setFailureRateData(transformed);
    } catch (err) {
      console.error("[HealthMetrics] Failure rate error", err);
      setFailureRateError(
        err instanceof Error ? err.message : "Failed to fetch failure rate",
      );
    } finally {
      setFailureRateLoading(false);
    }
  }, [deploymentUrl, authToken]);

  // Fetch cache hit rate
  const refetchCacheHitRate = useCallback(async () => {
    if (!deploymentUrl || !authToken) {
      setCacheHitRateLoading(false);
      return;
    }

    setCacheHitRateLoading(true);
    setCacheHitRateError(null);

    try {
      const data = await fetchCacheHitRate(
        deploymentUrl,
        authToken,
        desktopFetch,
      );
      const transformed = transformTimeSeries(data);
      setCacheHitRateData(transformed);
    } catch (err) {
      setCacheHitRateError(
        err instanceof Error ? err.message : "Failed to fetch cache hit rate",
      );
    } finally {
      setCacheHitRateLoading(false);
    }
  }, [deploymentUrl, authToken]);

  // Fetch scheduler lag
  const refetchSchedulerLag = useCallback(async () => {
    if (!deploymentUrl || !authToken) {
      setSchedulerLagLoading(false);
      return;
    }

    setSchedulerLagLoading(true);
    setSchedulerLagError(null);

    try {
      const data = await fetchSchedulerLag(
        deploymentUrl,
        authToken,
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
      setSchedulerLagData(transformed);
    } catch (err) {
      setSchedulerLagError(
        err instanceof Error ? err.message : "Failed to fetch scheduler lag",
      );
    } finally {
      setSchedulerLagLoading(false);
    }
  }, [deploymentUrl, authToken]);

  // Fetch latency percentiles
  const refetchLatency = useCallback(async () => {
    if (!deploymentUrl || !authToken) {
      setLatencyLoading(false);
      return;
    }

    setLatencyLoading(true);
    setLatencyError(null);

    try {
      const data = await fetchLatencyPercentiles(
        deploymentUrl,
        authToken,
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

      setLatencyPercentiles(percentiles);
    } catch (err) {
      setLatencyError(
        err instanceof Error
          ? err.message
          : "Failed to fetch latency percentiles",
      );
    } finally {
      setLatencyLoading(false);
    }
  }, [deploymentUrl, authToken]);

  // Fetch request rate
  const refetchRequestRate = useCallback(async () => {
    if (!deploymentUrl || !authToken) {
      setRequestRateLoading(false);
      return;
    }

    setRequestRateLoading(true);
    setRequestRateError(null);

    try {
      const data = await fetchUdfRate(deploymentUrl, authToken, desktopFetch);
      const transformed = transformTimeSeries(data);
      setRequestRateData(transformed);
    } catch (err) {
      setRequestRateError(
        err instanceof Error ? err.message : "Failed to fetch request rate",
      );
    } finally {
      setRequestRateLoading(false);
    }
  }, [deploymentUrl, authToken]);

  // Fetch all metrics
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

  // Initial fetch
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Compute derived values
  const failureRate = getLatestValue(failureRateData);
  const failureRateTrend = calculateTrend(failureRateData);

  const cacheHitRate = getLatestValue(cacheHitRateData);
  const cacheHitRateTrend = calculateTrend(cacheHitRateData);

  const schedulerLag = getLatestValue(schedulerLagData);
  const schedulerLagTrend = calculateTrend(schedulerLagData);

  const requestRate = getLatestValue(requestRateData);
  const requestRateTrend = calculateTrend(requestRateData);

  const isLoading =
    failureRateLoading ||
    cacheHitRateLoading ||
    schedulerLagLoading ||
    latencyLoading ||
    requestRateLoading;

  const hasError = Boolean(
    failureRateError ||
    cacheHitRateError ||
    schedulerLagError ||
    latencyError ||
    requestRateError,
  );

  return {
    // Failure rate
    failureRate,
    failureRateTrend,
    failureRateData,
    failureRateLoading,
    failureRateError,

    // Cache hit rate
    cacheHitRate,
    cacheHitRateTrend,
    cacheHitRateData,
    cacheHitRateLoading,
    cacheHitRateError,

    // Scheduler lag
    schedulerLag,
    schedulerLagTrend,
    schedulerLagData,
    schedulerLagLoading,
    schedulerLagError,

    // Latency percentiles
    latencyPercentiles,
    latencyLoading,
    latencyError,

    // Request rate
    requestRate,
    requestRateTrend,
    requestRateData,
    requestRateLoading,
    requestRateError,

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
