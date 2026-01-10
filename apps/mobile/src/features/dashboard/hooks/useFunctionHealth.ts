import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchUdfExecutionStats } from "../../../api";
import { useDeployment } from "../../../contexts/DeploymentContext";
import { useAuth } from "../../../contexts/AuthContext";
import { STALE_TIME, REFETCH_INTERVAL } from "../../../contexts/QueryContext";
import { mobileFetch } from "../../../utils/fetch";

export interface FunctionStat {
  /** Function identifier (e.g., "messages:list") */
  name: string;
  /** Number of invocations */
  invocations: number;
  /** Number of errors */
  errors: number;
  /** Failure rate percentage */
  failureRate: number;
  /** Average execution time in ms */
  avgExecutionTime: number;
  /** p50 latency in ms */
  p50Latency: number;
  /** p95 latency in ms */
  p95Latency: number;
  /** p99 latency in ms */
  p99Latency: number;
  /** Function type (query, mutation, action) */
  type: string;
  /** Last error message (if any) */
  lastError?: string;
}

interface FunctionHealthData {
  /** Top functions by failure rate */
  topFailing: FunctionStat[];
  /** Top functions by execution time */
  slowest: FunctionStat[];
  /** Top functions by invocation count */
  mostCalled: FunctionStat[];
  /** Total function invocations in the time window */
  totalInvocations: number;
  /** Total errors in the time window */
  totalErrors: number;
  /** Overall failure rate */
  overallFailureRate: number;
}

interface FunctionHealth extends FunctionHealthData {
  // State
  isLoading: boolean;
  error: string | null;

  // Actions
  refetch: () => void;
}

// Query key factory
export const functionHealthKeys = {
  all: ["functionHealth"] as const,
  stats: (deploymentUrl: string) =>
    [...functionHealthKeys.all, "stats", deploymentUrl] as const,
};

/**
 * Helper to calculate percentile
 */
function getPercentile(arr: number[], pct: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.floor(sorted.length * pct);
  return sorted[Math.min(idx, sorted.length - 1)];
}

/**
 * Process raw execution stats into aggregated function health data
 */
function processExecutionStats(
  entries: Array<{
    identifier?: string;
    udf_type?: string;
    success?: boolean;
    error_message?: string;
    execution_time_ms?: number;
    timestamp?: number;
  }>,
): FunctionHealthData {
  if (!entries || entries.length === 0) {
    return {
      topFailing: [],
      slowest: [],
      mostCalled: [],
      totalInvocations: 0,
      totalErrors: 0,
      overallFailureRate: 0,
    };
  }

  // Aggregate stats by function
  const functionStats = new Map<
    string,
    {
      invocations: number;
      errors: number;
      executionTimes: number[];
      type: string;
      lastError?: string;
      lastErrorTime: number;
    }
  >();

  let totalInvCount = 0;
  let totalErrCount = 0;

  for (const entry of entries) {
    const identifier = entry.identifier || "unknown";
    const existing = functionStats.get(identifier) || {
      invocations: 0,
      errors: 0,
      executionTimes: [],
      type: entry.udf_type || "unknown",
      lastError: undefined,
      lastErrorTime: 0,
    };

    existing.invocations++;
    totalInvCount++;

    if (!entry.success) {
      existing.errors++;
      totalErrCount++;
      // Track last error message
      const entryTime = entry.timestamp || 0;
      if (entry.error_message && entryTime > existing.lastErrorTime) {
        existing.lastError = entry.error_message;
        existing.lastErrorTime = entryTime;
      }
    }

    if (entry.execution_time_ms && entry.execution_time_ms > 0) {
      existing.executionTimes.push(entry.execution_time_ms);
    }

    functionStats.set(identifier, existing);
  }

  // Convert to array and calculate derived metrics
  const stats: FunctionStat[] = Array.from(functionStats.entries()).map(
    ([name, data]) => {
      const avgTime =
        data.executionTimes.length > 0
          ? data.executionTimes.reduce((a, b) => a + b, 0) /
            data.executionTimes.length
          : 0;

      return {
        name,
        invocations: data.invocations,
        errors: data.errors,
        failureRate:
          data.invocations > 0 ? (data.errors / data.invocations) * 100 : 0,
        avgExecutionTime: Math.round(avgTime),
        p50Latency: Math.round(getPercentile(data.executionTimes, 0.5)),
        p95Latency: Math.round(getPercentile(data.executionTimes, 0.95)),
        p99Latency: Math.round(getPercentile(data.executionTimes, 0.99)),
        type: data.type,
        lastError: data.lastError,
      };
    },
  );

  // Sort and slice for different views
  const byFailureRate = [...stats]
    .filter((s) => s.errors > 0)
    .sort((a, b) => b.failureRate - a.failureRate)
    .slice(0, 5);

  const byExecutionTime = [...stats]
    .filter((s) => s.avgExecutionTime > 0)
    .sort((a, b) => b.avgExecutionTime - a.avgExecutionTime)
    .slice(0, 5);

  const byInvocations = [...stats]
    .sort((a, b) => b.invocations - a.invocations)
    .slice(0, 5);

  const overallFailureRate =
    totalInvCount > 0 ? (totalErrCount / totalInvCount) * 100 : 0;

  return {
    topFailing: byFailureRate,
    slowest: byExecutionTime,
    mostCalled: byInvocations,
    totalInvocations: totalInvCount,
    totalErrors: totalErrCount,
    overallFailureRate,
  };
}

/**
 * Hook for analyzing function health from UDF execution stats.
 * Uses React Query for caching and automatic refetching.
 */
export function useFunctionHealth(): FunctionHealth {
  const { deployment } = useDeployment();
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const deploymentUrl = deployment?.url ?? null;
  const authToken = session?.accessToken ?? null;
  const enabled = Boolean(deploymentUrl && authToken);

  const query = useQuery({
    queryKey: functionHealthKeys.stats(deploymentUrl ?? ""),
    queryFn: async () => {
      // Fetch execution stats from the last hour
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      const cursor = Math.floor(oneHourAgo / 1000) * 1000;

      const response = await fetchUdfExecutionStats(
        deploymentUrl!,
        authToken!,
        cursor,
        mobileFetch,
      );

      return processExecutionStats(response?.entries || []);
    },
    enabled,
    staleTime: STALE_TIME.functionStats,
    refetchInterval: REFETCH_INTERVAL.functionStats,
    refetchOnMount: false,
  });

  const data = query.data ?? {
    topFailing: [],
    slowest: [],
    mostCalled: [],
    totalInvocations: 0,
    totalErrors: 0,
    overallFailureRate: 0,
  };

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: functionHealthKeys.stats(deploymentUrl ?? ""),
    });
  }, [queryClient, deploymentUrl]);

  return {
    ...data,
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    refetch,
  };
}
