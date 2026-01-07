import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchRecentErrors, type FetchFn } from "@convex-panel/shared/api";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { useDeployment } from "@/contexts/DeploymentContext";
import { STALE_TIME, REFETCH_INTERVAL } from "@/contexts/QueryContext";

// Use Tauri's fetch for CORS-free HTTP requests
const desktopFetch: FetchFn = (input, init) => tauriFetch(input, init);

export interface ErrorSummary {
  /** Error message */
  message: string;
  /** Number of occurrences */
  count: number;
}

interface RecentErrorsState {
  /** Total number of errors in the time window */
  errorCount: number;
  /** Top error messages by frequency */
  topErrors: ErrorSummary[];
  /** Whether data is loading */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Refetch data */
  refetch: () => void;
}

// Query key factory for consistent key management
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
