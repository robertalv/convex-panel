import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchRecentErrors } from "@convex-panel/shared/api";
import { desktopFetch } from "@/utils/desktop";
import { useDeployment } from "@/contexts/deployment-context";
import { STALE_TIME, REFETCH_INTERVAL } from "@/contexts/query-context";

export interface ErrorSummary {
  message: string;
  count: number;
}

interface RecentErrorsState {
  errorCount: number;
  topErrors: ErrorSummary[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const recentErrorsKeys = {
  all: ["recentErrors"] as const,
  byHours: (deploymentUrl: string, hoursBack: number) =>
    [...recentErrorsKeys.all, deploymentUrl, hoursBack] as const,
};

/**
 * Hook for fetching recent errors from the deployment.
 * Uses React Query for caching and automatic refetching.
 */
export function useRecentErrors(hoursBack: number = 1): RecentErrorsState {
  const { deploymentUrl, authToken } = useDeployment();
  const queryClient = useQueryClient();

  const enabled = Boolean(deploymentUrl && authToken);

  const query = useQuery({
    queryKey: recentErrorsKeys.byHours(deploymentUrl ?? "", hoursBack),
    queryFn: async () => {
      const result = await fetchRecentErrors(
        deploymentUrl!,
        authToken!,
        hoursBack,
        desktopFetch,
      );
      return {
        errorCount: result.count,
        topErrors: result.topErrors,
      };
    },
    enabled,
    staleTime: STALE_TIME.health,
    refetchInterval: REFETCH_INTERVAL.health,
    refetchOnMount: false,
  });

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: recentErrorsKeys.byHours(deploymentUrl ?? "", hoursBack),
    });
  }, [queryClient, deploymentUrl, hoursBack]);

  return {
    errorCount: query.data?.errorCount ?? 0,
    topErrors: query.data?.topErrors ?? [],
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    refetch,
  };
}
