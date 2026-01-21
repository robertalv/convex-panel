import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchInsights, type Insight } from "@convex-panel/shared/api";
import { desktopFetch } from "@/utils/desktop";
import { useDeployment } from "@/contexts/deployment-context";
import { STALE_TIME } from "@/contexts/query-context";
import { useCombinedFetchingControl } from "@/hooks/useCombinedFetchingControl";

interface InsightsState {
  insights: Insight[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const insightsKeys = {
  all: ["insights"] as const,
  list: (deploymentUrl: string) =>
    [...insightsKeys.all, "list", deploymentUrl] as const,
};

/**
 * Hook for fetching insights from the Convex BigBrain API.
 *
 * Network calls are optimized with three-layer control:
 * 1. Route awareness - Only fetches when on /health route
 * 2. Idle detection - Pauses after 1 minute of user inactivity
 * 3. Visibility - Pauses when browser tab is hidden
 */
export function useInsights(): InsightsState {
  const { deploymentUrl, authToken } = useDeployment();
  const queryClient = useQueryClient();

  // Combined fetching control with 5 minute interval for insights
  const { enabled: fetchingEnabled, refetchInterval } =
    useCombinedFetchingControl(
      "/health",
      5 * 60 * 1000, // 5 minutes - insights don't change frequently
    );

  const enabled = Boolean(deploymentUrl && authToken) && fetchingEnabled;

  const query = useQuery({
    queryKey: insightsKeys.list(deploymentUrl ?? ""),
    queryFn: async () => {
      const result = await fetchInsights(
        deploymentUrl!,
        authToken!,
        desktopFetch,
      );
      return result;
    },
    enabled,
    staleTime: STALE_TIME.insights,
    refetchInterval,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData ?? [],
  });

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: insightsKeys.list(deploymentUrl ?? ""),
    });
  }, [queryClient, deploymentUrl]);

  return {
    insights: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    refetch,
  };
}
