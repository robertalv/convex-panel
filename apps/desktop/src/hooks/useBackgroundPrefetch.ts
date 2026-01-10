import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useDeployment } from "@/contexts/DeploymentContext";
import { STALE_TIME } from "@/contexts/QueryContext";
import { healthMetricsKeys } from "@/features/health/hooks/useHealthMetrics";
import { udfExecutionStatsKeys } from "@/features/health/hooks/useUdfExecutionStats";
import { deploymentStatusKeys } from "@/features/health/hooks/useDeploymentStatus";
import { recentErrorsKeys } from "@/features/health/hooks/useRecentErrors";
import {
  fetchFailureRate,
  fetchCacheHitRate,
  fetchSchedulerLag,
  fetchLatencyPercentiles,
  fetchUdfRate,
  fetchUdfExecutionStats,
  fetchRecentErrors,
  callConvexQuery,
  SYSTEM_QUERIES,
  type FetchFn,
} from "@convex-panel/shared/api";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

const desktopFetch: FetchFn = (input, init) => tauriFetch(input, init);

const requestIdle =
  typeof window !== "undefined" && "requestIdleCallback" in window
    ? window.requestIdleCallback
    : (cb: () => void) => setTimeout(cb, 1) as unknown as number;

const cancelIdle =
  typeof window !== "undefined" && "cancelIdleCallback" in window
    ? window.cancelIdleCallback
    : (id: number) => clearTimeout(id);

interface UseBackgroundPrefetchOptions {
  delay?: number;
  enabled?: boolean;
}

export function useBackgroundPrefetch({
  delay = 1000,
  enabled = true,
}: UseBackgroundPrefetchOptions = {}) {
  const queryClient = useQueryClient();
  const { deploymentUrl, authToken } = useDeployment();
  const hasPrefetchedRef = useRef(false);
  const idleCallbackRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || hasPrefetchedRef.current || !deploymentUrl || !authToken) {
      return;
    }

    const timeoutId = setTimeout(() => {
      idleCallbackRef.current = requestIdle(() => {
        prefetchHealthData(queryClient, deploymentUrl, authToken);
        hasPrefetchedRef.current = true;
      });
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      if (idleCallbackRef.current !== null) {
        cancelIdle(idleCallbackRef.current);
      }
    };
  }, [queryClient, deploymentUrl, authToken, delay, enabled]);

  useEffect(() => {
    hasPrefetchedRef.current = false;
  }, [deploymentUrl]);
}

async function prefetchHealthData(
  queryClient: ReturnType<typeof useQueryClient>,
  deploymentUrl: string,
  authToken: string,
) {
  console.log("[BackgroundPrefetch] Starting background prefetch...");

  const prefetchPromises: Promise<void>[] = [];

  const transformTimeSeries = (
    data: Array<[string, Array<[{ secs_since_epoch: number }, number | null]>]>,
  ) => {
    if (!data || data.length === 0) return [];
    const allPoints: Array<{ time: number; value: number | null }> = [];
    for (const [, timeSeries] of data) {
      for (const [timestamp, value] of timeSeries) {
        allPoints.push({
          time: timestamp.secs_since_epoch,
          value: value,
        });
      }
    }
    allPoints.sort((a, b) => a.time - b.time);
    return allPoints;
  };

  prefetchPromises.push(
    queryClient.prefetchQuery({
      queryKey: healthMetricsKeys.failureRate(deploymentUrl),
      queryFn: async () => {
        const data = await fetchFailureRate(
          deploymentUrl,
          authToken,
          desktopFetch,
        );
        return transformTimeSeries(data);
      },
      staleTime: STALE_TIME.health,
    }),
  );

  prefetchPromises.push(
    queryClient.prefetchQuery({
      queryKey: healthMetricsKeys.cacheHitRate(deploymentUrl),
      queryFn: async () => {
        const data = await fetchCacheHitRate(
          deploymentUrl,
          authToken,
          desktopFetch,
        );
        return transformTimeSeries(data);
      },
      staleTime: STALE_TIME.health,
    }),
  );

  prefetchPromises.push(
    queryClient.prefetchQuery({
      queryKey: healthMetricsKeys.schedulerLag(deploymentUrl),
      queryFn: async () => {
        const data = await fetchSchedulerLag(
          deploymentUrl,
          authToken,
          desktopFetch,
        );
        return Array.isArray(data)
          ? data.map(
              ([timestamp, value]: [
                { secs_since_epoch: number },
                number | null,
              ]) => ({
                time: timestamp.secs_since_epoch,
                value,
              }),
            )
          : [];
      },
      staleTime: STALE_TIME.health,
    }),
  );

  prefetchPromises.push(
    queryClient.prefetchQuery({
      queryKey: healthMetricsKeys.latency(deploymentUrl),
      queryFn: async () => {
        const data = await fetchLatencyPercentiles(
          deploymentUrl,
          authToken,
          desktopFetch,
        );
        const percentiles = { p50: 0, p95: 0, p99: 0 };
        for (const [percentile, timeSeries] of data) {
          const latestValue =
            timeSeries.length > 0
              ? (timeSeries[timeSeries.length - 1][1] ?? 0)
              : 0;
          if (percentile === 50) percentiles.p50 = latestValue;
          else if (percentile === 95) percentiles.p95 = latestValue;
          else if (percentile === 99) percentiles.p99 = latestValue;
        }
        return percentiles;
      },
      staleTime: STALE_TIME.health,
    }),
  );

  prefetchPromises.push(
    queryClient.prefetchQuery({
      queryKey: healthMetricsKeys.requestRate(deploymentUrl),
      queryFn: async () => {
        const data = await fetchUdfRate(deploymentUrl, authToken, desktopFetch);
        return transformTimeSeries(data);
      },
      staleTime: STALE_TIME.health,
    }),
  );

  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const cursor = Math.floor(oneHourAgo / 1000) * 1000;
  prefetchPromises.push(
    queryClient.prefetchQuery({
      queryKey: udfExecutionStatsKeys.stats(deploymentUrl, cursor),
      queryFn: async () => {
        const response = await fetchUdfExecutionStats(
          deploymentUrl,
          authToken,
          cursor,
          desktopFetch,
        );
        return response?.entries || [];
      },
      staleTime: STALE_TIME.functionStats,
    }),
  );

  prefetchPromises.push(
    queryClient.prefetchQuery({
      queryKey: deploymentStatusKeys.state(deploymentUrl),
      queryFn: async () => {
        const result = (await callConvexQuery(
          deploymentUrl,
          authToken,
          SYSTEM_QUERIES.DEPLOYMENT_STATE,
          {},
          desktopFetch,
        )) as { state: "running" | "paused" } | null;
        return result?.state ?? "unknown";
      },
      staleTime: STALE_TIME.health,
    }),
  );

  prefetchPromises.push(
    queryClient.prefetchQuery({
      queryKey: deploymentStatusKeys.version(deploymentUrl),
      queryFn: async () => {
        const result = (await callConvexQuery(
          deploymentUrl,
          authToken,
          SYSTEM_QUERIES.GET_VERSION,
          {},
          desktopFetch,
        )) as string | null;
        return result || null;
      },
      staleTime: STALE_TIME.health,
    }),
  );

  prefetchPromises.push(
    queryClient.prefetchQuery({
      queryKey: deploymentStatusKeys.lastPush(deploymentUrl),
      queryFn: async () => {
        const result = (await callConvexQuery(
          deploymentUrl,
          authToken,
          SYSTEM_QUERIES.LAST_PUSH_EVENT,
          {},
          desktopFetch,
        )) as { _creationTime?: number } | null;
        if (result && result._creationTime) {
          return new Date(result._creationTime);
        }
        return null;
      },
      staleTime: STALE_TIME.health,
    }),
  );

  prefetchPromises.push(
    queryClient.prefetchQuery({
      queryKey: recentErrorsKeys.byHours(deploymentUrl, 1),
      queryFn: () =>
        fetchRecentErrors(deploymentUrl, authToken, 1, desktopFetch),
      staleTime: STALE_TIME.health,
    }),
  );

  try {
    await Promise.allSettled(prefetchPromises);
    console.log("[BackgroundPrefetch] Background prefetch completed");
  } catch (err) {
    console.warn("[BackgroundPrefetch] Some prefetch operations failed:", err);
  }
}

export default useBackgroundPrefetch;
