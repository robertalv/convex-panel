/**
 * useCronJobs
 * Hook for fetching cron jobs, cron job runs, and modules using React Query
 *
 * Network calls are optimized with three-layer control:
 * 1. Route awareness - Only fetches when on /schedules route
 * 2. Idle detection - Pauses after 1 minute of user inactivity
 * 3. Visibility - Pauses when browser tab is hidden
 */

import { useQuery } from "@tanstack/react-query";
import {
  fetchCronJobs,
  fetchCronJobRuns,
  fetchModules,
} from "@convex-panel/shared/api";
import type {
  CronJobWithRuns,
  CronJobLog,
  CronSpec,
} from "@convex-panel/shared";
import { useDeployment } from "@/contexts/deployment-context";
import { useMemo } from "react";
import { useCombinedFetchingControl } from "@/hooks/useCombinedFetchingControl";

// Query key factory
export const cronJobsKeys = {
  all: ["cronJobs"] as const,
  jobs: (deploymentUrl: string, componentId?: string | null) =>
    [...cronJobsKeys.all, "jobs", deploymentUrl, componentId] as const,
  runs: (deploymentUrl: string, componentId?: string | null) =>
    [...cronJobsKeys.all, "runs", deploymentUrl, componentId] as const,
  modules: (deploymentUrl: string, componentId?: string | null) =>
    [...cronJobsKeys.all, "modules", deploymentUrl, componentId] as const,
};

// Polling interval for cron jobs (2s)
const CRON_JOBS_REFETCH_INTERVAL = 2000;

interface UseCronJobsOptions {
  componentId?: string | null;
  enabled?: boolean;
}

type Module = {
  functions: any[];
  cronSpecs?: [string, CronSpec][];
  sourcePackageId: string;
};

export function useCronJobs(options: UseCronJobsOptions = {}) {
  const { deploymentUrl, authToken, adminClient } = useDeployment();
  const { componentId, enabled: enabledOption = true } = options;

  // Combined fetching control: route + idle + visibility awareness
  const { enabled: fetchingEnabled, refetchInterval } =
    useCombinedFetchingControl("/schedules", CRON_JOBS_REFETCH_INTERVAL);

  const enabled =
    Boolean(deploymentUrl && authToken && adminClient && enabledOption) &&
    fetchingEnabled;

  // Fetch cron jobs
  const cronJobsQuery = useQuery({
    queryKey: cronJobsKeys.jobs(deploymentUrl ?? "", componentId),
    queryFn: async () => {
      return await fetchCronJobs(adminClient!, componentId);
    },
    enabled,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval, // Uses visibility-aware interval
    refetchOnMount: false,
    placeholderData: (previousData: any) => previousData,
  });

  // Fetch cron job runs
  const cronJobRunsQuery = useQuery({
    queryKey: cronJobsKeys.runs(deploymentUrl ?? "", componentId),
    queryFn: async () => {
      return await fetchCronJobRuns(adminClient!, componentId);
    },
    enabled,
    staleTime: 30 * 1000,
    refetchInterval, // Uses visibility-aware interval
    refetchOnMount: false,
    placeholderData: (previousData: any) => previousData,
  });

  // Fetch modules (for cron specs)
  const modulesQuery = useQuery({
    queryKey: cronJobsKeys.modules(deploymentUrl ?? "", componentId),
    queryFn: async () => {
      return await fetchModules(adminClient!, componentId);
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes (modules rarely change)
    refetchInterval: false,
    refetchOnMount: false,
    placeholderData: (previousData: any) => previousData,
  });

  // Process and order cron jobs based on cronSpecs order
  const processedData = useMemo(() => {
    const cronJobs = cronJobsQuery.data as CronJobWithRuns[] | undefined;
    const cronJobRuns = cronJobRunsQuery.data as CronJobLog[] | undefined;
    const modules = modulesQuery.data;

    if (!cronJobs || !modules || !cronJobRuns) {
      return {
        orderedCronJobs: cronJobs,
        cronsModule: undefined,
        cronsModulePath: undefined,
      };
    }

    let cronSpecs: Map<string, CronSpec> | undefined;
    let cronsModule: Module | undefined;
    let cronsModulePath: string | undefined;

    for (const [name, mod] of modules.entries()) {
      const typedMod = mod as Module;
      if (typedMod.cronSpecs) {
        if (cronSpecs) {
          console.warn("Crons found on multiple modules");
        }
        if (name !== "crons.js" && name !== "crons.ts") {
          console.warn(`Crons found on unexpected module: ${name}`);
          continue;
        }
        cronSpecs = new Map(typedMod.cronSpecs);
        cronsModule = typedMod;
        cronsModulePath = name;
      }
    }

    if (!cronSpecs) {
      return {
        orderedCronJobs: cronJobs,
        cronsModule,
        cronsModulePath,
      };
    }

    const cronJobsMap = new Map<string, CronJobWithRuns>();
    for (const cronJob of cronJobs) {
      cronJobsMap.set(cronJob.name, cronJob);
    }

    const ordered = [...cronSpecs.keys()]
      .map((identifier) => {
        const cronJob = cronJobsMap.get(identifier);
        if (!cronJob) {
          console.warn(`No CronJob found for CronSpec ${identifier}`);
        }
        return cronJob;
      })
      .filter((x): x is CronJobWithRuns => x !== undefined);

    return {
      orderedCronJobs: ordered,
      cronsModule,
      cronsModulePath,
    };
  }, [cronJobsQuery.data, cronJobRunsQuery.data, modulesQuery.data]);

  const isLoading =
    cronJobsQuery.isLoading ||
    cronJobRunsQuery.isLoading ||
    modulesQuery.isLoading;

  const hasError = Boolean(
    cronJobsQuery.error || cronJobRunsQuery.error || modulesQuery.error,
  );

  return {
    cronJobs:
      processedData.orderedCronJobs ??
      (cronJobsQuery.data as CronJobWithRuns[]) ??
      [],
    cronJobRuns: (cronJobRunsQuery.data as CronJobLog[]) ?? [],
    cronsModule: processedData.cronsModule,
    cronsModulePath: processedData.cronsModulePath,
    isLoading,
    hasError,
    error:
      cronJobsQuery.error?.message ??
      cronJobRunsQuery.error?.message ??
      modulesQuery.error?.message ??
      null,
    refetch: () => {
      cronJobsQuery.refetch();
      cronJobRunsQuery.refetch();
      modulesQuery.refetch();
    },
  };
}
