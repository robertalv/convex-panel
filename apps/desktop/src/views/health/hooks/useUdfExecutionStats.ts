import { useCallback, useMemo } from "react";
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
  stats: (deploymentUrl: string) =>
    [...udfExecutionStatsKeys.all, "stats", deploymentUrl] as const,
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
 * The cursor is stabilized to prevent query key instability: it is computed once
 * as "1 hour ago" rounded down to the nearest minute, so the key only changes
 * once per minute rather than every second.
 */
export function useUdfExecutionStats(cursor?: number) {
  const { deploymentUrl, authToken } = useDeployment();
  const queryClient = useQueryClient();

  // Combined fetching control: route + idle + visibility awareness
  const { enabled: fetchingEnabled, refetchInterval } =
    useCombinedFetchingControl("/health", REFETCH_INTERVAL.functionStats);

  const enabled = Boolean(deploymentUrl && authToken) && fetchingEnabled;

  // Stabilize the cursor: round down to the nearest minute so the query key
  // doesn't change every second (Bug 4 fix). The actual cursor value used in
  // the API call is fine-grained, but the query key uses this stable version.
  const stableCursor = useMemo(() => {
    if (cursor !== undefined) return cursor;
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    // Round to nearest minute (60000ms) for stable query key
    return Math.floor(oneHourAgo / 60000) * 60000;
  }, [cursor]);

  const query = useQuery<FunctionExecutionStats[]>({
    queryKey: udfExecutionStatsKeys.stats(deploymentUrl ?? ""),
    queryFn: async () => {
      const response = await fetchUdfExecutionStats(
        deploymentUrl!,
        authToken!,
        stableCursor,
        desktopFetch,
      );
      return response?.entries || [];
    },
    enabled,
    staleTime: STALE_TIME.functionStats,
    refetchInterval,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry timeouts — the endpoint is just slow/idle
      if (error instanceof Error && error.name === "TimeoutError") {
        return false;
      }
      return failureCount < 2;
    },
  });

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: udfExecutionStatsKeys.stats(deploymentUrl ?? ""),
    });
  }, [queryClient, deploymentUrl]);

  return {
    entries: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error?.message ?? null,
    isError: query.isError,
    refetch,
  };
}
