/**
 * useScheduledJobs
 * Hook for fetching paginated scheduled jobs using React Query
 */

import { useQuery } from "@tanstack/react-query";
import { fetchScheduledJobs } from "@convex-panel/shared/api";
import { useDeployment } from "@/contexts/DeploymentContext";

export const SCHEDULED_JOBS_PAGE_SIZE = 50;

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

  const enabled = Boolean(
    deploymentUrl && authToken && adminClient && enabledOption,
  );

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
    refetchInterval: 2000, // 2s polling for real-time updates
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
