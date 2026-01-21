import { useLocation } from "react-router-dom";

/**
 * Hook that checks if the current route matches the target path.
 * Used to disable data fetching when navigated away from a view.
 *
 * This prevents unnecessary network calls when the user is on a different route.
 * For example, health metrics shouldn't be fetched when on the /data or /logs routes.
 *
 * @param targetPath - The route path to check against (e.g., "/health", "/data")
 * @returns true if the current route starts with the target path, false otherwise
 *
 * @example
 * ```typescript
 * // In a health view hook:
 * const isOnHealthRoute = useRouteAwareFetching("/health");
 *
 * const query = useQuery({
 *   queryKey: ["healthMetrics"],
 *   queryFn: fetchHealthMetrics,
 *   enabled: isOnHealthRoute, // Only fetch when on /health
 * });
 * ```
 */
export function useRouteAwareFetching(targetPath: string): boolean {
  const location = useLocation();

  // Check if current pathname starts with the target path
  // This handles both exact matches ("/health") and nested routes ("/health/details")
  return location.pathname.startsWith(targetPath);
}
