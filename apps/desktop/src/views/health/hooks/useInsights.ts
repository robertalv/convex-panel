import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchInsights,
  type FetchFn,
  type Insight,
} from "@convex-panel/shared/api";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { useDeployment } from "@/contexts/deployment-context";
import { STALE_TIME } from "@/contexts/query-context";
import { useVisibilityRefetch } from "@/hooks/useVisibilityRefetch";

// Use Tauri's fetch for CORS-free HTTP requests
const desktopFetch: FetchFn = (input, init) => tauriFetch(input, init);

interface InsightsState {
  /** List of insights from BigBrain API */
  insights: Insight[];
  /** Whether data is loading */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Refetch data */
  refetch: () => void;
}

// Query key factory
export const insightsKeys = {
  all: ["insights"] as const,
  list: (deploymentUrl: string) =>
    [...insightsKeys.all, "list", deploymentUrl] as const,
};

/**
 * Hook for fetching insights from the Convex BigBrain API.
 * Uses React Query for caching.
 */
export function useInsights(): InsightsState {
  const { deploymentUrl, authToken } = useDeployment();
  const queryClient = useQueryClient();
  
  // Insights don't change frequently, so use a longer interval (5 minutes)
  // Only refetch when tab is visible
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
