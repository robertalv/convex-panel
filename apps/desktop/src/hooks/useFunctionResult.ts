import { useState, useEffect, useCallback } from 'react';
import type { Value } from 'convex/values';
import { executeFunction } from "../utils/api";
import type { FunctionResult } from "../utils/api";
import type { ModuleFunction } from "../utils/api";
import { useRunHistory } from './useRunHistory';
import type { RunHistoryItem } from './useRunHistory';

interface UseFunctionResultProps {
  adminClient: any;
  moduleFunction: ModuleFunction | null;
  args: Record<string, Value>;
  udfType?: 'query' | 'mutation' | 'action';
  componentId?: string | null;
  runHistoryItem?: RunHistoryItem;
  impersonatedUser?: any;
  onResult?: (result: FunctionResult) => void;
}

export function useFunctionResult({
  adminClient,
  moduleFunction,
  args,
  udfType,
  componentId,
  runHistoryItem,
  impersonatedUser,
  onResult,
}: UseFunctionResultProps) {
  const [isInFlight, setIsInFlight] = useState(false);
  const [result, setResult] = useState<FunctionResult | undefined>();
  const [lastRequestTiming, setLastRequestTiming] = useState<{
    startedAt: number;
    endedAt: number;
  }>();

  const { appendRunHistory } = useRunHistory(
    moduleFunction?.identifier || '',
    componentId || null
  );

  // Reset result when function or history item changes
  useEffect(() => {
    if (runHistoryItem) {
      setResult(undefined);
      setLastRequestTiming(undefined);
      setIsInFlight(false);
    }
  }, [runHistoryItem]);

  useEffect(() => {
    if (moduleFunction?.identifier) {
      setResult(undefined);
      setLastRequestTiming(undefined);
      setIsInFlight(false);
    }
  }, [moduleFunction?.identifier]);

  const runFunction = useCallback(async () => {
    if (!moduleFunction || !adminClient) {
      return;
    }

    // HTTP actions cannot be executed through the normal function execution path
    const functionUdfType = udfType || moduleFunction.udfType;
    if (functionUdfType === 'httpAction') {
      setResult({
        success: false,
        errorMessage: 'HTTP actions cannot be executed through the function runner. Use the HTTP endpoint directly.',
        logLines: [],
      });
      return;
    }

    const startedAt = Date.now();
    setIsInFlight(true);
    setResult(undefined);

    try {
      const functionResult = await executeFunction(
        adminClient,
        moduleFunction.identifier,
        args,
        functionUdfType as 'query' | 'mutation' | 'action',
        impersonatedUser,
        componentId
      );

      const endedAt = Date.now();
      setLastRequestTiming({ startedAt, endedAt });
      setResult(functionResult);
      onResult?.(functionResult);

      // Add to history
      appendRunHistory({
        type: 'arguments',
        startedAt,
        endedAt,
        arguments: args,
      });
    } catch (error: any) {
      const endedAt = Date.now();
      setLastRequestTiming({ startedAt, endedAt });
      setResult({
        success: false,
        errorMessage: error.message || 'An error occurred while executing the function',
        logLines: [],
      });
    } finally {
      // Wait a moment before re-enabling the button
      setTimeout(() => {
        setIsInFlight(false);
      }, 100);
    }
  }, [adminClient, moduleFunction, args, udfType, impersonatedUser, componentId, appendRunHistory, onResult]);

  return {
    result,
    loading: isInFlight,
    lastRequestTiming,
    runFunction,
  };
}

