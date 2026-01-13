import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchTeamUsageSummary,
  type UsageSummary,
  type FetchFn,
} from "@convex-panel/shared/api";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { useDeployment } from "@/contexts/deployment-context";
import { STALE_TIME, REFETCH_INTERVAL } from "@/contexts/query-context";

// Use Tauri's fetch for CORS-free HTTP requests
const desktopFetch: FetchFn = (input, init) => tauriFetch(input, init);

// Query key factory
export const teamUsageKeys = {
  all: ["teamUsage"] as const,
  summary: (teamId: number) =>
    [...teamUsageKeys.all, "summary", teamId] as const,
};

interface TeamUsageResult {
  data: UsageSummary | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook for fetching team usage summary from BigBrain API.
 * This provides billing-period usage data at the team level.
 */
export function useTeamUsageSummary(): TeamUsageResult {
  const { teamId, accessToken } = useDeployment();
  const queryClient = useQueryClient();

  const enabled = Boolean(teamId && accessToken);

  const query = useQuery<UsageSummary | null>({
    queryKey: teamUsageKeys.summary(teamId ?? 0),
    queryFn: async () => {
      if (!teamId || !accessToken) return null;

      return fetchTeamUsageSummary(
        accessToken,
        teamId,
        undefined,
        desktopFetch,
      );
    },
    enabled,
    staleTime: STALE_TIME.health,
    refetchInterval: REFETCH_INTERVAL.health,
    refetchOnMount: false,
    placeholderData: (previousData) => previousData ?? null,
  });

  const refetch = useCallback(() => {
    if (teamId) {
      queryClient.invalidateQueries({
        queryKey: teamUsageKeys.summary(teamId),
      });
    }
  }, [queryClient, teamId]);

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    refetch,
  };
}
