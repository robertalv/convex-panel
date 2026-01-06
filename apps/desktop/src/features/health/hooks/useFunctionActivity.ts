import { useState, useEffect, useCallback, useMemo } from "react";
import {
  fetchUdfExecutionStats,
  type FetchFn,
  type FunctionExecutionStats,
} from "@convex-panel/shared/api";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { useDeployment } from "@/contexts/DeploymentContext";

// Use Tauri's fetch for CORS-free HTTP requests
const desktopFetch: FetchFn = (input, init) => tauriFetch(input, init);

export interface FunctionActivityData {
  /** Timestamps for each bucket (in seconds) */
  timestamps: number[];
  /** Query invocations per bucket */
  queries: number[];
  /** Mutation invocations per bucket */
  mutations: number[];
  /** Action invocations per bucket */
  actions: number[];
  /** Scheduled function invocations per bucket */
  scheduled: number[];
  /** HTTP action invocations per bucket */
  httpActions: number[];
}

export interface FunctionActivitySeries {
  name: string;
  color: string;
  data: number[];
}

interface FunctionActivityState {
  /** Activity data bucketed by time */
  data: FunctionActivityData | null;
  /** Current rate (last bucket total) */
  currentRate: number;
  /** Total invocations in the time window */
  totalInvocations: number;
  /** Maximum value across all buckets (for chart scaling) */
  maxValue: number;
  /** Pre-built series for charting */
  series: FunctionActivitySeries[];
  /** Whether data is loading */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Refetch data */
  refetch: () => void;
}

/**
 * Normalize UDF type to a consistent format.
 */
function normalizeUdfType(udfType: string | undefined | null): string {
  if (!udfType) return "action";
  const type = udfType.toLowerCase();
  if (type === "query" || type === "q") return "query";
  if (type === "mutation" || type === "m") return "mutation";
  if (type === "action" || type === "a") return "action";
  if (type === "httpaction" || type === "http" || type === "h")
    return "httpAction";
  return type;
}

/**
 * Check if a function is scheduled (cron or scheduled).
 */
function isScheduledFunction(entry: FunctionExecutionStats): boolean {
  const identifier = entry.identifier?.toLowerCase() || "";
  return identifier.includes("cron") || identifier.includes("scheduled");
}

/**
 * Hook for fetching function activity data (invocations by type over time).
 * Uses real API data only - no mock data.
 */
export function useFunctionActivity(): FunctionActivityState {
  const { deploymentUrl, authToken } = useDeployment();

  const [data, setData] = useState<FunctionActivityData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const processEntries = useCallback(
    (entries: FunctionExecutionStats[]): FunctionActivityData => {
      const now = Math.floor(Date.now() / 1000);
      const oneHourAgo = now - 60 * 60;
      const numBuckets = 60; // 1 minute intervals
      const bucketSizeSeconds = 60;

      // Initialize arrays
      const timestamps: number[] = [];
      const queries: number[] = Array(numBuckets).fill(0);
      const mutations: number[] = Array(numBuckets).fill(0);
      const actions: number[] = Array(numBuckets).fill(0);
      const scheduled: number[] = Array(numBuckets).fill(0);
      const httpActions: number[] = Array(numBuckets).fill(0);

      // Generate timestamps
      for (let i = 0; i < numBuckets; i++) {
        timestamps.push(oneHourAgo + i * bucketSizeSeconds);
      }

      // Process each entry
      for (const entry of entries) {
        let entryTime = entry.timestamp;
        // Convert milliseconds to seconds if needed
        if (entryTime > 1e12) {
          entryTime = Math.floor(entryTime / 1000);
        }

        // Skip entries outside our time window
        if (entryTime < oneHourAgo || entryTime > now) {
          continue;
        }

        // Calculate bucket index
        const bucketIndex = Math.floor(
          (entryTime - oneHourAgo) / bucketSizeSeconds,
        );
        const clampedIndex = Math.max(0, Math.min(numBuckets - 1, bucketIndex));

        // Categorize by type
        const udfType = normalizeUdfType(entry.udf_type);

        // Check if it's a scheduled function first
        if (isScheduledFunction(entry)) {
          scheduled[clampedIndex]++;
        } else {
          switch (udfType) {
            case "query":
              queries[clampedIndex]++;
              break;
            case "mutation":
              mutations[clampedIndex]++;
              break;
            case "action":
              actions[clampedIndex]++;
              break;
            case "httpAction":
              httpActions[clampedIndex]++;
              break;
            default:
              actions[clampedIndex]++;
          }
        }
      }

      return {
        timestamps,
        queries,
        mutations,
        actions,
        scheduled,
        httpActions,
      };
    },
    [],
  );

  const refetch = useCallback(async () => {
    if (!deploymentUrl || !authToken) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      const cursor = Math.floor(oneHourAgo);

      const response = await fetchUdfExecutionStats(
        deploymentUrl,
        authToken,
        cursor,
        desktopFetch,
      );

      if (response && response.entries) {
        const activityData = processEntries(response.entries);
        setData(activityData);
      }
    } catch (err) {
      console.error("[FunctionActivity] Error fetching:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch function activity",
      );
    } finally {
      setIsLoading(false);
    }
  }, [deploymentUrl, authToken, processEntries]);

  // Initial fetch
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Compute derived values
  const series: FunctionActivitySeries[] = useMemo(() => {
    if (!data) return [];
    return [
      { name: "Queries", color: "#3B82F6", data: data.queries },
      { name: "Mutations", color: "#10B981", data: data.mutations },
      { name: "Actions", color: "#F59E0B", data: data.actions },
      { name: "Scheduled", color: "#EF4444", data: data.scheduled },
      { name: "HTTP", color: "#8B5CF6", data: data.httpActions },
    ];
  }, [data]);

  const currentRate = useMemo(() => {
    if (!data || data.timestamps.length === 0) return 0;
    const lastIdx = data.timestamps.length - 1;
    return (
      data.queries[lastIdx] +
      data.mutations[lastIdx] +
      data.actions[lastIdx] +
      data.scheduled[lastIdx] +
      data.httpActions[lastIdx]
    );
  }, [data]);

  const totalInvocations = useMemo(() => {
    if (!data) return 0;
    let total = 0;
    for (let i = 0; i < data.timestamps.length; i++) {
      total +=
        data.queries[i] +
        data.mutations[i] +
        data.actions[i] +
        data.scheduled[i] +
        data.httpActions[i];
    }
    return total;
  }, [data]);

  const maxValue = useMemo(() => {
    if (!data || data.timestamps.length === 0) return 100;
    let max = 0;
    for (let i = 0; i < data.timestamps.length; i++) {
      const total =
        data.queries[i] +
        data.mutations[i] +
        data.actions[i] +
        data.scheduled[i] +
        data.httpActions[i];
      if (total > max) max = total;
    }
    return Math.ceil(max * 1.1) || 100;
  }, [data]);

  return {
    data,
    currentRate,
    totalInvocations,
    maxValue,
    series,
    isLoading,
    error,
    refetch,
  };
}
