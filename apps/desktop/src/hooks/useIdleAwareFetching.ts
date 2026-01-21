import { useIdle } from "react-use";

/**
 * Default idle timeout in milliseconds (1 minute).
 * Matches the pattern used in convex-backend-main dashboard.
 */
const DEFAULT_IDLE_TIMEOUT_MS = 60 * 1000;

/**
 * Hook that detects user inactivity and returns whether fetching should be active.
 * Uses react-use's useIdle to track user activity (mouse, keyboard, touch events).
 *
 * After the specified idle time with no user interaction, this hook returns false,
 * indicating that background data fetching should be paused to save resources.
 *
 * This pattern is borrowed from convex-backend-main's data table view which
 * automatically pauses live data fetching after 1 minute of inactivity.
 *
 * @param idleTimeMs - Time in milliseconds before considered idle (default: 60000ms = 1 minute)
 * @returns true if user is active (should fetch), false if user is idle (should pause)
 *
 * @example
 * ```typescript
 * const isUserActive = useIdleAwareFetching();
 *
 * const query = useQuery({
 *   queryKey: ["liveData"],
 *   queryFn: fetchLiveData,
 *   enabled: isUserActive, // Pauses fetching after 1 min of inactivity
 *   refetchInterval: isUserActive ? 5000 : false,
 * });
 * ```
 */
export function useIdleAwareFetching(
  idleTimeMs: number = DEFAULT_IDLE_TIMEOUT_MS,
): boolean {
  // useIdle returns true when user is idle (no activity for idleTimeMs)
  // We invert this to return true when user is active (should fetch)
  const isIdle = useIdle(idleTimeMs, false);

  return !isIdle;
}

/**
 * Export the default timeout for consistency across the app
 */
export { DEFAULT_IDLE_TIMEOUT_MS };
