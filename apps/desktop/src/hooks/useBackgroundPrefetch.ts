/**
 * Background Prefetch Hook
 * Prefetches data in the background using requestIdleCallback.
 * Used to warm the cache after login for faster navigation.
 */

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useDeployment } from "@/contexts/DeploymentContext";
import { STALE_TIME } from "@/contexts/QueryContext";
import { healthMetricsKeys } from "@/features/health/hooks/useHealthMetrics";
import { functionHealthKeys } from "@/features/health/hooks/useFunctionHealth";
import { functionActivityKeys } from "@/features/health/hooks/useFunctionActivity";
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
} from "../utils/api";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

// Use Tauri's fetch for CORS-free HTTP requests
const desktopFetch: FetchFn = (input, init) => tauriFetch(input, init);

// Polyfill requestIdleCallback for older browsers
const requestIdle =
  typeof window !== "undefined" && "requestIdleCallback" in window
    ? window.requestIdleCallback
    : (cb: () => void) => setTimeout(cb, 1) as unknown as number;

const cancelIdle =
  typeof window !== "undefined" && "cancelIdleCallback" in window
    ? window.cancelIdleCallback
    : (id: number) => clearTimeout(id);

interface UseBackgroundPrefetchOptions {
  /** Delay before starting prefetch (ms). Defaults to 1000ms. */
  delay?: number;
  /** Whether to enable prefetching. Defaults to true. */
  enabled?: boolean;
}

/**
 * Hook that prefetches health and monitoring data in the background.
 * Uses requestIdleCallback to avoid impacting UI responsiveness.
 */
export function useBackgroundPrefetch({
  delay = 1000,
  enabled = true,
}: UseBackgroundPrefetchOptions = {}) {
  const queryClient = useQueryClient();
  const { deploymentUrl, authToken } = useDeployment();
  const hasPrefetchedRef = useRef(false);
  const idleCallbackRef = useRef<number | null>(null);

  useEffect(() => {
    // Don't prefetch if disabled, already prefetched, or missing credentials
    if (!enabled || hasPrefetchedRef.current || !deploymentUrl || !authToken) {
      return;
    }

    // Delay before starting prefetch to let the UI settle
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

  // Reset prefetch flag when deployment changes
  useEffect(() => {
    hasPrefetchedRef.current = false;
  }, [deploymentUrl]);
}

/**
 * Prefetch health monitoring data into the React Query cache.
 */
async function prefetchHealthData(
  queryClient: ReturnType<typeof useQueryClient>,
  deploymentUrl: string,
  authToken: string,
) {
  console.log("[BackgroundPrefetch] Starting background prefetch...");

  const prefetchPromises: Promise<void>[] = [];

  // Prefetch failure rate
  prefetchPromises.push(
    queryClient.prefetchQuery({
      queryKey: healthMetricsKeys.failureRate(deploymentUrl),
      queryFn: () => fetchFailureRate(deploymentUrl, authToken, desktopFetch),
      staleTime: STALE_TIME.health,
    }),
  );

  // Prefetch cache hit rate
  prefetchPromises.push(
    queryClient.prefetchQuery({
      queryKey: healthMetricsKeys.cacheHitRate(deploymentUrl),
      queryFn: () => fetchCacheHitRate(deploymentUrl, authToken, desktopFetch),
      staleTime: STALE_TIME.health,
    }),
  );

  // Prefetch scheduler lag
  prefetchPromises.push(
    queryClient.prefetchQuery({
      queryKey: healthMetricsKeys.schedulerLag(deploymentUrl),
      queryFn: () => fetchSchedulerLag(deploymentUrl, authToken, desktopFetch),
      staleTime: STALE_TIME.health,
    }),
  );

  // Prefetch latency percentiles
  prefetchPromises.push(
    queryClient.prefetchQuery({
      queryKey: healthMetricsKeys.latency(deploymentUrl),
      queryFn: () =>
        fetchLatencyPercentiles(deploymentUrl, authToken, desktopFetch),
      staleTime: STALE_TIME.health,
    }),
  );

  // Prefetch request rate
  prefetchPromises.push(
    queryClient.prefetchQuery({
      queryKey: healthMetricsKeys.requestRate(deploymentUrl),
      queryFn: () => fetchUdfRate(deploymentUrl, authToken, desktopFetch),
      staleTime: STALE_TIME.health,
    }),
  );

  // Prefetch function health stats
  prefetchPromises.push(
    queryClient.prefetchQuery({
      queryKey: functionHealthKeys.stats(deploymentUrl),
      queryFn: async () => {
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        const cursor = Math.floor(oneHourAgo / 1000) * 1000;
        return fetchUdfExecutionStats(
          deploymentUrl,
          authToken,
          cursor,
          desktopFetch,
        );
      },
      staleTime: STALE_TIME.functionStats,
    }),
  );

  // Prefetch function activity
  prefetchPromises.push(
    queryClient.prefetchQuery({
      queryKey: functionActivityKeys.data(deploymentUrl),
      queryFn: async () => {
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        const cursor = Math.floor(oneHourAgo);
        return fetchUdfExecutionStats(
          deploymentUrl,
          authToken,
          cursor,
          desktopFetch,
        );
      },
      staleTime: STALE_TIME.functionStats,
    }),
  );

  // Prefetch deployment state
  prefetchPromises.push(
    queryClient.prefetchQuery({
      queryKey: deploymentStatusKeys.state(deploymentUrl),
      queryFn: () =>
        callConvexQuery(
          deploymentUrl,
          authToken,
          SYSTEM_QUERIES.DEPLOYMENT_STATE,
          {},
          desktopFetch,
        ),
      staleTime: STALE_TIME.health,
    }),
  );

  // Prefetch deployment version
  prefetchPromises.push(
    queryClient.prefetchQuery({
      queryKey: deploymentStatusKeys.version(deploymentUrl),
      queryFn: () =>
        callConvexQuery(
          deploymentUrl,
          authToken,
          SYSTEM_QUERIES.GET_VERSION,
          {},
          desktopFetch,
        ),
      staleTime: STALE_TIME.health,
    }),
  );

  // Prefetch last push event
  prefetchPromises.push(
    queryClient.prefetchQuery({
      queryKey: deploymentStatusKeys.lastPush(deploymentUrl),
      queryFn: () =>
        callConvexQuery(
          deploymentUrl,
          authToken,
          SYSTEM_QUERIES.LAST_PUSH_EVENT,
          {},
          desktopFetch,
        ),
      staleTime: STALE_TIME.health,
    }),
  );

  // Prefetch recent errors
  prefetchPromises.push(
    queryClient.prefetchQuery({
      queryKey: recentErrorsKeys.byHours(deploymentUrl, 1),
      queryFn: () =>
        fetchRecentErrors(deploymentUrl, authToken, 1, desktopFetch),
      staleTime: STALE_TIME.health,
    }),
  );

  // Wait for all prefetch operations (they run in parallel)
  try {
    await Promise.allSettled(prefetchPromises);
    console.log("[BackgroundPrefetch] Background prefetch completed");
  } catch (err) {
    // Prefetch errors are non-critical
    console.warn("[BackgroundPrefetch] Some prefetch operations failed:", err);
  }
}

export default useBackgroundPrefetch;
