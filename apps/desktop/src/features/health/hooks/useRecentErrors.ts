import { useState, useEffect, useCallback } from "react";
import { fetchRecentErrors, type FetchFn } from "@convex-panel/shared/api";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { useDeployment } from "@/contexts/DeploymentContext";

// Use Tauri's fetch for CORS-free HTTP requests
const desktopFetch: FetchFn = (input, init) => tauriFetch(input, init);

export interface ErrorSummary {
  /** Error message */
  message: string;
  /** Number of occurrences */
  count: number;
}

interface RecentErrorsState {
  /** Total number of errors in the time window */
  errorCount: number;
  /** Top error messages by frequency */
  topErrors: ErrorSummary[];
  /** Whether data is loading */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Refetch data */
  refetch: () => void;
}

/**
 * Hook for fetching recent errors from the deployment.
 * Uses real API data only - no mock data.
 */
export function useRecentErrors(hoursBack: number = 1): RecentErrorsState {
  const { deploymentUrl, authToken } = useDeployment();

  const [errorCount, setErrorCount] = useState(0);
  const [topErrors, setTopErrors] = useState<ErrorSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!deploymentUrl || !authToken) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchRecentErrors(
        deploymentUrl,
        authToken,
        hoursBack,
        desktopFetch,
      );

      setErrorCount(result.count);
      setTopErrors(result.topErrors);
    } catch (err) {
      console.error("[RecentErrors] Error fetching:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch recent errors",
      );
    } finally {
      setIsLoading(false);
    }
  }, [deploymentUrl, authToken, hoursBack]);

  // Initial fetch
  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    errorCount,
    topErrors,
    isLoading,
    error,
    refetch,
  };
}
