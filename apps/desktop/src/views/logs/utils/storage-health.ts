/**
 * Storage Health Utilities
 * Browser storage quota estimation and health monitoring
 */

import { formatBytes } from "./formatters";

/**
 * Storage estimate from navigator.storage.estimate()
 */
export interface StorageEstimate {
  /** Bytes currently used */
  usage: number;
  /** Maximum bytes available (quota) */
  quota: number;
  /** Percentage of quota used (0-100) */
  percentUsed: number;
  /** Bytes available */
  available: number;
  /** Whether storage is persisted (won't be evicted) */
  persisted: boolean;
}

/**
 * Storage health status based on usage percentage
 */
export type StorageHealthStatus =
  | "healthy"
  | "warning"
  | "critical"
  | "unknown";

/**
 * Storage health thresholds
 */
export const STORAGE_THRESHOLDS = {
  /** Warning threshold (percentage) */
  warning: 70,
  /** Critical threshold (percentage) */
  critical: 90,
} as const;

/**
 * Check if Storage Manager API is available
 */
export function isStorageManagerAvailable(): boolean {
  return (
    typeof navigator !== "undefined" &&
    "storage" in navigator &&
    "estimate" in navigator.storage
  );
}

/**
 * Get current storage estimate
 */
export async function getStorageEstimate(): Promise<StorageEstimate> {
  if (!isStorageManagerAvailable()) {
    console.warn("[storage-health] StorageManager API not available");
    return {
      usage: 0,
      quota: 0,
      percentUsed: 0,
      available: 0,
      persisted: false,
    };
  }

  try {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage ?? 0;
    const quota = estimate.quota ?? 0;
    const percentUsed = quota > 0 ? (usage / quota) * 100 : 0;
    const available = quota - usage;

    // Check if storage is persisted
    let persisted = false;
    if (navigator.storage.persisted) {
      persisted = await navigator.storage.persisted();
    }

    return {
      usage,
      quota,
      percentUsed,
      available,
      persisted,
    };
  } catch (error) {
    console.error("[storage-health] Failed to get storage estimate:", error);
    return {
      usage: 0,
      quota: 0,
      percentUsed: 0,
      available: 0,
      persisted: false,
    };
  }
}

/**
 * Get storage health status based on usage
 */
export function getStorageHealthStatus(
  percentUsed: number,
): StorageHealthStatus {
  if (percentUsed <= 0) return "unknown";
  if (percentUsed >= STORAGE_THRESHOLDS.critical) return "critical";
  if (percentUsed >= STORAGE_THRESHOLDS.warning) return "warning";
  return "healthy";
}

/**
 * Request persistent storage (prevents eviction under storage pressure)
 */
export async function requestPersistence(): Promise<boolean> {
  if (!isStorageManagerAvailable() || !navigator.storage.persist) {
    console.warn("[storage-health] Persistence API not available");
    return false;
  }

  try {
    const granted = await navigator.storage.persist();
    console.log(
      `[storage-health] Persistence ${granted ? "granted" : "denied"}`,
    );
    return granted;
  } catch (error) {
    console.error("[storage-health] Failed to request persistence:", error);
    return false;
  }
}

/**
 * Check if storage is currently persisted
 */
export async function isPersisted(): Promise<boolean> {
  if (!isStorageManagerAvailable() || !navigator.storage.persisted) {
    return false;
  }

  try {
    return await navigator.storage.persisted();
  } catch (error) {
    console.error("[storage-health] Failed to check persistence:", error);
    return false;
  }
}

/**
 * Get a human-readable storage summary
 */
export function getStorageSummary(estimate: StorageEstimate): string {
  const usedStr = formatBytes(estimate.usage);
  const quotaStr = formatBytes(estimate.quota);
  const percentStr = estimate.percentUsed.toFixed(1);

  return `${usedStr} / ${quotaStr} (${percentStr}%)`;
}

/**
 * Storage health info with all relevant data
 */
export interface StorageHealthInfo extends StorageEstimate {
  status: StorageHealthStatus;
  summary: string;
  statusColor: string;
}

/**
 * Get status color for UI
 */
export function getStatusColor(status: StorageHealthStatus): string {
  switch (status) {
    case "healthy":
      return "var(--color-success-base)";
    case "warning":
      return "var(--color-warning-base)";
    case "critical":
      return "var(--color-error-base)";
    case "unknown":
    default:
      return "var(--color-text-muted)";
  }
}

/**
 * Get complete storage health info
 */
export async function getStorageHealthInfo(): Promise<StorageHealthInfo> {
  const estimate = await getStorageEstimate();
  const status = getStorageHealthStatus(estimate.percentUsed);

  return {
    ...estimate,
    status,
    summary: getStorageSummary(estimate),
    statusColor: getStatusColor(status),
  };
}

/**
 * Estimated log storage limits
 * Based on typical deployments and IndexedDB performance
 */
export const LOG_STORAGE_LIMITS = {
  /** Recommended max logs per deployment */
  recommendedMaxLogs: 100_000,
  /** Absolute max logs before performance degrades */
  absoluteMaxLogs: 500_000,
  /** Recommended retention days */
  recommendedRetentionDays: 7,
  /** Max retention days */
  maxRetentionDays: 30,
  /** Estimated average log size in bytes */
  estimatedAvgLogSize: 2_000, // ~2KB per log entry
} as const;

/**
 * Estimate how many more logs can be stored
 */
export function estimateRemainingLogCapacity(
  availableBytes: number,
  currentLogCount: number,
  maxLogs: number = LOG_STORAGE_LIMITS.recommendedMaxLogs,
): number {
  // Calculate based on available space
  const spaceBasedCapacity = Math.floor(
    availableBytes / LOG_STORAGE_LIMITS.estimatedAvgLogSize,
  );

  // Calculate based on max log limit
  const limitBasedCapacity = maxLogs - currentLogCount;

  // Return the smaller of the two
  return Math.max(0, Math.min(spaceBasedCapacity, limitBasedCapacity));
}
