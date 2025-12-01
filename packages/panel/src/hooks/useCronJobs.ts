import { useState, useEffect, useMemo } from "react";
import { ConvexReactClient } from "convex/react";
import { Module, CronJobWithRuns, CronJobLog, CronSpec } from "../lib/common-types";

export function useCronJobs(adminClient: ConvexReactClient, udfPath: string |null) {
  const [cronJobs, setCronJobs] = useState<CronJobWithRuns[] | undefined>(undefined);
  const [cronJobRuns, setCronJobRuns] = useState<CronJobLog[] | undefined>(undefined);
  const [modules, setModules] = useState<Map<string, Module> | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      if (!adminClient) return;

      try {
        setLoading(true);
        const [fetchedCronJobs, fetchedCronJobRuns, fetchedModules] = await Promise.all([
          adminClient.query("_system/frontend/listCronJobs:default" as any, { componentId: udfPath}),
          adminClient.query("_system/frontend/listCronJobRuns:default" as any, { componentId: udfPath }),
          adminClient.query("_system/frontend/modules:default" as any, { componentId: udfPath }).catch(() => new Map()), // Fallback if modules not found
        ]);
        if (!cancelled) {
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
        }
      } catch (error) {
        console.error("Failed to fetch cron jobs:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [adminClient]);

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