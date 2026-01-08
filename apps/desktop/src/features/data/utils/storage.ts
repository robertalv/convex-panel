/**
 * Data View Storage Utilities
 * LocalStorage utilities for persisting data view state
 */

import type {
  FilterExpression,
  SortConfig,
  RecentlyViewedTable,
} from "@convex-panel/shared";

const MAX_FILTER_HISTORY = 25;

const STORAGE_KEYS = {
  ACTIVE_TABLE: "convex-panel-active-table",
  TABLE_FILTERS: "convex-panel-table-filters",
  TABLE_SORT: "convex-panel-table-sort",
  RECENTLY_VIEWED: "convex-panel-recently-viewed",
  VIEW_MODE: "convex-panel-view-mode",
  SIDEBAR_WIDTH: "convex-panel-sidebar-width",
  COLUMN_WIDTHS: "convex-panel-column-widths",
  COLUMN_ORDER: "convex-panel-column-order",
  FILTER_HISTORY: "convex-panel-filter-history",
} as const;

/**
 * Check if two filter expressions are equal
 */
function areFiltersEqual(a?: FilterExpression, b?: FilterExpression): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

const MAX_RECENTLY_VIEWED = 5;

/**
 * Save the active table name
 */
export function saveActiveTable(tableName: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TABLE, tableName);
  } catch (e) {
    console.warn("Failed to save active table:", e);
  }
}

/**
 * Get the saved active table name
 */
export function getActiveTable(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_TABLE);
  } catch {
    return null;
  }
}

/**
 * Save filters for a specific table
 */
export function saveTableFilters(
  tableName: string,
  filters: FilterExpression,
): void {
  try {
    const allFilters = getAllTableFilters();
    allFilters[tableName] = filters;
    localStorage.setItem(
      STORAGE_KEYS.TABLE_FILTERS,
      JSON.stringify(allFilters),
    );
  } catch (e) {
    console.warn("Failed to save table filters:", e);
  }
}

/**
 * Get filters for a specific table
 */
export function getTableFilters(tableName: string): FilterExpression | null {
  try {
    const allFilters = getAllTableFilters();
    return allFilters[tableName] || null;
  } catch {
    return null;
  }
}

/**
 * Get all saved table filters
 */
function getAllTableFilters(): Record<string, FilterExpression> {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.TABLE_FILTERS);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Clear filters for a specific table
 */
export function clearTableFilters(tableName: string): void {
  try {
    const allFilters = getAllTableFilters();
    delete allFilters[tableName];
    localStorage.setItem(
      STORAGE_KEYS.TABLE_FILTERS,
      JSON.stringify(allFilters),
    );
  } catch (e) {
    console.warn("Failed to clear table filters:", e);
  }
}

/**
 * Save sort config for a specific table
 */
export function saveTableSortConfig(
  tableName: string,
  sortConfig: SortConfig | null,
): void {
  try {
    const allSorts = getAllTableSortConfigs();
    if (sortConfig) {
      allSorts[tableName] = sortConfig;
    } else {
      delete allSorts[tableName];
    }
    localStorage.setItem(STORAGE_KEYS.TABLE_SORT, JSON.stringify(allSorts));
  } catch (e) {
    console.warn("Failed to save sort config:", e);
  }
}

/**
 * Get sort config for a specific table
 */
export function getTableSortConfig(tableName: string): SortConfig | null {
  try {
    const allSorts = getAllTableSortConfigs();
    return allSorts[tableName] || null;
  } catch {
    return null;
  }
}

/**
 * Get all saved sort configs
 */
function getAllTableSortConfigs(): Record<string, SortConfig> {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.TABLE_SORT);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Get recently viewed tables
 */
export function getRecentlyViewedTables(): RecentlyViewedTable[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.RECENTLY_VIEWED);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Update recently viewed tables with a new entry
 */
export function updateRecentlyViewedTable(tableName: string): void {
  try {
    const recent = getRecentlyViewedTables();

    // Remove existing entry for this table
    const filtered = recent.filter((t) => t.name !== tableName);

    // Add to front with current timestamp
    const updated: RecentlyViewedTable[] = [
      { name: tableName, timestamp: Date.now() },
      ...filtered,
    ].slice(0, MAX_RECENTLY_VIEWED);

    localStorage.setItem(STORAGE_KEYS.RECENTLY_VIEWED, JSON.stringify(updated));
  } catch (e) {
    console.warn("Failed to update recently viewed:", e);
  }
}

/**
 * Save the current view mode
 */
export function saveViewMode(mode: "table" | "list" | "json" | "raw"): void {
  try {
    localStorage.setItem(STORAGE_KEYS.VIEW_MODE, mode);
  } catch (e) {
    console.warn("Failed to save view mode:", e);
  }
}

/**
 * Get the saved view mode
 */
export function getViewMode(): "table" | "list" | "json" | "raw" {
  try {
    const mode = localStorage.getItem(STORAGE_KEYS.VIEW_MODE);
    if (
      mode === "table" ||
      mode === "list" ||
      mode === "json" ||
      mode === "raw"
    ) {
      return mode;
    }
    return "table";
  } catch {
    return "table";
  }
}

/**
 * Save sidebar width
 */
export function saveSidebarWidth(width: number): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SIDEBAR_WIDTH, String(width));
  } catch (e) {
    console.warn("Failed to save sidebar width:", e);
  }
}

/**
 * Get saved sidebar width
 */
export function getSidebarWidth(): number {
  try {
    const width = localStorage.getItem(STORAGE_KEYS.SIDEBAR_WIDTH);
    return width ? parseInt(width, 10) : 240;
  } catch {
    return 240;
  }
}

/**
 * Save column widths for a table
 */
export function saveColumnWidths(
  tableName: string,
  widths: Record<string, number>,
): void {
  try {
    const allWidths = getAllColumnWidths();
    allWidths[tableName] = widths;
    localStorage.setItem(STORAGE_KEYS.COLUMN_WIDTHS, JSON.stringify(allWidths));
  } catch (e) {
    console.warn("Failed to save column widths:", e);
  }
}

/**
 * Get column widths for a table
 */
export function getColumnWidths(tableName: string): Record<string, number> {
  try {
    const allWidths = getAllColumnWidths();
    return allWidths[tableName] || {};
  } catch {
    return {};
  }
}

/**
 * Get all saved column widths
 */
function getAllColumnWidths(): Record<string, Record<string, number>> {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.COLUMN_WIDTHS);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Generate a unique ID for filter clauses
 */
export function generateFilterId(): string {
  return `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Save column order for a table
 */
export function saveColumnOrder(tableName: string, order: string[]): void {
  try {
    const allOrders = getAllColumnOrders();
    allOrders[tableName] = order;
    localStorage.setItem(STORAGE_KEYS.COLUMN_ORDER, JSON.stringify(allOrders));
  } catch (e) {
    console.warn("Failed to save column order:", e);
  }
}

/**
 * Get column order for a table
 */
export function getColumnOrder(tableName: string): string[] | null {
  try {
    const allOrders = getAllColumnOrders();
    return allOrders[tableName] || null;
  } catch {
    return null;
  }
}

/**
 * Get all saved column orders
 */
function getAllColumnOrders(): Record<string, string[]> {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.COLUMN_ORDER);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// ============================================
// Filter History Functions
// ============================================

/**
 * Get all saved filter histories (per table key)
 */
function getAllFilterHistories(): Record<string, FilterExpression[]> {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.FILTER_HISTORY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Get filter history for a specific table key
 * @param tableKey - Key in format "componentId/tableName" or just "tableName"
 */
export function getFilterHistory(tableKey: string): FilterExpression[] {
  try {
    const allHistories = getAllFilterHistories();
    return allHistories[tableKey] || [];
  } catch {
    return [];
  }
}

/**
 * Save filter history for a specific table key
 * @param tableKey - Key in format "componentId/tableName" or just "tableName"
 * @param history - Array of filter expressions (most recent first)
 */
export function saveFilterHistory(
  tableKey: string,
  history: FilterExpression[],
): void {
  try {
    const allHistories = getAllFilterHistories();
    allHistories[tableKey] = history.slice(0, MAX_FILTER_HISTORY);
    localStorage.setItem(
      STORAGE_KEYS.FILTER_HISTORY,
      JSON.stringify(allHistories),
    );
  } catch (e) {
    console.warn("Failed to save filter history:", e);
  }
}

/**
 * Append a new filter expression to the history for a table
 * Returns the updated history array
 * @param tableKey - Key in format "componentId/tableName" or just "tableName"
 * @param filters - Filter expression to add
 */
export function appendToFilterHistory(
  tableKey: string,
  filters: FilterExpression,
): FilterExpression[] {
  try {
    const history = getFilterHistory(tableKey);

    // Don't add if same as most recent
    if (history.length > 0 && areFiltersEqual(history[0], filters)) {
      return history;
    }

    // Don't add empty filters
    if (filters.clauses.length === 0 && !filters.index) {
      return history;
    }

    // Add to front and limit size
    const updatedHistory = [filters, ...history].slice(0, MAX_FILTER_HISTORY);
    saveFilterHistory(tableKey, updatedHistory);
    return updatedHistory;
  } catch (e) {
    console.warn("Failed to append to filter history:", e);
    return [];
  }
}

/**
 * Clear filter history for a specific table
 */
export function clearFilterHistory(tableKey: string): void {
  try {
    const allHistories = getAllFilterHistories();
    delete allHistories[tableKey];
    localStorage.setItem(
      STORAGE_KEYS.FILTER_HISTORY,
      JSON.stringify(allHistories),
    );
  } catch (e) {
    console.warn("Failed to clear filter history:", e);
  }
}
