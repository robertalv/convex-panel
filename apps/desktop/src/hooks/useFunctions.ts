import { useState, useEffect, useMemo } from 'react';
import { discoverFunctions, groupFunctionsByPath } from "../utils/api";
import type { ModuleFunction, FunctionGroup } from "../utils/api";

export interface UseFunctionsProps {
  adminClient: any;
  useMockData?: boolean;
  componentId?: string | null;
  onError?: (error: string) => void;
}

export interface UseFunctionsReturn {
  functions: ModuleFunction[];
  groupedFunctions: FunctionGroup[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useFunctions({
  adminClient,
  useMockData = false,
  componentId = null,
  onError,
}: UseFunctionsProps): UseFunctionsReturn {
  const [allFunctions, setAllFunctions] = useState<ModuleFunction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFunctions = async () => {
    if (!adminClient) {
      setAllFunctions([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const funcs = await discoverFunctions(adminClient, useMockData);
      setAllFunctions(funcs);
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to fetch functions';
      setError(errorMessage);
      onError?.(errorMessage);
      setAllFunctions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFunctions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminClient, useMockData]);

  const functions = useMemo(() => {
    if (!allFunctions.length) return [];

    if (componentId === null || componentId === 'app') {
      return allFunctions.filter(fn => fn.componentId === null || fn.componentId === undefined);
    }

    return allFunctions.filter(fn => fn.componentId === componentId);
  }, [allFunctions, componentId]);

  const groupedFunctions = useMemo(() => {
    return groupFunctionsByPath(functions);
  }, [functions]);

  return {
    functions,
    groupedFunctions,
    isLoading,
    error,
    refetch: fetchFunctions,
  };
}

