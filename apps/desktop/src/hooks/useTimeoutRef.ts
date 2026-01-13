import { useRef, useCallback, useEffect } from "react";

/**
 * Hook for managing timeout refs with automatic cleanup
 * Returns a ref to store the timeout ID and a clear function
 */
export function useTimeoutRef() {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clear();
    };
  }, [clear]);

  return {
    ref: timeoutRef,
    clear,
  };
}
