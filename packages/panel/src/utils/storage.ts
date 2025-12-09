import { STORAGE_KEYS, STORAGE_PREFIX } from "./constants";

/**
 * In-memory cache
 * @type {Record<string, any>}
 * @description A simple in-memory cache to reduce localStorage reads
 */
const memoryCache: Record<string, any> = {};

/**
 * Get a value from local storage with caching
 */
export function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  
  // Check memory cache first
  if (key in memoryCache) {
    return memoryCache[key] as T;
  }
  
  try {
    const item = window.localStorage.getItem(key);
    const value = item ? JSON.parse(item) : defaultValue;
    
    // Cache the result
    memoryCache[key] = value;
    
    return value;
  } catch (error) {
    console.error(`Error getting item ${key} from localStorage:`, error);
    return defaultValue;
  }
}

/**
 * Set a value in local storage with caching
 */
export function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    // Update memory cache first for immediate access
    memoryCache[key] = value;
    
    // Then update localStorage
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting item ${key} in localStorage:`, error);
  }
}

/**
 * Remove a value from local storage
 */
export function removeStorageItem(key: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing item ${key} from localStorage:`, error);
  }
}

/**
 * Get stored filters for a specific table with optimized caching
 */
export function getTableFilters(tableName: string) {
  // Use a specific cache key for each table's filters
  const cacheKey = `${STORAGE_KEYS.TABLE_FILTERS}:${tableName}`;
  
  if (cacheKey in memoryCache) {
    return memoryCache[cacheKey];
  }
  
  const allFilters = getStorageItem<Record<string, any>>(STORAGE_KEYS.TABLE_FILTERS, {});
  const tableFilters = allFilters[tableName] || { clauses: [] };
  
  // Cache the result for this specific table
  memoryCache[cacheKey] = tableFilters;
  
  return tableFilters;
}

/**
 * Save filters for a specific table with optimized caching
 */
export function saveTableFilters(tableName: string, filters: any) {
  // Update the specific table cache
  const cacheKey = `${STORAGE_KEYS.TABLE_FILTERS}:${tableName}`;
  memoryCache[cacheKey] = filters;
  
  // Update the all filters cache
  const allFilters = getStorageItem<Record<string, any>>(STORAGE_KEYS.TABLE_FILTERS, {});
  
  // If filters are empty, remove the entry completely
  if (filters.clauses.length === 0) {
    delete allFilters[tableName];
  } else {
    allFilters[tableName] = filters;
  }
  
  // Save to localStorage
  setStorageItem(STORAGE_KEYS.TABLE_FILTERS, allFilters);
}

/**
 * Get sort config for a specific table
 */
export function getTableSortConfig(tableName: string): any {
  const sortConfigKey = `${STORAGE_KEYS.TABLE_FILTERS}:sort-${tableName}`;
  return getStorageItem<any>(sortConfigKey, null);
}

/**
 * Save sort config for a specific table
 */
export function saveTableSortConfig(tableName: string, sortConfig: any): void {
  const sortConfigKey = `${STORAGE_KEYS.TABLE_FILTERS}:sort-${tableName}`;
  if (sortConfig) {
    setStorageItem(sortConfigKey, sortConfig);
  } else {
    removeStorageItem(sortConfigKey);
  }
}

/**
 * Get the active table from storage
 */
export function getActiveTable(): string {
  return getStorageItem<string>(STORAGE_KEYS.ACTIVE_TABLE, '');
}

/**
 * Save the active table to storage
 */
export function saveActiveTable(tableName: string): void {
  setStorageItem(STORAGE_KEYS.ACTIVE_TABLE, tableName);
}

/**
 * Clear all convex-panel storage (for debugging)
 */
export function clearAllStorage(): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    // Clear memory cache first
    Object.keys(memoryCache).forEach(key => {
      delete memoryCache[key];
    });
    
    // Get all keys from localStorage
    const keys = Object.keys(window.localStorage);
    
    // Remove all keys that start with the prefix
    keys.forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        window.localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing convex-panel storage:', error);
  }
}

/**
 * Get recently viewed tables from storage
 */
export function getRecentlyViewedTables() {
  return getStorageItem<{ name: string; timestamp: number }[]>(
    STORAGE_KEYS.RECENTLY_VIEWED_TABLES, 
    []
  );
}

/**
 * Update recently viewed tables in storage
 * Adds a table to the recently viewed list with current timestamp
 * If the table already exists, updates its timestamp and moves it to the top
 */
export function updateRecentlyViewedTable(tableName: string): void {
  const recentTables = getRecentlyViewedTables();
  
  // Filter out the current table if it exists
  const filteredTables = recentTables.filter(table => table.name !== tableName);
  
  // Add the table with the current timestamp
  const updatedRecentTables = [
    { name: tableName, timestamp: Date.now() },
    ...filteredTables
  ];
  
  // Only keep the 10 most recent tables
  const trimmedRecentTables = updatedRecentTables.slice(0, 10);
  
  // Save to storage
  setStorageItem(STORAGE_KEYS.RECENTLY_VIEWED_TABLES, trimmedRecentTables);
}

/**
 * Default filter history retention time: 24 hours in milliseconds
 */
const DEFAULT_FILTER_HISTORY_RETENTION_MS = 24 * 60 * 60 * 1000;

/**
 * Get filter history retention time from storage
 * Returns retention time in milliseconds
 */
export function getFilterHistoryRetentionMs(): number {
  return getStorageItem<number>(
    STORAGE_KEYS.FILTER_HISTORY_RETENTION_MS,
    DEFAULT_FILTER_HISTORY_RETENTION_MS
  );
}

/**
 * Set filter history retention time in storage
 * @param retentionMs - Retention time in milliseconds
 */
export function setFilterHistoryRetentionMs(retentionMs: number): void {
  // Ensure minimum of 1 hour
  const minRetention = 60 * 60 * 1000; // 1 hour
  const validRetention = Math.max(retentionMs, minRetention);
  setStorageItem(STORAGE_KEYS.FILTER_HISTORY_RETENTION_MS, validRetention);
}

/**
 * Get filter history retention time in hours (for display)
 */
export function getFilterHistoryRetentionHours(): number {
  const retentionMs = getFilterHistoryRetentionMs();
  return retentionMs / (60 * 60 * 1000);
}

/**
 * Set filter history retention time from hours
 * @param retentionHours - Retention time in hours
 */
export function setFilterHistoryRetentionHours(retentionHours: number): void {
  const retentionMs = retentionHours * 60 * 60 * 1000;
  setFilterHistoryRetentionMs(retentionMs);
}

/**
 * Logs filter storage interface
 */
export interface LogsFilters {
  searchQuery?: string;
  logTypes?: string[];
  functionIds?: string[];
  componentIds?: string[];
}

/**
 * Get stored logs filters
 */
export function getLogsFilters(): LogsFilters | null {
  return getStorageItem<LogsFilters | null>(STORAGE_KEYS.LOGS_FILTERS, null);
}

/**
 * Save logs filters to storage
 */
export function saveLogsFilters(filters: LogsFilters): void {
  setStorageItem(STORAGE_KEYS.LOGS_FILTERS, filters);
}

/**
 * Clear logs filters from storage
 */
export function clearLogsFilters(): void {
  removeStorageItem(STORAGE_KEYS.LOGS_FILTERS);
} 