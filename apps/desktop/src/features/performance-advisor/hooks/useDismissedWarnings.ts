/**
 * useDismissedWarnings Hook
 * Persists dismissed warning IDs to localStorage
 */

import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "convex-panel-dismissed-warnings";

interface DismissedWarningsState {
  dismissedIds: Set<string>;
  dismissWarning: (id: string) => void;
  restoreWarning: (id: string) => void;
  restoreAll: () => void;
  isDismissed: (id: string) => boolean;
}

export function useDismissedWarnings(): DismissedWarningsState {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return new Set(Array.isArray(parsed) ? parsed : []);
      }
    } catch (err) {
      console.error("Failed to load dismissed warnings:", err);
    }
    return new Set();
  });

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...dismissedIds]));
    } catch (err) {
      console.error("Failed to save dismissed warnings:", err);
    }
  }, [dismissedIds]);

  const dismissWarning = useCallback((id: string) => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const restoreWarning = useCallback((id: string) => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const restoreAll = useCallback(() => {
    setDismissedIds(new Set());
  }, []);

  const isDismissed = useCallback(
    (id: string) => dismissedIds.has(id),
    [dismissedIds],
  );

  return {
    dismissedIds,
    dismissWarning,
    restoreWarning,
    restoreAll,
    isDismissed,
  };
}
