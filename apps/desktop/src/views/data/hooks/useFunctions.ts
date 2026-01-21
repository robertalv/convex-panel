/**
 * useFunctions Hook
 * Fetches and manages available Convex functions
 *
 * Uses React Query for:
 * - Automatic caching
 * - Background refetching
 * - Consistent state management
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import type { ModuleFunction } from "@/components/function-selector";
import { discoverFunctions } from "@convex-panel/shared/api";
import { STALE_TIME } from "@/contexts/query-context";

export interface UseFunctionsProps {
  adminClient: any;
  useMockData?: boolean;
  onError?: (error: string) => void;
}

export interface UseFunctionsReturn {
  functions: ModuleFunction[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// Query key factory for functions
export const functionsQueryKeys = {
  all: ["functions"] as const,
  list: (clientId: string | undefined) =>
    [...functionsQueryKeys.all, "list", clientId ?? "none"] as const,
};

/**
 * Fetch functions from the admin client
 */
async function fetchFunctionsData(
  adminClient: any,
  useMockData: boolean,
): Promise<ModuleFunction[]> {
  if (!adminClient) {
    return [];
  }
  return discoverFunctions(adminClient, useMockData);
}

/**
 * Hook to fetch and manage Convex functions
 * Uses React Query for caching and automatic refetching
 */
export function useFunctions({
  adminClient,
  useMockData = false,
  onError,
}: UseFunctionsProps): UseFunctionsReturn {
  const queryClient = useQueryClient();

  // Generate a stable client ID for query key
  // This ensures cache is invalidated when client changes
  const clientId = adminClient?._id ?? adminClient?.address ?? "default";

  const query = useQuery({
    queryKey: functionsQueryKeys.list(clientId),
    queryFn: () => fetchFunctionsData(adminClient, useMockData),
    enabled: Boolean(adminClient || useMockData),
    staleTime: STALE_TIME.functions,
    // Don't refetch on mount if we have cached data
    refetchOnMount: false,
  });

  // Report errors to parent
  useEffect(() => {
    if (query.error && onError) {
      const errorMessage =
        query.error instanceof Error
          ? query.error.message
          : "Failed to fetch functions";
      onError(errorMessage);
    }
  }, [query.error, onError]);

  // Refetch function for manual refresh
  const refetch = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: functionsQueryKeys.list(clientId),
    });
  }, [queryClient, clientId]);

  return {
    functions: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error
      ? query.error instanceof Error
        ? query.error.message
        : "Failed to fetch functions"
      : null,
    refetch,
  };
}

export default useFunctions;
