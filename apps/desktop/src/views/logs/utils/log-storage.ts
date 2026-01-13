/**
 * Log Storage Utilities
 * IndexedDB-based storage for persisting function execution logs
 * Allows viewing historical logs and exporting for analysis
 */

import type { LogEntry } from "../types";

const DB_NAME = "convex-logs";
const DB_VERSION = 1;
const LOGS_STORE = "logs";
const SETTINGS_STORE = "settings";

// Default configuration
const DEFAULT_MAX_LOGS_PER_DEPLOYMENT = 100_000;
const DEFAULT_RETENTION_DAYS = 7;

let dbInstance: IDBDatabase | null = null;

/**
 * Initialize the IndexedDB database
 */
async function getDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  console.log("[log-storage] Opening IndexedDB database:", DB_NAME);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("[log-storage] Failed to open database:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      console.log("[log-storage] Database opened successfully");
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      console.log("[log-storage] Database upgrade needed, creating stores...");
      const db = (event.target as IDBOpenDBRequest).result;

      // Create logs store
      if (!db.objectStoreNames.contains(LOGS_STORE)) {
        console.log("[log-storage] Creating logs store");
        const logsStore = db.createObjectStore(LOGS_STORE, {
          keyPath: "id",
        });
        // Index by timestamp for sorting and range queries
        logsStore.createIndex("timestamp", "timestamp", { unique: false });
        // Index by deploymentId for deployment-specific queries
        logsStore.createIndex("deploymentId", "deploymentId", {
          unique: false,
        });
        // Compound index for deployment + timestamp (most common query)
        logsStore.createIndex(
          "deploymentId_timestamp",
          ["deploymentId", "timestamp"],
          {
            unique: false,
          },
        );
        // Index by function identifier for filtering
        logsStore.createIndex("functionIdentifier", "functionIdentifier", {
          unique: false,
        });
        // Index by success for filtering failures
        logsStore.createIndex("success", "success", { unique: false });
      }

      // Create settings store for log retention preferences
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        console.log("[log-storage] Creating settings store");
        db.createObjectStore(SETTINGS_STORE, { keyPath: "key" });
      }
    };
  });
}

/**
 * Stored log entry (extends LogEntry with storage metadata)
 */
export interface StoredLogEntry extends LogEntry {
  deploymentId: string;
  storedAt: number;
}

/**
 * Convert a LogEntry to storable format
 */
function toStoredLog(log: LogEntry, deploymentId: string): StoredLogEntry {
  // Deep clone to ensure serializable
  const cloneable = JSON.parse(JSON.stringify(log));
  return {
    ...cloneable,
    deploymentId,
    storedAt: Date.now(),
  };
}

/**
 * Save a single log entry to IndexedDB
 */
export async function saveLog(
  log: LogEntry,
  deploymentId: string,
): Promise<void> {
  const db = await getDB();
  const stored = toStoredLog(log, deploymentId);

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(LOGS_STORE, "readwrite");
    const store = transaction.objectStore(LOGS_STORE);

    try {
      const request = store.put(stored);

      request.onerror = () => {
        console.error("[log-storage] Failed to save log:", request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve();
      };
    } catch (err) {
      console.error("[log-storage] Error during put operation:", err);
      reject(err);
    }
  });
}

/**
 * Save multiple log entries to IndexedDB (batch operation)
 */
export async function saveLogs(
  logs: LogEntry[],
  deploymentId: string,
): Promise<void> {
  if (logs.length === 0) return;

  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(LOGS_STORE, "readwrite");
    const store = transaction.objectStore(LOGS_STORE);

    let completed = 0;
    let hadError = false;

    for (const log of logs) {
      const stored = toStoredLog(log, deploymentId);
      const request = store.put(stored);

      request.onerror = () => {
        if (!hadError) {
          hadError = true;
          console.error("[log-storage] Failed to save log:", request.error);
          reject(request.error);
        }
      };

      request.onsuccess = () => {
        completed++;
        if (completed === logs.length && !hadError) {
          console.log(
            `[log-storage] Saved ${logs.length} logs for deployment ${deploymentId}`,
          );
          resolve();
        }
      };
    }
  });
}

/**
 * Get a log by ID
 */
export async function getLog(id: string): Promise<StoredLogEntry | null> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(LOGS_STORE, "readonly");
    const store = transaction.objectStore(LOGS_STORE);
    const request = store.get(id);

    request.onerror = () => {
      console.error("[log-storage] Failed to get log:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result || null);
    };
  });
}

/**
 * Query options for getLogs
 */
export interface LogQueryOptions {
  deploymentId?: string;
  limit?: number;
  offset?: number;
  startTime?: number;
  endTime?: number;
  functionIdentifier?: string;
  success?: boolean;
  order?: "asc" | "desc";
}

/**
 * Get logs with optional filtering
 */
export async function getLogs(
  options: LogQueryOptions = {},
): Promise<StoredLogEntry[]> {
  const db = await getDB();
  const {
    deploymentId,
    limit = 500,
    offset = 0,
    startTime,
    endTime,
    functionIdentifier,
    success,
    order = "desc",
  } = options;

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(LOGS_STORE, "readonly");
    const store = transaction.objectStore(LOGS_STORE);

    let request: IDBRequest<StoredLogEntry[]>;

    // Use appropriate index based on query
    if (deploymentId && startTime !== undefined && endTime !== undefined) {
      // Use compound index for deployment + time range
      const index = store.index("deploymentId_timestamp");
      const range = IDBKeyRange.bound(
        [deploymentId, startTime],
        [deploymentId, endTime],
      );
      request = index.getAll(range);
    } else if (deploymentId) {
      // Filter by deployment only
      const index = store.index("deploymentId");
      request = index.getAll(deploymentId);
    } else if (functionIdentifier) {
      // Filter by function
      const index = store.index("functionIdentifier");
      request = index.getAll(functionIdentifier);
    } else {
      // Get all logs
      request = store.getAll();
    }

    request.onerror = () => {
      console.error("[log-storage] Failed to get logs:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      let results = request.result || [];

      // Apply additional filters in memory
      if (success !== undefined) {
        results = results.filter((log) => log.success === success);
      }
      if (functionIdentifier && !options.functionIdentifier) {
        results = results.filter(
          (log) => log.functionIdentifier === functionIdentifier,
        );
      }
      if (startTime !== undefined && !deploymentId) {
        results = results.filter((log) => log.timestamp >= startTime);
      }
      if (endTime !== undefined && !deploymentId) {
        results = results.filter((log) => log.timestamp <= endTime);
      }

      // Sort by timestamp
      results.sort((a, b) => {
        const diff = b.timestamp - a.timestamp;
        return order === "desc" ? diff : -diff;
      });

      // Apply offset (pagination)
      if (offset > 0 && results.length > offset) {
        results = results.slice(offset);
      } else if (offset > 0) {
        // Offset beyond available results
        results = [];
      }

      // Apply limit
      if (limit && results.length > limit) {
        results = results.slice(0, limit);
      }

      console.log(
        `[log-storage] Retrieved ${results.length} logs (offset: ${offset}, limit: ${limit})`,
      );
      resolve(results);
    };
  });
}

/**
 * Get logs for a specific deployment
 */
export async function getLogsForDeployment(
  deploymentId: string,
  options: Omit<LogQueryOptions, "deploymentId"> = {},
): Promise<StoredLogEntry[]> {
  return getLogs({ ...options, deploymentId });
}

/**
 * Delete a log by ID
 */
export async function deleteLog(id: string): Promise<void> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(LOGS_STORE, "readwrite");
    const store = transaction.objectStore(LOGS_STORE);
    const request = store.delete(id);

    request.onerror = () => {
      console.error("[log-storage] Failed to delete log:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve();
    };
  });
}

/**
 * Delete all logs for a deployment
 */
export async function deleteLogsForDeployment(
  deploymentId: string,
): Promise<number> {
  const logs = await getLogsForDeployment(deploymentId, { limit: undefined });

  for (const log of logs) {
    await deleteLog(log.id);
  }

  console.log(
    `[log-storage] Deleted ${logs.length} logs for deployment ${deploymentId}`,
  );
  return logs.length;
}

/**
 * Prune old logs based on retention policy
 */
export async function pruneLogs(
  options: {
    maxLogsPerDeployment?: number;
    retentionDays?: number;
  } = {},
): Promise<number> {
  const {
    maxLogsPerDeployment = DEFAULT_MAX_LOGS_PER_DEPLOYMENT,
    retentionDays = DEFAULT_RETENTION_DAYS,
  } = options;

  let deletedCount = 0;

  // Get all logs grouped by deployment
  const allLogs = await getLogs({ limit: undefined });
  const logsByDeployment = new Map<string, StoredLogEntry[]>();

  for (const log of allLogs) {
    const existing = logsByDeployment.get(log.deploymentId) || [];
    existing.push(log);
    logsByDeployment.set(log.deploymentId, existing);
  }

  const cutoffTime = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

  for (const [deploymentId, logs] of logsByDeployment.entries()) {
    // Sort by timestamp descending (newest first)
    logs.sort((a, b) => b.timestamp - a.timestamp);

    const toDelete: StoredLogEntry[] = [];

    // Delete logs beyond the max count
    if (logs.length > maxLogsPerDeployment) {
      toDelete.push(...logs.slice(maxLogsPerDeployment));
    }

    // Delete logs older than retention period
    for (const log of logs) {
      if (log.timestamp < cutoffTime && !toDelete.includes(log)) {
        toDelete.push(log);
      }
    }

    // Perform deletion
    for (const log of toDelete) {
      await deleteLog(log.id);
      deletedCount++;
    }

    if (toDelete.length > 0) {
      console.log(
        `[log-storage] Pruned ${toDelete.length} logs for deployment ${deploymentId}`,
      );
    }
  }

  console.log(`[log-storage] Total pruned: ${deletedCount} logs`);
  return deletedCount;
}

/**
 * Get storage statistics
 */
export async function getStorageStats(): Promise<{
  totalLogs: number;
  logsByDeployment: Map<string, number>;
  oldestLog: number | null;
  newestLog: number | null;
  estimatedSizeBytes: number;
}> {
  const allLogs = await getLogs({ limit: undefined });
  const logsByDeployment = new Map<string, number>();

  let oldestLog: number | null = null;
  let newestLog: number | null = null;

  for (const log of allLogs) {
    // Count by deployment
    const count = logsByDeployment.get(log.deploymentId) || 0;
    logsByDeployment.set(log.deploymentId, count + 1);

    // Track oldest/newest
    if (oldestLog === null || log.timestamp < oldestLog) {
      oldestLog = log.timestamp;
    }
    if (newestLog === null || log.timestamp > newestLog) {
      newestLog = log.timestamp;
    }
  }

  // Rough estimate of storage size (JSON serialized)
  const estimatedSizeBytes = allLogs.reduce((acc, log) => {
    return acc + JSON.stringify(log).length;
  }, 0);

  return {
    totalLogs: allLogs.length,
    logsByDeployment,
    oldestLog,
    newestLog,
    estimatedSizeBytes,
  };
}

// ============================================================================
// Settings Storage
// ============================================================================

export interface LogStorageSettings {
  enabled: boolean;
  maxLogsPerDeployment: number;
  retentionDays: number;
  autoPrune: boolean;
}

const DEFAULT_SETTINGS: LogStorageSettings = {
  enabled: false,
  maxLogsPerDeployment: DEFAULT_MAX_LOGS_PER_DEPLOYMENT,
  retentionDays: DEFAULT_RETENTION_DAYS,
  autoPrune: true,
};

/**
 * Save log storage settings
 */
export async function saveSettings(
  settings: LogStorageSettings,
): Promise<void> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SETTINGS_STORE, "readwrite");
    const store = transaction.objectStore(SETTINGS_STORE);
    const request = store.put({ key: "logStorageSettings", ...settings });

    request.onerror = () => {
      console.error("[log-storage] Failed to save settings:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      console.log("[log-storage] Settings saved");
      resolve();
    };
  });
}

/**
 * Load log storage settings
 */
export async function loadSettings(): Promise<LogStorageSettings> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SETTINGS_STORE, "readonly");
    const store = transaction.objectStore(SETTINGS_STORE);
    const request = store.get("logStorageSettings");

    request.onerror = () => {
      console.error("[log-storage] Failed to load settings:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      if (request.result) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { key, ...settings } = request.result;
        resolve({ ...DEFAULT_SETTINGS, ...settings });
      } else {
        resolve(DEFAULT_SETTINGS);
      }
    };
  });
}

/**
 * Clear all logs (for testing/debugging)
 */
export async function clearAllLogs(): Promise<void> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(LOGS_STORE, "readwrite");
    const store = transaction.objectStore(LOGS_STORE);
    const request = store.clear();

    request.onerror = () => {
      console.error("[log-storage] Failed to clear logs:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      console.log("[log-storage] All logs cleared");
      resolve();
    };
  });
}

/**
 * Check if a log already exists (for deduplication)
 */
export async function logExists(id: string): Promise<boolean> {
  const log = await getLog(id);
  return log !== null;
}

/**
 * Save logs with deduplication
 */
export async function saveLogsDedup(
  logs: LogEntry[],
  deploymentId: string,
): Promise<number> {
  if (logs.length === 0) return 0;

  // Get existing IDs for this batch
  const existingIds = new Set<string>();
  for (const log of logs) {
    if (await logExists(log.id)) {
      existingIds.add(log.id);
    }
  }

  // Filter out duplicates
  const newLogs = logs.filter((log) => !existingIds.has(log.id));

  if (newLogs.length > 0) {
    await saveLogs(newLogs, deploymentId);
  }

  console.log(
    `[log-storage] Saved ${newLogs.length} new logs (${existingIds.size} duplicates skipped)`,
  );
  return newLogs.length;
}
