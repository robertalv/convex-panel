import { useState, useEffect, useCallback } from "react";
import { fetchUdfExecutionStats, type FetchFn } from "@convex-panel/shared/api";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { useDeployment } from "@/contexts/DeploymentContext";

// Use Tauri's fetch for CORS-free HTTP requests
const desktopFetch: FetchFn = (input, init) => tauriFetch(input, init);

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

interface FunctionHealth {
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

  // State
  isLoading: boolean;
  error: string | null;

  // Actions
  refetch: () => void;
}

/**
 * Hook for analyzing function health from UDF execution stats.
 * Uses real API data only - no mock data.
 */
export function useFunctionHealth(): FunctionHealth {
  const { deploymentUrl, authToken } = useDeployment();

  const [topFailing, setTopFailing] = useState<FunctionStat[]>([]);
  const [slowest, setSlowest] = useState<FunctionStat[]>([]);
  const [mostCalled, setMostCalled] = useState<FunctionStat[]>([]);
  const [totalInvocations, setTotalInvocations] = useState(0);
  const [totalErrors, setTotalErrors] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!deploymentUrl || !authToken) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch execution stats from the last hour
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      const cursor = Math.floor(oneHourAgo / 1000) * 1000;

      const response = await fetchUdfExecutionStats(
        deploymentUrl,
        authToken,
        cursor,
        desktopFetch,
      );

      if (!response || !response.entries || response.entries.length === 0) {
        setTopFailing([]);
        setSlowest([]);
        setMostCalled([]);
        setTotalInvocations(0);
        setTotalErrors(0);
        setIsLoading(false);
        return;
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

      for (const entry of response.entries) {
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

      // Helper to calculate percentile
      const getPercentile = (arr: number[], pct: number): number => {
        if (arr.length === 0) return 0;
        const sorted = [...arr].sort((a, b) => a - b);
        const idx = Math.floor(sorted.length * pct);
        return sorted[Math.min(idx, sorted.length - 1)];
      };

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

      setTopFailing(byFailureRate);
      setSlowest(byExecutionTime);
      setMostCalled(byInvocations);
      setTotalInvocations(totalInvCount);
      setTotalErrors(totalErrCount);
    } catch (err) {
      console.error("[FunctionHealth] Error fetching stats:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch function stats",
      );
    } finally {
      setIsLoading(false);
    }
  }, [deploymentUrl, authToken]);

  // Initial fetch
  useEffect(() => {
    refetch();
  }, [refetch]);

  const overallFailureRate =
    totalInvocations > 0 ? (totalErrors / totalInvocations) * 100 : 0;

  return {
    topFailing,
    slowest,
    mostCalled,
    totalInvocations,
    totalErrors,
    overallFailureRate,
    isLoading,
    error,
    refetch,
  };
}
