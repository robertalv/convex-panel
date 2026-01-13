/**
 * useFilterHistory Hook
 * Manages filter history for navigation between previous/next filter states
 * Stores history in localStorage per table
 */

import { useState, useCallback, useEffect, useMemo } from "react";
import type { FilterExpression } from "../types";
import { getFilterHistory, appendToFilterHistory } from "../utils/storage";

/**
 * Create an empty filter expression
 */
function createEmptyFilterExpression(): FilterExpression {
  return {
    clauses: [],
    order: "desc",
  };
}

/**
 * Check if two filter expressions are equal
 */
function areFiltersEqual(a?: FilterExpression, b?: FilterExpression): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

export interface UseFilterHistoryOptions {
  tableName: string;
  componentId?: string | null;
  onFiltersChange?: (filters: FilterExpression) => void;
}

export interface UseFilterHistoryReturn {
  /** The filter history array (most recent first) */
  filterHistory: FilterExpression[];
  /** Current index in the history (0 = most recent) */
  currentIndex: number;
  /** Whether we can go to previous filters */
  canGoPrevious: boolean;
  /** Whether we can go to next filters */
  canGoNext: boolean;
  /** Go to previous filter state */
  goPrevious: () => void;
  /** Go to next filter state */
  goNext: () => void;
  /** Get the filter at the current index */
  currentFilters: FilterExpression;
  /** Add a new filter state to history */
  addToHistory: (filters: FilterExpression) => void;
  /** Reset to the beginning of history */
  resetToLatest: () => void;
  /** Set the current index directly */
  setCurrentIndex: (index: number) => void;
  /** Apply filters and add to history */
  applyFiltersWithHistory: (filters: FilterExpression) => void;
}

/**
 * Hook for managing filter history with previous/next navigation
 */
export function useFilterHistory({
  tableName,
  componentId = null,
  onFiltersChange,
}: UseFilterHistoryOptions): UseFilterHistoryReturn {
  // Generate storage key based on table and component
  const storageKey = useMemo(() => {
    const componentPart = componentId ? `${componentId}/` : "";
    return `${componentPart}${tableName}`;
  }, [tableName, componentId]);

  // Load initial history from storage
  const [filterHistory, setFilterHistory] = useState<FilterExpression[]>(() => {
    return getFilterHistory(storageKey);
  });

  // Current position in history (0 = most recent)
  const [currentIndex, setCurrentIndex] = useState(0);

  // Sync with storage when key changes
  useEffect(() => {
    const history = getFilterHistory(storageKey);
    setFilterHistory(history);
    setCurrentIndex(0);
  }, [storageKey]);

  // Derived state
  const canGoPrevious = currentIndex < filterHistory.length - 1;
  const canGoNext = currentIndex > 0;

  const currentFilters = useMemo(() => {
    if (filterHistory.length === 0) {
      return createEmptyFilterExpression();
    }
    return filterHistory[currentIndex] ?? createEmptyFilterExpression();
  }, [filterHistory, currentIndex]);

  // Go to previous filter state (older)
  const goPrevious = useCallback(() => {
    if (!canGoPrevious) return;

    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);

    const prevFilters = filterHistory[newIndex];
    if (prevFilters && onFiltersChange) {
      onFiltersChange(prevFilters);
    }
  }, [currentIndex, canGoPrevious, filterHistory, onFiltersChange]);

  // Go to next filter state (newer)
  const goNext = useCallback(() => {
    if (!canGoNext) return;

    const newIndex = currentIndex - 1;
    setCurrentIndex(newIndex);

    const nextFilters = filterHistory[newIndex];
    if (nextFilters && onFiltersChange) {
      onFiltersChange(nextFilters);
    }
  }, [currentIndex, canGoNext, filterHistory, onFiltersChange]);

  // Add a new filter state to history
  const addToHistory = useCallback(
    (filters: FilterExpression) => {
      // Don't add if same as most recent
      if (
        filterHistory.length > 0 &&
        areFiltersEqual(filterHistory[0], filters)
      ) {
        return;
      }

      // Don't add empty filters to history
      if (filters.clauses.length === 0 && !filters.index) {
        return;
      }

      const newHistory = appendToFilterHistory(storageKey, filters);
      setFilterHistory(newHistory);
      setCurrentIndex(0);
    },
    [filterHistory, storageKey],
  );

  // Reset to the latest (most recent) entry
  const resetToLatest = useCallback(() => {
    setCurrentIndex(0);
    if (filterHistory.length > 0 && onFiltersChange) {
      onFiltersChange(filterHistory[0]);
    }
  }, [filterHistory, onFiltersChange]);

  // Apply filters and add to history
  const applyFiltersWithHistory = useCallback(
    (filters: FilterExpression) => {
      addToHistory(filters);
      if (onFiltersChange) {
        onFiltersChange(filters);
      }
    },
    [addToHistory, onFiltersChange],
  );

  return {
    filterHistory,
    currentIndex,
    canGoPrevious,
    canGoNext,
    goPrevious,
    goNext,
    currentFilters,
    addToHistory,
    resetToLatest,
    setCurrentIndex,
    applyFiltersWithHistory,
  };
}

export default useFilterHistory;
