/**
 * useFunctions Hook
 * Fetches and manages available Convex functions
 */

import { useState, useEffect, useCallback } from "react";
import type { ModuleFunction } from "../components/FunctionSelector";
import { discoverFunctions } from "@convex-panel/shared/api";

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

/**
 * Hook to fetch and manage Convex functions
 */
export function useFunctions({
  adminClient,
  useMockData = false,
  onError,
}: UseFunctionsProps): UseFunctionsReturn {
  const [allFunctions, setAllFunctions] = useState<ModuleFunction[]>([]);
  // Start as loading - we need to wait for the first fetch to complete
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFunctions = useCallback(async () => {
    if (!adminClient) {
      setAllFunctions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const funcs = await discoverFunctions(adminClient, useMockData);
      setAllFunctions(funcs);
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to fetch functions";
      setError(errorMessage);
      onError?.(errorMessage);
      setAllFunctions([]);
    } finally {
      setIsLoading(false);
    }
  }, [adminClient, useMockData, onError]);

  useEffect(() => {
    fetchFunctions();
  }, [fetchFunctions]);

  return {
    functions: allFunctions,
    isLoading,
    error,
    refetch: fetchFunctions,
  };
}

export default useFunctions;
