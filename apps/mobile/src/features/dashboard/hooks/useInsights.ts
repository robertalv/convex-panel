import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchInsights, type Insight } from "../../../api";
import { useDeployment } from "../../../contexts/DeploymentContext";
import { useAuth } from "../../../contexts/AuthContext";
import { STALE_TIME } from "../../../contexts/QueryContext";
import { mobileFetch } from "../../../utils/fetch";

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
  const { deployment } = useDeployment();
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const deploymentUrl = deployment?.url ?? null;
  const authToken = session?.accessToken ?? null;
  const enabled = Boolean(deploymentUrl && authToken);

  const query = useQuery({
    queryKey: insightsKeys.list(deploymentUrl ?? ""),
    queryFn: async () => {
      const result = await fetchInsights(
        deploymentUrl!,
        authToken!,
        mobileFetch,
      );
      return result;
    },
    enabled,
    staleTime: STALE_TIME.insights,
    refetchOnMount: false,
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
