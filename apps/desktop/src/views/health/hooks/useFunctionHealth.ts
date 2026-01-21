import { useMemo } from "react";
import { useUdfExecutionStats } from "./useUdfExecutionStats";

export interface FunctionStat {
  name: string;
  invocations: number;
  errors: number;
  failureRate: number;
  avgExecutionTime: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  type: string;
  lastError?: string;
}

interface FunctionHealthData {
  topFailing: FunctionStat[];
  slowest: FunctionStat[];
  mostCalled: FunctionStat[];
  totalInvocations: number;
  totalErrors: number;
  overallFailureRate: number;
}

interface FunctionHealth extends FunctionHealthData {
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

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
 * Uses shared UDF execution stats to avoid duplicate fetches.
 */
export function useFunctionHealth(): FunctionHealth {
  // Use shared hook - this will be cached and shared with useFunctionActivity
  const { entries, isLoading, error, refetch } = useUdfExecutionStats();

  // Process the entries into health data
  const data = useMemo(() => {
    return processExecutionStats(entries);
  }, [entries]);

  return {
    ...data,
    isLoading,
    error,
    refetch,
  };
}
