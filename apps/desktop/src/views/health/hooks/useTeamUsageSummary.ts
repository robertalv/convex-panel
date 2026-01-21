import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchTeamUsageSummary,
  type UsageSummary,
} from "@convex-panel/shared/api";
import { desktopFetch } from "@/utils/desktop";
import { useDeployment } from "@/contexts/deployment-context";
import { STALE_TIME, REFETCH_INTERVAL } from "@/contexts/query-context";
import { useVisibilityRefetch } from "@/hooks/useVisibilityRefetch";

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
 */
export function useTeamUsageSummary(): TeamUsageResult {
  const { teamId, accessToken, deployment } = useDeployment();
  const projectId = deployment?.projectId ?? null;
  const queryClient = useQueryClient();
  
  const refetchInterval = useVisibilityRefetch(REFETCH_INTERVAL.health);

  const enabled = Boolean(teamId && accessToken);

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
    placeholderData: (previousData) => previousData ?? null,
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
