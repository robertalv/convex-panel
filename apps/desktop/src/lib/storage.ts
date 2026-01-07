/**
 * Desktop Storage Utilities
 * Local storage functions for the desktop app
 */

const STORAGE_PREFIX = "convex-panel";

/**
 * Save the active table to localStorage
 */
export function saveActiveTable(tableName: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(`${STORAGE_PREFIX}:active-table`, tableName);
  } catch (error) {
    console.error(`Error saving active table:`, error);
  }
}

/**
 * Get the active table from localStorage
 */
export function getActiveTable(): string {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    return localStorage.getItem(`${STORAGE_PREFIX}:active-table`) || "";
  } catch (error) {
    console.error(`Error getting active table:`, error);
    return "";
  }
}
