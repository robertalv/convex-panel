import type { FilterExpression, SortConfig } from "@convex-panel/shared";
import { STORAGE_KEYS } from './constants';

/**
 * Maximum number of filter history entries stored per scope in sessionStorage
 */
const MAX_SESSION_HISTORY_ENTRIES = 5;

/**
 * Structure stored in sessionStorage for filter history
 */
interface SessionFilterHistoryData {
  states: Array<{ filters: FilterExpression; sortConfig: SortConfig | null }>;
  head: number; // Current position in history (0-indexed), -1 means before any states
}

/**
 * Get the sessionStorage key for a given scope
 */
function getSessionStorageKey(scope: string): string {
  return `${STORAGE_KEYS.FILTER_HISTORY_SESSION_PREFIX}:${scope}`;
}

/**
 * Load filter history for a scope from sessionStorage
 */
function getSessionFilterHistory(scope: string): SessionFilterHistoryData | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const key = getSessionStorageKey(scope);
    const stored = window.sessionStorage.getItem(key);
    if (!stored) {
      return null;
    }
    return JSON.parse(stored) as SessionFilterHistoryData;
  } catch (error) {
    console.error(`Error loading filter history from sessionStorage for scope ${scope}:`, error);
    return null;
  }
}

/**
 * Save filter history for a scope to sessionStorage
 */
function saveSessionFilterHistory(scope: string, data: SessionFilterHistoryData): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const key = getSessionStorageKey(scope);
    window.sessionStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving filter history to sessionStorage for scope ${scope}:`, error);
  }
}

/**
 * Initialize or get filter history for a scope
 */
function initOrGetHistory(scope: string): SessionFilterHistoryData {
  const existing = getSessionFilterHistory(scope);
  if (existing) {
    return existing;
  }
  
  // Initialize new history
  const newHistory: SessionFilterHistoryData = {
    states: [],
    head: -1, // -1 means before any states
  };
  saveSessionFilterHistory(scope, newHistory);
  return newHistory;
}

/**
 * Push a new filter state to sessionStorage history
 * Limits to MAX_SESSION_HISTORY_ENTRIES entries, removing oldest if exceeded
 */
function pushSessionFilterHistory(
  scope: string,
  state: { filters: FilterExpression; sortConfig: SortConfig | null }
): void {
  const history = initOrGetHistory(scope);
  
  // If head is -1 (before any states), clear existing states to start fresh
  // Otherwise, if head is not at the end, prune states ahead of head
  if (history.head === -1) {
    history.states = [];
  } else if (history.head >= 0 && history.head < history.states.length - 1) {
    history.states = history.states.slice(0, history.head + 1);
  }
  
  // Add new state
  history.states.push(state);
  history.head = history.states.length - 1;
  
  // Limit to MAX_SESSION_HISTORY_ENTRIES entries, keeping the most recent
  if (history.states.length > MAX_SESSION_HISTORY_ENTRIES) {
    const removeCount = history.states.length - MAX_SESSION_HISTORY_ENTRIES;
    history.states = history.states.slice(removeCount);
    history.head = history.states.length - 1;
  }
  
  saveSessionFilterHistory(scope, history);
}

/**
 * Undo: move head backward in history
 */
function undoSessionFilterHistory(scope: string, count: number = 1): { filters: FilterExpression; sortConfig: SortConfig | null } | null {
  const history = initOrGetHistory(scope);
  
  if (history.states.length === 0 || history.head < 0) {
    return null; // No states to undo
  }
  
  // Move head backward
  const newHead = Math.max(-1, history.head - count);
  
  if (newHead < 0) {
    // Moved to position before any states
    history.head = -1;
    saveSessionFilterHistory(scope, history);
    return null;
  }
  
  history.head = newHead;
  saveSessionFilterHistory(scope, history);
  return history.states[newHead];
}

/**
 * Redo: move head forward in history
 */
function redoSessionFilterHistory(scope: string, count: number = 1): { filters: FilterExpression; sortConfig: SortConfig | null } | null {
  const history = initOrGetHistory(scope);
  
  if (history.states.length === 0 || history.head >= history.states.length - 1) {
    return null; // Already at the end
  }
  
  // Move head forward
  const newHead = Math.min(history.states.length - 1, history.head + count);
  history.head = newHead;
  saveSessionFilterHistory(scope, history);
  
  return history.states[newHead];
}

/**
 * Get filter history status (canUndo, canRedo, position, length)
 */
function getSessionFilterHistoryStatus(scope: string): {
  canUndo: boolean;
  canRedo: boolean;
  position: number | null;
  length: number;
} {
  const history = initOrGetHistory(scope);
  
  const canUndo = history.head >= 0;
  const canRedo = history.head < history.states.length - 1;
  const position = history.head >= 0 ? history.head : null;
  const length = history.states.length;
  
  return {
    canUndo,
    canRedo,
    position,
    length,
  };
}

/**
 * Get current filter state at head position
 * TODO: Implement this after the convex-component is updated to support it
 */
// function getCurrentSessionFilterState(scope: string): { filters: FilterExpression; sortConfig: SortConfig | null } | null {
//   const history = initOrGetHistory(scope);
  
//   if (history.states.length === 0 || history.head < 0) {
//     return null;
//   }
  
//   return history.states[history.head];
// }

/**
 * Filter history API interface matching the one used by DataFilterPanel
 */
export interface FilterHistoryApi {
  push: (scope: string, state: { filters: FilterExpression; sortConfig: SortConfig | null }) => Promise<void>;
  undo: (scope: string, count?: number) => Promise<{ filters: FilterExpression; sortConfig: SortConfig | null } | null>;
  redo: (scope: string, count?: number) => Promise<{ filters: FilterExpression; sortConfig: SortConfig | null } | null>;
  getStatus: (scope: string) => Promise<{ canUndo: boolean; canRedo: boolean; position: number | null; length: number }>;
  // getCurrentState: (scope: string) => Promise<{ filters: FilterExpression; sortConfig: SortConfig | null } | null>;
}

/**
 * Create a sessionStorage-based filter history API
 * This provides a fallback when the convex-component is not installed
 */
export function createSessionStorageFilterHistoryApi(): FilterHistoryApi {
  return {
    push: async (scope: string, state: { filters: FilterExpression; sortConfig: SortConfig | null }) => {
      pushSessionFilterHistory(scope, state);
    },
    undo: async (scope: string, count: number = 1) => {
      return undoSessionFilterHistory(scope, count);
    },
    redo: async (scope: string, count: number = 1) => {
      return redoSessionFilterHistory(scope, count);
    },
    getStatus: async (scope: string) => {
      return getSessionFilterHistoryStatus(scope);
    },
    // getCurrentState: async (scope: string) => {
    //   return getCurrentSessionFilterState(scope);
    // },
  };
}