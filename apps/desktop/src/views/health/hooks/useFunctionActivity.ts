import { useMemo } from "react";
import { FUNCTION_ACTIVITY_COLORS } from "@/utils/colors";
import { type FunctionExecutionStats } from "@convex-panel/shared/api";
import { useUdfExecutionStats } from "./useUdfExecutionStats";
import { isScheduledFunction, normalizeUdfType } from "@/utils/udfs";

export interface FunctionActivityData {
  timestamps: number[];
  queries: number[];
  mutations: number[];
  actions: number[];
  scheduled: number[];
  httpActions: number[];
}

export interface FunctionActivitySeries {
  name: string;
  color: string;
  data: number[];
}

interface FunctionActivityState {
  data: FunctionActivityData | null;
  currentRate: number;
  totalInvocations: number;
  maxValue: number;
  series: FunctionActivitySeries[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Process entries into activity data
 */
function processEntries(
  entries: FunctionExecutionStats[],
): FunctionActivityData {
  const now = Math.floor(Date.now() / 1000);
  const oneHourAgo = now - 60 * 60;
  const numBuckets = 60; 
  const bucketSizeSeconds = 60;

  const timestamps: number[] = [];
  const queries: number[] = Array(numBuckets).fill(0);
  const mutations: number[] = Array(numBuckets).fill(0);
  const actions: number[] = Array(numBuckets).fill(0);
  const scheduled: number[] = Array(numBuckets).fill(0);
  const httpActions: number[] = Array(numBuckets).fill(0);

  for (let i = 0; i < numBuckets; i++) {
    timestamps.push(oneHourAgo + i * bucketSizeSeconds);
  }

  for (const entry of entries) {
    let entryTime = entry.timestamp;
    if (entryTime > 1e12) {
      entryTime = Math.floor(entryTime / 1000);
    }

    if (entryTime < oneHourAgo || entryTime > now) {
      continue;
    }

    const bucketIndex = Math.floor(
      (entryTime - oneHourAgo) / bucketSizeSeconds,
    );
    const clampedIndex = Math.max(0, Math.min(numBuckets - 1, bucketIndex));
    
    const udfType = normalizeUdfType(entry.udf_type);

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
}

/**
 * Hook for fetching function activity data (invocations by type over time).
 * Uses shared UDF execution stats to avoid duplicate fetches.
 */
export function useFunctionActivity(): FunctionActivityState {
  const { entries, isLoading, error, refetch } = useUdfExecutionStats();

  const data = useMemo(() => {
    if (!entries || entries.length === 0) {
      return {
        timestamps: [],
        queries: [],
        mutations: [],
        actions: [],
        scheduled: [],
        httpActions: [],
      };
    }
    return processEntries(entries);
  }, [entries]);

  const series: FunctionActivitySeries[] = useMemo(() => {
    if (!data || !data.timestamps || data.timestamps.length === 0) return [];
    return [
      {
        name: "Queries",
        color: FUNCTION_ACTIVITY_COLORS.queries,
        data: data.queries ?? [],
      },
      {
        name: "Mutations",
        color: FUNCTION_ACTIVITY_COLORS.mutations,
        data: data.mutations ?? [],
      },
      {
        name: "Actions",
        color: FUNCTION_ACTIVITY_COLORS.actions,
        data: data.actions ?? [],
      },
      {
        name: "Scheduled",
        color: FUNCTION_ACTIVITY_COLORS.scheduled,
        data: data.scheduled ?? [],
      },
      {
        name: "HTTP",
        color: FUNCTION_ACTIVITY_COLORS.http,
        data: data.httpActions ?? [],
      },
    ];
  }, [data]);

  const currentRate = useMemo(() => {
    if (!data || !data.timestamps || data.timestamps.length === 0) return 0;
    const lastIdx = data.timestamps.length - 1;
    return (
      (data.queries?.[lastIdx] ?? 0) +
      (data.mutations?.[lastIdx] ?? 0) +
      (data.actions?.[lastIdx] ?? 0) +
      (data.scheduled?.[lastIdx] ?? 0) +
      (data.httpActions?.[lastIdx] ?? 0)
    );
  }, [data]);

  const totalInvocations = useMemo(() => {
    if (!data || !data.timestamps || data.timestamps.length === 0) return 0;
    let total = 0;
    for (let i = 0; i < data.timestamps.length; i++) {
      total +=
        (data.queries?.[i] ?? 0) +
        (data.mutations?.[i] ?? 0) +
        (data.actions?.[i] ?? 0) +
        (data.scheduled?.[i] ?? 0) +
        (data.httpActions?.[i] ?? 0);
    }
    return total;
  }, [data]);

  const maxValue = useMemo(() => {
    if (!data || !data.timestamps || data.timestamps.length === 0) return 100;
    let max = 0;
    for (let i = 0; i < data.timestamps.length; i++) {
      const total =
        (data.queries?.[i] ?? 0) +
        (data.mutations?.[i] ?? 0) +
        (data.actions?.[i] ?? 0) +
        (data.scheduled?.[i] ?? 0) +
        (data.httpActions?.[i] ?? 0);
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
