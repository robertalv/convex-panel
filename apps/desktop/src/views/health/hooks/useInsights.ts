import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchInsights,
  type Insight,
} from "@convex-panel/shared/api";
import { desktopFetch } from "@/utils/desktop";
import { useDeployment } from "@/contexts/deployment-context";
import { STALE_TIME } from "@/contexts/query-context";
import { useVisibilityRefetch } from "@/hooks/useVisibilityRefetch";

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
 */
export function useInsights(): InsightsState {
  const { deploymentUrl, authToken } = useDeployment();
  const queryClient = useQueryClient();
  
  const refetchInterval = useVisibilityRefetch(5 * 60 * 1000);

  const enabled = Boolean(deploymentUrl && authToken);

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
