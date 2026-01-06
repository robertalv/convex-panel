import { useState, useEffect, useCallback } from "react";
import {
  fetchInsights,
  type FetchFn,
  type Insight,
} from "@convex-panel/shared/api";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { useDeployment } from "@/contexts/DeploymentContext";

// Use Tauri's fetch for CORS-free HTTP requests
const desktopFetch: FetchFn = (input, init) => tauriFetch(input, init);

interface InsightsState {
  /** List of insights from BigBrain API */
  insights: Insight[];
  /** Whether data is loading */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Refetch data */
  refetch: () => void;
}

/**
 * Hook for fetching insights from the Convex BigBrain API.
 * Uses real API data only - no mock data.
 */
export function useInsights(): InsightsState {
  const { deploymentUrl, authToken } = useDeployment();

  const [insights, setInsights] = useState<Insight[]>([]);
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
      const result = await fetchInsights(
        deploymentUrl,
        authToken,
        desktopFetch,
      );

      setInsights(result);
    } catch (err) {
      console.error("[Insights] Error fetching:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch insights");
    } finally {
      setIsLoading(false);
    }
  }, [deploymentUrl, authToken]);

  // Initial fetch
  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    insights,
    isLoading,
    error,
    refetch,
  };
}
