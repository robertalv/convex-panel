import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchTeamUsageSummary,
  type UsageSummary,
} from "@convex-panel/shared/api";
import { desktopFetch } from "@/utils/desktop";
import { useDeployment } from "@/contexts/deployment-context";
import { STALE_TIME, REFETCH_INTERVAL } from "@/contexts/query-context";
import { useCombinedFetchingControl } from "@/hooks/useCombinedFetchingControl";

export const teamUsageKeys = {
  all: ["teamUsage"] as const,
  summary: (teamId: number, projectId: number | null) =>
    [...teamUsageKeys.all, "summary", teamId, projectId] as const,
};

interface TeamUsageResult {
  data: UsageSummary | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook for fetching project usage summary from BigBrain API.
 * This provides billing-period usage data scoped to the current project.
 *
 * Network calls are optimized with three-layer control:
 * 1. Route awareness - Only fetches when on /health route
 * 2. Idle detection - Pauses after 1 minute of user inactivity
 * 3. Visibility - Pauses when browser tab is hidden
 */
export function useTeamUsageSummary(): TeamUsageResult {
  const { teamId, accessToken, deployment } = useDeployment();
  const projectId = deployment?.projectId ?? null;
  const queryClient = useQueryClient();

  // Combined fetching control: route + idle + visibility awareness
  const { enabled: fetchingEnabled, refetchInterval } =
    useCombinedFetchingControl("/health", REFETCH_INTERVAL.health);

  const enabled = Boolean(teamId && accessToken) && fetchingEnabled;

  const query = useQuery<UsageSummary | null>({
    queryKey: teamUsageKeys.summary(teamId ?? 0, projectId),
    queryFn: async () => {
      if (!teamId || !accessToken) return null;

      return fetchTeamUsageSummary(
        accessToken,
        teamId,
        { projectId },
        desktopFetch,
      );
    },
    enabled,
    staleTime: STALE_TIME.health,
    refetchInterval,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const refetch = useCallback(() => {
    if (teamId) {
      queryClient.invalidateQueries({
        queryKey: teamUsageKeys.summary(teamId, projectId),
      });
    }
  }, [queryClient, teamId, projectId]);

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    refetch,
  };
}
