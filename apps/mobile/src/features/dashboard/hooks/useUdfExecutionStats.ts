import { useQuery } from "@tanstack/react-query";
import {
  fetchUdfExecutionStats,
  type FunctionExecutionStats,
} from "../../../api";
import { useDeployment } from "../../../contexts/DeploymentContext";
import { useAuth } from "../../../contexts/AuthContext";
import { STALE_TIME, REFETCH_INTERVAL } from "../../../contexts/QueryContext";
import { mobileFetch } from "../../../utils/fetch";

export interface UdfExecutionStatsResponse {
  entries: FunctionExecutionStats[];
  new_cursor: number;
}

// Query key factory
export const udfExecutionStatsKeys = {
  all: ["udfExecutionStats"] as const,
  data: (deploymentUrl: string, cursor: number) =>
    [...udfExecutionStatsKeys.all, "data", deploymentUrl, cursor] as const,
};

/**
 * Shared hook for fetching UDF execution stats.
 * This is used by multiple dashboard components to avoid duplicate API calls.
 *
 * React Query will automatically deduplicate calls with the same query key,
 * so all hooks using this will share the same data fetch.
 */
export function useUdfExecutionStats() {
  const { deployment } = useDeployment();
  const { session } = useAuth();

  const deploymentUrl = deployment?.url ?? null;
  const authToken = session?.accessToken ?? null;
  const enabled = Boolean(deploymentUrl && authToken);

  // Fetch from last hour
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const cursor = Math.floor(oneHourAgo / 1000) * 1000;

  const query = useQuery({
    queryKey: udfExecutionStatsKeys.data(deploymentUrl ?? "", cursor),
    queryFn: async () => {
      const response = await fetchUdfExecutionStats(
        deploymentUrl!,
        authToken!,
        cursor,
        mobileFetch,
      );
      return response;
    },
    enabled,
    staleTime: STALE_TIME.functionStats,
    refetchInterval: REFETCH_INTERVAL.functionStats,
    refetchOnMount: false,
  });

  return {
    data: query.data,
    entries: query.data?.entries ?? [],
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
}
