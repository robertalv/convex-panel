import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  fetchFailureRate,
  fetchCacheHitRate,
  fetchSchedulerLag,
  fetchLatencyPercentiles,
  fetchUdfRate,
} from "@convex-panel/shared/api";
import { desktopFetch } from "@/utils/desktop";
import { useDeployment } from "@/contexts/deployment-context";
import { STALE_TIME, REFETCH_INTERVAL } from "@/contexts/query-context";
import { useCombinedFetchingControl } from "@/hooks/useCombinedFetchingControl";
import { useUdfExecutionStats } from "./useUdfExecutionStats";
import {
  functionIdentifierValue,
  functionIdentifierFromValue,
} from "@/views/logs/lib/filterLogs";
import type { TimeSeriesDataPoint, MultiSeriesChartData } from "../types";

interface LatencyPercentiles {
  p50: number;
  p95: number;
  p99: number;
}

interface HealthMetrics {
  failureRate: number;
  failureRateTrend: string;
  failureRateData: MultiSeriesChartData | null;
  failureRateLoading: boolean;
  failureRateError: string | null;
  cacheHitRate: number;
  cacheHitRateTrend: string;
  cacheHitRateData: MultiSeriesChartData | null;
  cacheHitRateLoading: boolean;
  cacheHitRateError: string | null;
  schedulerLag: number;
  schedulerLagTrend: string;
  schedulerLagData: TimeSeriesDataPoint[];
  schedulerLagLoading: boolean;
  schedulerLagError: string | null;
  latencyPercentiles: LatencyPercentiles;
  latencyLoading: boolean;
  latencyError: string | null;
  requestRate: number;
  requestRateTrend: string;
  requestRateData: TimeSeriesDataPoint[];
  requestRateLoading: boolean;
  requestRateError: string | null;
  isLoading: boolean;
  hasError: boolean;
  refetch: () => void;
  refetchFailureRate: () => void;
  refetchCacheHitRate: () => void;
  refetchSchedulerLag: () => void;
  refetchLatency: () => void;
  refetchRequestRate: () => void;
}

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

const REST_COLOR = "var(--chart-line-1)";
const LINE_COLORS = [
  "var(--chart-line-2)",
  "var(--chart-line-3)",
  "var(--chart-line-4)",
  "var(--chart-line-5)",
  "var(--chart-line-6)",
  "var(--chart-line-7)",
];

/**
 * Get a deterministic color for a function name based on character codes
 */
function getColorForFunction(
  functionName: string,
  usedColors: Set<string>,
): string {
  if (functionName === "_rest") {
    return REST_COLOR;
  }

  const colorIndex =
    [...functionName].reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    LINE_COLORS.length;

  let color = LINE_COLORS[colorIndex];
  let attempts = 0;

  while (usedColors.has(color) && attempts < LINE_COLORS.length) {
    attempts++;
    color = LINE_COLORS[(colorIndex + attempts) % LINE_COLORS.length];
  }

  return color;
}

/**
 * Convert function name to identifier format
 */
function identifierForMetricName(metric: string): string {
  return metric === "_rest" ? metric : functionIdentifierValue(metric);
}

/**
 * Format function name for display in legend
 * Parses JSON identifier and formats as "componentPath/identifier" or just "identifier"
 */
function formatFunctionNameForDisplay(functionName: string): string {
  if (functionName === "_rest") {
    return "All other functions";
  }

  try {
    const parsed = functionIdentifierFromValue(functionName);
    if (parsed.componentPath) {
      return `${parsed.componentPath}/${parsed.identifier}`;
    }
    return parsed.identifier;
  } catch {
    // Fallback: if parsing fails, try to extract identifier from JSON string
    try {
      const jsonMatch = functionName.match(/"identifier"\s*:\s*"([^"]+)"/);
      if (jsonMatch) {
        return jsonMatch[1];
      }
    } catch {
      // If all else fails, return the original string
    }
    return functionName;
  }
}

/**
 * Transform API response to MultiSeriesChartData for per-function breakdown.
 * API returns: Array<[functionName, Array<[{secs_since_epoch: number}, number | null]>]>
 * Output: { data: [{time: "1:23 PM", func1: 10, func2: 20}], lineKeys: [...], xAxisKey: "time" }
 */
function transformMultiSeriesData(
  apiData: Array<
    [string, Array<[{ secs_since_epoch: number }, number | null]>]
  >,
  kind: "failurePercentage" | "cacheHitPercentage",
): MultiSeriesChartData | null {
  if (!apiData || apiData.length === 0) {
    return null;
  }

  const functions: string[] = apiData.map(([functionName]) => functionName);
  if (functions.length === 0) {
    return null;
  }

  // Get first function's time series to determine bucket structure
  const firstFunctionData = apiData[0][1];
  const data: Record<string, any>[] = [];
  const xAxisKey = "time";

  // Track which index had first non-null data (for trimming)
  let hadDataAt = -1;

  // Build data points for each time bucket
  for (let i = 0; i < firstFunctionData.length; i++) {
    const dataPoint: Record<string, any> = {};
    const timestamp = firstFunctionData[i][0];
    dataPoint[xAxisKey] = format(
      new Date(timestamp.secs_since_epoch * 1000),
      "h:mm a",
    );

    // Add values for each function at this time point
    for (const [functionName, timeSeries] of apiData) {
      const { metric } = { metric: timeSeries[i][1] };

      // Track first non-null data point
      if (hadDataAt === -1 && metric !== null) {
        hadDataAt = i;
      }

      const key = identifierForMetricName(functionName);

      // Fill in null values with appropriate defaults based on metric type
      dataPoint[key] =
        typeof metric === "number"
          ? metric
          : hadDataAt > -1
            ? kind === "cacheHitPercentage"
              ? 100 // Cache hit defaults to 100% when no data
              : 0 // Failure rate defaults to 0% when no data
            : null;
    }

    data.push(dataPoint);
  }

  // Assign colors to functions
  const usedColors = new Set<string>();
  const lineKeys = functions.map((functionName) => {
    const key = identifierForMetricName(functionName);
    const color = getColorForFunction(functionName, usedColors);
    usedColors.add(color);

    return {
      key,
      name: formatFunctionNameForDisplay(functionName),
      color,
    };
  });

  return {
    // Trim data to start from first non-null point (or show at least 2 points)
    data: hadDataAt > -1 ? data.slice(hadDataAt === 59 ? 58 : hadDataAt) : data,
    xAxisKey,
    lineKeys,
  };
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
 * Calculate trend from multi-series chart data
 */
function calculateTrendFromMultiSeries(
  multiSeriesData: MultiSeriesChartData | null,
): string {
  if (!multiSeriesData || multiSeriesData.data.length < 2) return "";

  // Aggregate all series values at each time point
  const timeSeriesData: TimeSeriesDataPoint[] = multiSeriesData.data.map(
    (point, index) => {
      let total = 0;
      let count = 0;

      for (const lineKey of multiSeriesData.lineKeys) {
        const value = point[lineKey.key];
        if (typeof value === "number") {
          total += value;
          count++;
        }
      }

      return {
        time: index,
        value: count > 0 ? total / count : null,
      };
    },
  );

  return calculateTrend(timeSeriesData);
}

/**
 * Get the latest aggregated value from multi-series data
 */
function getLatestValueFromMultiSeries(
  multiSeriesData: MultiSeriesChartData | null,
): number {
  if (!multiSeriesData || multiSeriesData.data.length === 0) return 0;

  const lastPoint = multiSeriesData.data[multiSeriesData.data.length - 1];
  let total = 0;
  let count = 0;

  for (const lineKey of multiSeriesData.lineKeys) {
    const value = lastPoint[lineKey.key];
    if (typeof value === "number") {
      total += value;
      count++;
    }
  }

  return count > 0 ? total / count : 0;
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
 *
 * Network calls are optimized with three-layer control:
 * 1. Route awareness - Only fetches when on /health route
 * 2. Idle detection - Pauses after 1 minute of user inactivity
 * 3. Visibility - Pauses when browser tab is hidden
 *
 * Refresh intervals are aligned with the official Convex dashboard:
 * - Failure rate, Cache hit rate: 2.5s (real-time top-K metrics)
 * - Scheduler lag: 60s (minute-level granularity)
 * - Latency, Request rate: 30s (computed from stream data)
 */
export function useHealthMetrics(): HealthMetrics {
  const { deploymentUrl, authToken } = useDeployment();
  const queryClient = useQueryClient();

  // Per-metric fetching control with different intervals matching official dashboard
  // Top-K metrics (failure rate, cache hit rate) - 2.5s
  const { enabled: topKEnabled, refetchInterval: topKRefetchInterval } =
    useCombinedFetchingControl("/health", REFETCH_INTERVAL.healthTopK);

  // Scheduler lag - 60s (official dashboard uses 60s)
  const {
    enabled: schedulerEnabled,
    refetchInterval: schedulerRefetchInterval,
  } = useCombinedFetchingControl("/health", REFETCH_INTERVAL.schedulerLag);

  // Other metrics (latency, request rate) - 30s
  const { enabled: otherEnabled, refetchInterval: otherRefetchInterval } =
    useCombinedFetchingControl("/health", REFETCH_INTERVAL.health);

  // Only enable queries when we have credentials AND fetching is allowed
  const enabledTopK = Boolean(deploymentUrl && authToken) && topKEnabled;
  const enabledScheduler =
    Boolean(deploymentUrl && authToken) && schedulerEnabled;
  const enabledOther = Boolean(deploymentUrl && authToken) && otherEnabled;

  // Shared UDF execution stats — reuse for latency and request rate
  // to avoid 3x redundant API calls to /api/stream_udf_execution (Bug 5 fix)
  const { entries: udfEntries } = useUdfExecutionStats();

  // Failure rate query — top-K metric, 2.5s refresh
  const failureRateQuery = useQuery({
    queryKey: healthMetricsKeys.failureRate(deploymentUrl ?? ""),
    queryFn: async () => {
      const data = await fetchFailureRate(
        deploymentUrl!,
        authToken!,
        desktopFetch,
      );
      return transformMultiSeriesData(data, "failurePercentage");
    },
    enabled: enabledTopK,
    staleTime: STALE_TIME.health,
    refetchInterval: topKRefetchInterval,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Cache hit rate query — top-K metric, 2.5s refresh
  const cacheHitRateQuery = useQuery({
    queryKey: healthMetricsKeys.cacheHitRate(deploymentUrl ?? ""),
    queryFn: async () => {
      const data = await fetchCacheHitRate(
        deploymentUrl!,
        authToken!,
        desktopFetch,
      );
      return transformMultiSeriesData(data, "cacheHitPercentage");
    },
    enabled: enabledTopK,
    staleTime: STALE_TIME.health,
    refetchInterval: topKRefetchInterval,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Scheduler lag query — 60s refresh (official dashboard uses 60s)
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
    enabled: enabledScheduler,
    staleTime: STALE_TIME.health,
    refetchInterval: schedulerRefetchInterval,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Latency percentiles query — uses shared UDF entries to avoid duplicate fetch
  // 30s refresh (computed from stream data, not direct API)
  const latencyQuery = useQuery({
    queryKey: healthMetricsKeys.latency(deploymentUrl ?? ""),
    queryFn: async () => {
      const data = await fetchLatencyPercentiles(
        deploymentUrl!,
        authToken!,
        desktopFetch,
        udfEntries.length > 0 ? udfEntries : undefined,
      );
      // Data format: [[50, [[timestamp, value]]], [95, [...]], [99, [...]]]
      const percentiles: LatencyPercentiles = { p50: 0, p95: 0, p99: 0 };

      if (!data || data.length === 0) {
        return percentiles;
      }

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
    enabled: enabledOther,
    staleTime: STALE_TIME.health,
    refetchInterval: otherRefetchInterval,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry timeouts — the underlying stream endpoint is just slow
      if (error instanceof Error && error.name === "TimeoutError") {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Request rate query — uses shared UDF entries to avoid duplicate fetch
  // 30s refresh (computed from stream data, not direct API)
  const requestRateQuery = useQuery({
    queryKey: healthMetricsKeys.requestRate(deploymentUrl ?? ""),
    queryFn: async () => {
      const data = await fetchUdfRate(
        deploymentUrl!,
        authToken!,
        desktopFetch,
        udfEntries.length > 0 ? udfEntries : undefined,
      );
      return transformTimeSeries(data);
    },
    enabled: enabledOther,
    staleTime: STALE_TIME.health,
    refetchInterval: otherRefetchInterval,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.name === "TimeoutError") {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Compute derived values
  const failureRateData = failureRateQuery.data ?? null;
  const failureRate = getLatestValueFromMultiSeries(failureRateData);
  const failureRateTrend = useMemo(
    () => calculateTrendFromMultiSeries(failureRateData),
    [failureRateData],
  );

  const cacheHitRateData = cacheHitRateQuery.data ?? null;
  const cacheHitRate = getLatestValueFromMultiSeries(cacheHitRateData);
  const cacheHitRateTrend = useMemo(
    () => calculateTrendFromMultiSeries(cacheHitRateData),
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
