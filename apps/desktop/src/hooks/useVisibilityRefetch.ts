import { useEffect, useState } from "react";

/**
 * Hook to track document visibility and provide a refetch interval
 * that only runs when the tab/window is visible.
 * 
 * This prevents unnecessary API calls when the user has switched to another tab.
 * 
 * @param baseInterval - The base refetch interval in milliseconds
 * @returns The refetch interval (baseInterval when visible, false when hidden)
 */
export function useVisibilityRefetch(baseInterval: number): number | false {
  const [isVisible, setIsVisible] = useState(() => {
    // Check initial visibility state
    if (typeof document === "undefined") return true;
    return !document.hidden;
  });

  useEffect(() => {
    if (typeof document === "undefined") return;

    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Return the interval when visible, false when hidden
  // React Query will pause refetching when interval is false
  return isVisible ? baseInterval : false;
}
