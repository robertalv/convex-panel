import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchUdfExecutionStats,
  type FunctionExecutionStats,
} from "@convex-panel/shared/api";
import { desktopFetch } from "@/utils/desktop";
import { useDeployment } from "@/contexts/deployment-context";
import { STALE_TIME, REFETCH_INTERVAL } from "@/contexts/query-context";
import { useCombinedFetchingControl } from "@/hooks/useCombinedFetchingControl";

export const udfExecutionStatsKeys = {
  all: ["udfExecutionStats"] as const,
  stats: (deploymentUrl: string, cursor: number) =>
    [...udfExecutionStatsKeys.all, "stats", deploymentUrl, cursor] as const,
};

/**
 * Shared hook for fetching UDF execution stats.
 * This is used by both useFunctionHealth and useFunctionActivity to avoid duplicate fetches.
 *
 * Network calls are optimized with three-layer control:
 * 1. Route awareness - Only fetches when on /health route
 * 2. Idle detection - Pauses after 1 minute of user inactivity
 * 3. Visibility - Pauses when browser tab is hidden
 *
 * The cursor should be in milliseconds timestamp. Defaults to 1 hour ago rounded down to the nearest second.
 */
export function useUdfExecutionStats(cursor?: number) {
  const { deploymentUrl, authToken } = useDeployment();
  const queryClient = useQueryClient();

  // Combined fetching control: route + idle + visibility awareness
  const { enabled: fetchingEnabled, refetchInterval } =
    useCombinedFetchingControl("/health", REFETCH_INTERVAL.functionStats);

  const enabled = Boolean(deploymentUrl && authToken) && fetchingEnabled;

  // Calculate cursor if not provided (default to 1 hour ago, rounded down to nearest second)
  // This matches the original useFunctionHealth calculation
  const computedCursor =
    cursor ??
    (() => {
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
    refetchInterval,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData ?? [],
  });

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: udfExecutionStatsKeys.stats(
        deploymentUrl ?? "",
        computedCursor,
      ),
    });
  }, [queryClient, deploymentUrl, computedCursor]);

  return {
    entries: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    refetch,
  };
}
