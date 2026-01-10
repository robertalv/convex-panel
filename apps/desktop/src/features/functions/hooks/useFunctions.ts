import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  discoverFunctions,
  groupFunctionsByPath,
  type ModuleFunction,
  type FunctionGroup,
} from "@convex-panel/shared/api";
import { STALE_TIME } from "@/contexts/QueryContext";

export interface UseFunctionsProps {
  adminClient: any;
  useMockData?: boolean;
  componentId?: string | null;
  deploymentId?: string;
  onError?: (error: string) => void;
}

export interface UseFunctionsReturn {
  functions: ModuleFunction[];
  groupedFunctions: FunctionGroup[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// Query key factory for consistent key management
const functionsKeys = {
  all: ["functions"] as const,
  list: (deploymentId: string | undefined, useMockData: boolean) =>
    [
      ...functionsKeys.all,
      "list",
      deploymentId ?? "none",
      useMockData,
    ] as const,
};

/**
 * Fetch all functions from Convex
 */
async function fetchFunctionsData(
  adminClient: any,
  useMockData: boolean,
): Promise<ModuleFunction[]> {
  if (!adminClient) {
    return [];
  }

  try {
    const funcs = await discoverFunctions(adminClient, useMockData);
    return funcs;
  } catch (err: any) {
    throw new Error(err?.message || "Failed to fetch functions");
  }
}

export function useFunctions({
  adminClient,
  useMockData = false,
  componentId = null,
  deploymentId,
  onError,
}: UseFunctionsProps): UseFunctionsReturn {
  // ============================================
  // Functions Query (with caching)
  // ============================================
  const functionsQuery = useQuery({
    queryKey: functionsKeys.list(deploymentId, useMockData),
    queryFn: () => fetchFunctionsData(adminClient, useMockData),
    enabled: Boolean(adminClient || useMockData),
    staleTime: STALE_TIME.functions,
    // Don't refetch on mount if we have cached data (manual refresh only)
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const allFunctions = functionsQuery.data ?? [];

  const functions = useMemo(() => {
    if (!allFunctions.length) return [];

    // For root app (null or "app"), show functions with no component
    if (
      componentId === null ||
      componentId === "app" ||
      componentId === undefined
    ) {
      return allFunctions.filter(
        (fn) => fn.componentId === null || fn.componentId === undefined,
      );
    }

    // For specific component, filter by component name (not ID)
    return allFunctions.filter((fn) => fn.componentId === componentId);
  }, [allFunctions, componentId]);

  const groupedFunctions = useMemo(() => {
    return groupFunctionsByPath(functions);
  }, [functions]);

  // Handle errors
  const error = functionsQuery.error
    ? functionsQuery.error instanceof Error
      ? functionsQuery.error.message
      : "Failed to fetch functions"
    : null;

  // Call onError callback when error occurs
  if (error && onError) {
    onError(error);
  }

  return {
    functions,
    groupedFunctions,
    isLoading: functionsQuery.isLoading,
    error,
    refetch: () => {
      functionsQuery.refetch();
    },
  };
}
