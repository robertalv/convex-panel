/**
 * useScheduledJobs
 * Hook for fetching paginated scheduled jobs using React Query
 *
 * Network calls are optimized with three-layer control:
 * 1. Route awareness - Only fetches when on /schedules route
 * 2. Idle detection - Pauses after 1 minute of user inactivity
 * 3. Visibility - Pauses when browser tab is hidden
 */

import { useQuery } from "@tanstack/react-query";
import { fetchScheduledJobs } from "@convex-panel/shared/api";
import { useDeployment } from "@/contexts/deployment-context";
import { useCombinedFetchingControl } from "@/hooks/useCombinedFetchingControl";

export const SCHEDULED_JOBS_PAGE_SIZE = 50;

// Polling interval for scheduled jobs (2s)
const SCHEDULED_JOBS_REFETCH_INTERVAL = 2000;

// Query key factory
export const scheduledJobsKeys = {
  all: ["scheduledJobs"] as const,
  list: (
    deploymentUrl: string,
    udfPath?: string,
    componentId?: string | null,
  ) =>
    [
      ...scheduledJobsKeys.all,
      "list",
      deploymentUrl,
      udfPath,
      componentId,
    ] as const,
};

interface UseScheduledJobsOptions {
  udfPath?: string;
  componentId?: string | null;
  enabled?: boolean;
}

export function useScheduledJobs(options: UseScheduledJobsOptions = {}) {
  const { deploymentUrl, authToken, adminClient } = useDeployment();
  const { udfPath, componentId, enabled: enabledOption = true } = options;

  // Combined fetching control: route + idle + visibility awareness
  const { enabled: fetchingEnabled, refetchInterval } =
    useCombinedFetchingControl("/schedules", SCHEDULED_JOBS_REFETCH_INTERVAL);

  const enabled =
    Boolean(deploymentUrl && authToken && adminClient && enabledOption) &&
    fetchingEnabled;

  const query = useQuery({
    queryKey: scheduledJobsKeys.list(deploymentUrl ?? "", udfPath, componentId),
    queryFn: async () => {
      return await fetchScheduledJobs(
        adminClient!,
        {
          numItems: SCHEDULED_JOBS_PAGE_SIZE,
          cursor: null,
          udfPath,
        },
        componentId,
      );
    },
    enabled,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval, // Uses visibility-aware interval
    refetchOnMount: false,
    placeholderData: (previousData) => previousData,
  });

  return {
    jobs: query.data?.page ?? [],
    continueCursor: query.data?.continueCursor ?? null,
    isDone: query.data?.isDone ?? false,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
}
