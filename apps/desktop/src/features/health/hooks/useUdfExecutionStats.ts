import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchUdfExecutionStats,
  type FetchFn,
  type FunctionExecutionStats,
} from "@convex-panel/shared/api";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { useDeployment } from "@/contexts/DeploymentContext";
import { STALE_TIME, REFETCH_INTERVAL } from "@/contexts/QueryContext";

// Use Tauri's fetch for CORS-free HTTP requests
const desktopFetch: FetchFn = (input, init) => tauriFetch(input, init);

// Query key factory for shared execution stats
export const udfExecutionStatsKeys = {
  all: ["udfExecutionStats"] as const,
  stats: (deploymentUrl: string, cursor: number) =>
    [...udfExecutionStatsKeys.all, "stats", deploymentUrl, cursor] as const,
};

/**
 * Shared hook for fetching UDF execution stats.
 * This is used by both useFunctionHealth and useFunctionActivity to avoid duplicate fetches.
 * 
 * The cursor should be in milliseconds timestamp. Defaults to 1 hour ago rounded down to the nearest second.
 */
export function useUdfExecutionStats(cursor?: number) {
  const { deploymentUrl, authToken } = useDeployment();
  const queryClient = useQueryClient();

  const enabled = Boolean(deploymentUrl && authToken);
  
  // Calculate cursor if not provided (default to 1 hour ago, rounded down to nearest second)
  // This matches the original useFunctionHealth calculation
  const computedCursor = cursor ?? (() => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    return Math.floor(oneHourAgo / 1000) * 1000;
  })();

  const query = useQuery<FunctionExecutionStats[]>({
    queryKey: udfExecutionStatsKeys.stats(deploymentUrl ?? "", computedCursor),
    queryFn: async () => {
      const response = await fetchUdfExecutionStats(
        deploymentUrl!,
        authToken!,
        computedCursor,
        desktopFetch,
      );
      return response?.entries || [];
    },
    enabled,
    staleTime: STALE_TIME.functionStats,
    refetchInterval: REFETCH_INTERVAL.functionStats,
    refetchOnMount: false,
    // Add placeholder data to prevent blocking renders - show previous data if available, otherwise empty array
    placeholderData: (previousData) => previousData ?? [],
  });

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: udfExecutionStatsKeys.stats(deploymentUrl ?? "", computedCursor),
    });
  }, [queryClient, deploymentUrl, computedCursor]);

  return {
    entries: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    refetch,
  };
}
