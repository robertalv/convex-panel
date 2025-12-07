import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { ConvexReactClient } from "convex/react";
import type {
  Module,
  CronJobWithRuns,
  CronJobLog,
  CronSpec,
} from "../lib/common-types";

const POLLING_INTERVAL = 2000;

export function useCronJobs(adminClient: ConvexReactClient, udfPath: string |null, isPausedUser: boolean = false) {
  const [cronJobs, setCronJobs] = useState<CronJobWithRuns[] | undefined>(undefined);
  const [cronJobRuns, setCronJobRuns] = useState<CronJobLog[] | undefined>(undefined);
  const [modules, setModules] = useState<Map<string, Module> | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isStreamingRef = useRef(false);
  const isInitialLoadRef = useRef(true);

  const fetchData = useCallback(async (isInitial = false) => {
    if (!adminClient || isPausedUser) {
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      // Only set loading to true on initial fetch, not on subsequent polling updates
      if (isInitial || isInitialLoadRef.current) {
        setLoading(true);
        isInitialLoadRef.current = false;
      }
      const [fetchedCronJobs, fetchedCronJobRuns, fetchedModules] = await Promise.all([
        adminClient.query("_system/frontend/listCronJobs:default" as any, { componentId: udfPath}),
        adminClient.query("_system/frontend/listCronJobRuns:default" as any, { componentId: udfPath }),
        adminClient.query("_system/frontend/modules:default" as any, { componentId: udfPath }).catch(() => new Map()), // Fallback if modules not found
      ]);
      
      if (signal.aborted) return;
      
      setCronJobs(fetchedCronJobs as CronJobWithRuns[]);
      setCronJobRuns(fetchedCronJobRuns as CronJobLog[]);

      // Handle modules which might be a Map or object
      let modulesMap: Map<string, Module> | undefined;
      if (fetchedModules) {
        if (fetchedModules instanceof Map) {
          modulesMap = fetchedModules;
        } else if (typeof fetchedModules === 'object') {
          modulesMap = new Map(Object.entries(fetchedModules));
        }
      }
      setModules(modulesMap);
      setLoading(false);
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        return;
      }
      console.error("Failed to fetch cron jobs:", error);
      setLoading(false);
    }
  }, [adminClient, udfPath, isPausedUser]);

  // Initial fetch and polling effect
  useEffect(() => {
    if (isPausedUser || !adminClient) {
      isStreamingRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      return;
    }

    isStreamingRef.current = true;
    isInitialLoadRef.current = true;

    fetchData(true);

    const intervalId = setInterval(() => {
      if (isStreamingRef.current && !isPausedUser) {
        fetchData(false);
      }
    }, POLLING_INTERVAL);

    return () => {
      clearInterval(intervalId);
      isStreamingRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData, isPausedUser, adminClient]);

  const [orderedCronJobs, cronsModule] = useMemo(() => {
    if (!cronJobs || !modules || !cronJobRuns) return [undefined, undefined];

    let cronsModuleInner: Module | undefined;
    let cronSpecs: Map<string, CronSpec> | undefined;

    for (const [name, mod] of modules.entries()) {
      if (mod.cronSpecs) {
        if (cronSpecs) {
          console.warn("Crons found on multiple modules");
        }
        if (name !== "crons.js") {
          console.warn(`Crons found on unexpected module: ${name}`);
          continue;
        }
        cronSpecs = new Map(mod.cronSpecs);
        cronsModuleInner = mod;
      }
    }

    if (!cronSpecs) return [undefined, cronsModuleInner];

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

    return [ordered, cronsModuleInner];
  }, [cronJobs, modules, cronJobRuns]);

  return {
    cronsModule,
    cronJobs: orderedCronJobs || cronJobs, // Fallback to unordered if mapping fails
    loading,
    cronJobRuns,
  };
}