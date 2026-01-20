/**
 * AsyncStorage helpers for caching data browser state
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  DataViewMode,
  TableDocument,
  FilterExpression,
  SortConfig,
} from "../types";

const STORAGE_PREFIX = "@convex-panel:data";

/**
 * Storage keys
 */
export const StorageKeys = {
  SELECTED_TABLE: `${STORAGE_PREFIX}:selectedTable`,
  VIEW_MODE: `${STORAGE_PREFIX}:viewMode`,
  FILTERS: `${STORAGE_PREFIX}:filters`,
  SORT_CONFIG: `${STORAGE_PREFIX}:sortConfig`,
  cachedDocuments: (tableName: string) =>
    `${STORAGE_PREFIX}:cache:${tableName}`,
};

/**
 * Save selected table name
 */
export async function saveSelectedTable(
  tableName: string | null,
): Promise<void> {
  try {
    if (tableName === null) {
      await AsyncStorage.removeItem(StorageKeys.SELECTED_TABLE);
    } else {
      await AsyncStorage.setItem(StorageKeys.SELECTED_TABLE, tableName);
    }
  } catch (error) {
    console.error("Failed to save selected table:", error);
  }
}

/**
 * Load selected table name
 */
export async function loadSelectedTable(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(StorageKeys.SELECTED_TABLE);
  } catch (error) {
    console.error("Failed to load selected table:", error);
    return null;
  }
}

/**
 * Save view mode preference
 */
export async function saveViewMode(mode: DataViewMode): Promise<void> {
  try {
    await AsyncStorage.setItem(StorageKeys.VIEW_MODE, mode);
  } catch (error) {
    console.error("Failed to save view mode:", error);
  }
}

/**
 * Load view mode preference
 */
export async function loadViewMode(): Promise<DataViewMode> {
  try {
    const mode = await AsyncStorage.getItem(StorageKeys.VIEW_MODE);
    return (mode as DataViewMode) || "list";
  } catch (error) {
    console.error("Failed to load view mode:", error);
    return "list";
  }
}

/**
 * Save filters for current table
 */
export async function saveFilters(
  tableName: string,
  filters: FilterExpression[],
): Promise<void> {
  try {
    const key = `${StorageKeys.FILTERS}:${tableName}`;
    if (filters.length === 0) {
      await AsyncStorage.removeItem(key);
    } else {
      await AsyncStorage.setItem(key, JSON.stringify(filters));
    }
  } catch (error) {
    console.error("Failed to save filters:", error);
  }
}

/**
 * Load filters for current table
 */
export async function loadFilters(
  tableName: string,
): Promise<FilterExpression[]> {
  try {
    const key = `${StorageKeys.FILTERS}:${tableName}`;
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : [];
  } catch (error) {
    console.error("Failed to load filters:", error);
    return [];
  }
}

/**
 * Save sort config for current table
 */
export async function saveSortConfig(
  tableName: string,
  sortConfig: SortConfig | null,
): Promise<void> {
  try {
    const key = `${StorageKeys.SORT_CONFIG}:${tableName}`;
    if (sortConfig === null) {
      await AsyncStorage.removeItem(key);
    } else {
      await AsyncStorage.setItem(key, JSON.stringify(sortConfig));
    }
  } catch (error) {
    console.error("Failed to save sort config:", error);
  }
}

/**
 * Load sort config for current table
 */
export async function loadSortConfig(
  tableName: string,
): Promise<SortConfig | null> {
  try {
    const key = `${StorageKeys.SORT_CONFIG}:${tableName}`;
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error("Failed to load sort config:", error);
    return null;
  }
}

/**
 * Cache documents for offline viewing
 */
export async function cacheDocuments(
  tableName: string,
  documents: TableDocument[],
): Promise<void> {
  try {
    const key = StorageKeys.cachedDocuments(tableName);
    const data = {
      documents,
      cachedAt: Date.now(),
    };
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to cache documents:", error);
  }
}

/**
 * Load cached documents
 */
export async function loadCachedDocuments(
  tableName: string,
  maxAgeMs: number = 3600000, // 1 hour default
): Promise<TableDocument[] | null> {
  try {
    const key = StorageKeys.cachedDocuments(tableName);
    const value = await AsyncStorage.getItem(key);

    if (!value) return null;

    const data = JSON.parse(value);
    const age = Date.now() - data.cachedAt;

    // Return null if cache is too old
    if (age > maxAgeMs) {
      await AsyncStorage.removeItem(key);
      return null;
    }

    return data.documents;
  } catch (error) {
    console.error("Failed to load cached documents:", error);
    return null;
  }
}

/**
 * Clear all cached documents
 */
export async function clearDocumentCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((key) =>
      key.startsWith(`${STORAGE_PREFIX}:cache:`),
    );
    await AsyncStorage.multiRemove(cacheKeys);
  } catch (error) {
    console.error("Failed to clear document cache:", error);
  }
}

/**
 * Clear all data browser storage
 */
export async function clearAllDataStorage(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const dataKeys = keys.filter((key) => key.startsWith(STORAGE_PREFIX));
    await AsyncStorage.multiRemove(dataKeys);
  } catch (error) {
    console.error("Failed to clear data storage:", error);
  }
}
