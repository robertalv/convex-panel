import { useRouteAwareFetching } from "./useRouteAwareFetching";
import {
  useIdleAwareFetching,
  DEFAULT_IDLE_TIMEOUT_MS,
} from "./useIdleAwareFetching";
import { useVisibilityRefetch } from "./useVisibilityRefetch";

/**
 * Options for configuring combined fetching control behavior.
 */
export interface CombinedFetchingOptions {
  /**
   * Time in milliseconds before user is considered idle.
   * Default: 60000ms (1 minute)
   */
  idleTimeMs?: number;

  /**
   * Skip idle detection entirely. Useful for critical data that should
   * always be fetched when on the route.
   * Default: false
   */
  skipIdleDetection?: boolean;

  /**
   * Skip route detection. Useful when a hook is shared across routes.
   * Default: false
   */
  skipRouteDetection?: boolean;
}

/**
 * Return type for the combined fetching control hook.
 */
export interface FetchingControl {
  /**
   * Whether the query should be enabled.
   * Combines route awareness, idle detection, and visibility.
   */
  enabled: boolean;

  /**
   * The refetch interval to use.
   * Returns false when fetching should be paused.
   */
  refetchInterval: number | false;

  /**
   * Whether the user is on the target route.
   */
  isOnRoute: boolean;

  /**
   * Whether the user is active (not idle).
   */
  isActive: boolean;

  /**
   * Whether the tab is visible.
   */
  isVisible: boolean;
}

/**
 * Combined hook that provides intelligent fetching control based on:
 * 1. Route awareness - Disable fetching when not on the target route
 * 2. Idle detection - Pause after user inactivity
 * 3. Visibility - Pause when browser tab is hidden
 *
 * This pattern is inspired by convex-backend-main's dashboard which uses
 * useIdle and connection state monitoring to reduce unnecessary network calls.
 *
 * @param targetRoute - The route path where fetching should be active (e.g., "/health")
 * @param baseInterval - The base refetch interval in milliseconds when active
 * @param options - Optional configuration for idle and route detection
 * @returns FetchingControl object with enabled state and refetch interval
 *
 * @example
 * ```typescript
 * // In a health metrics hook:
 * const { enabled, refetchInterval } = useCombinedFetchingControl(
 *   "/health",
 *   30000 // 30 second base interval
 * );
 *
 * const query = useQuery({
 *   queryKey: ["healthMetrics"],
 *   queryFn: fetchHealthMetrics,
 *   enabled: enabled && Boolean(deploymentUrl),
 *   refetchInterval,
 * });
 * ```
 */
export function useCombinedFetchingControl(
  targetRoute: string,
  baseInterval: number,
  options?: CombinedFetchingOptions,
): FetchingControl {
  const {
    idleTimeMs = DEFAULT_IDLE_TIMEOUT_MS,
    skipIdleDetection = false,
    skipRouteDetection = false,
  } = options ?? {};

  // Check if user is on the target route
  const isOnRoute = skipRouteDetection || useRouteAwareFetching(targetRoute);

  // Check if user is active (not idle)
  const isActive = skipIdleDetection || useIdleAwareFetching(idleTimeMs);

  // Check if tab is visible (existing pattern)
  // This returns the interval when visible, false when hidden
  const visibilityInterval = useVisibilityRefetch(baseInterval);
  const isVisible = visibilityInterval !== false;

  // Combine all conditions
  const shouldFetch = isOnRoute && isActive && isVisible;

  return {
    enabled: shouldFetch,
    refetchInterval: shouldFetch ? visibilityInterval : false,
    isOnRoute,
    isActive,
    isVisible,
  };
}

/**
 * Simplified version that only returns enabled state for queries
 * that don't use refetchInterval (one-time fetches).
 */
export function useFetchingEnabled(
  targetRoute: string,
  options?: CombinedFetchingOptions,
): boolean {
  const { enabled } = useCombinedFetchingControl(targetRoute, 0, options);
  return enabled;
}
