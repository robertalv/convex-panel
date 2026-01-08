/**
 * Schema Storage Utilities
 * IndexedDB-based storage for schema snapshots and diff history
 */

import type { SchemaSnapshot, SchemaJSON } from "@convex-panel/shared";

const DB_NAME = "convex-schema-visualizer";
const DB_VERSION = 1;
const SNAPSHOTS_STORE = "snapshots";
const SETTINGS_STORE = "settings";

let dbInstance: IDBDatabase | null = null;

/**
 * Initialize the IndexedDB database
 */
async function getDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  console.log("[schema-storage] Opening IndexedDB database:", DB_NAME);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("[schema-storage] Failed to open database:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      console.log("[schema-storage] Database opened successfully");
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      console.log(
        "[schema-storage] Database upgrade needed, creating stores...",
      );
      const db = (event.target as IDBOpenDBRequest).result;

      // Create snapshots store
      if (!db.objectStoreNames.contains(SNAPSHOTS_STORE)) {
        console.log("[schema-storage] Creating snapshots store");
        const snapshotsStore = db.createObjectStore(SNAPSHOTS_STORE, {
          keyPath: "id",
        });
        // Index by timestamp for sorting
        snapshotsStore.createIndex("timestamp", "timestamp", { unique: false });
        // Index by source for filtering
        snapshotsStore.createIndex("source", "source", { unique: false });
        // Index by deploymentId for deployment-specific queries
        snapshotsStore.createIndex("deploymentId", "deploymentId", {
          unique: false,
        });
      }

      // Create settings store for diff mode preferences
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        console.log("[schema-storage] Creating settings store");
        db.createObjectStore(SETTINGS_STORE, { keyPath: "key" });
      }
    };
  });
}

/**
 * Serializable version of SchemaSnapshot for IndexedDB storage
 * (Map needs to be converted to array for storage)
 */
export interface StoredSnapshot {
  id: string;
  label: string;
  timestamp: number;
  rawSchema: SchemaJSON;
  source: "deployed" | "local" | "git" | "github";
  commitHash?: string;
  commitMessage?: string;
  deploymentId?: string;
}

/**
 * Convert a SchemaSnapshot to storable format
 * Uses JSON.parse(JSON.stringify()) to ensure deep cloning and remove non-cloneable objects
 */
function toStoredSnapshot(snapshot: SchemaSnapshot): StoredSnapshot {
  // Deep clone the rawSchema to ensure it's fully serializable
  // This removes any non-cloneable properties like functions, symbols, etc.
  const cloneableRawSchema = JSON.parse(JSON.stringify(snapshot.rawSchema));

  return {
    id: snapshot.id,
    label: snapshot.label,
    timestamp: snapshot.timestamp,
    rawSchema: cloneableRawSchema,
    source: snapshot.source,
    commitHash: snapshot.commitHash,
    commitMessage: snapshot.commitMessage,
    deploymentId: snapshot.deploymentId,
  };
}

/**
 * Save a schema snapshot to IndexedDB
 */
export async function saveSnapshot(snapshot: SchemaSnapshot): Promise<void> {
  const db = await getDB();

  let stored: StoredSnapshot;
  try {
    stored = toStoredSnapshot(snapshot);
    console.log(
      "[schema-storage] Converted snapshot to storable format:",
      stored.id,
    );
  } catch (err) {
    console.error("[schema-storage] Failed to convert snapshot:", err);
    throw new Error(`Failed to prepare snapshot for storage: ${err}`);
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SNAPSHOTS_STORE, "readwrite");
    const store = transaction.objectStore(SNAPSHOTS_STORE);

    try {
      const request = store.put(stored);

      request.onerror = () => {
        console.error(
          "[schema-storage] Failed to save snapshot:",
          request.error,
        );
        reject(request.error);
      };

      request.onsuccess = () => {
        console.log("[schema-storage] Snapshot saved successfully:", stored.id);
        resolve();
      };
    } catch (err) {
      console.error("[schema-storage] Error during put operation:", err);
      reject(err);
    }
  });
}

/**
 * Get a snapshot by ID
 * Note: Returns StoredSnapshot, caller must parse with createSnapshot() if full SchemaSnapshot needed
 */
export async function getSnapshot(id: string): Promise<StoredSnapshot | null> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SNAPSHOTS_STORE, "readonly");
    const store = transaction.objectStore(SNAPSHOTS_STORE);
    const request = store.get(id);

    request.onerror = () => {
      console.error("Failed to get snapshot:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result || null);
    };
  });
}

/**
 * Get all snapshots, optionally filtered by source
 */
export async function getAllSnapshots(
  source?: "deployed" | "local" | "git" | "github",
): Promise<StoredSnapshot[]> {
  const db = await getDB();
  console.log(
    "[schema-storage] Getting all snapshots, source filter:",
    source || "none",
  );

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SNAPSHOTS_STORE, "readonly");
    const store = transaction.objectStore(SNAPSHOTS_STORE);

    let request: IDBRequest<StoredSnapshot[]>;

    if (source) {
      const index = store.index("source");
      request = index.getAll(source);
    } else {
      request = store.getAll();
    }

    request.onerror = () => {
      console.error("[schema-storage] Failed to get snapshots:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      // Sort by timestamp descending (newest first)
      const snapshots = request.result || [];
      snapshots.sort((a, b) => b.timestamp - a.timestamp);
      console.log("[schema-storage] Retrieved snapshots:", snapshots.length);
      if (snapshots.length > 0) {
        console.log(
          "[schema-storage] First snapshot:",
          snapshots[0].id,
          snapshots[0].label,
        );
      }
      resolve(snapshots);
    };
  });
}

/**
 * Get snapshots for a specific deployment
 */
export async function getSnapshotsForDeployment(
  deploymentId: string,
): Promise<StoredSnapshot[]> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SNAPSHOTS_STORE, "readonly");
    const store = transaction.objectStore(SNAPSHOTS_STORE);
    const index = store.index("deploymentId");
    const request = index.getAll(deploymentId);

    request.onerror = () => {
      console.error("Failed to get deployment snapshots:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      const snapshots = request.result || [];
      snapshots.sort((a, b) => b.timestamp - a.timestamp);
      resolve(snapshots);
    };
  });
}

/**
 * Delete a snapshot by ID
 */
export async function deleteSnapshot(id: string): Promise<void> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SNAPSHOTS_STORE, "readwrite");
    const store = transaction.objectStore(SNAPSHOTS_STORE);
    const request = store.delete(id);

    request.onerror = () => {
      console.error("Failed to delete snapshot:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve();
    };
  });
}

/**
 * Delete old snapshots, keeping only the most recent N per source
 */
export async function pruneSnapshots(
  keepPerSource: number = 10,
): Promise<number> {
  const sources: Array<"deployed" | "local" | "git"> = [
    "deployed",
    "local",
    "git",
  ];
  let deletedCount = 0;

  for (const source of sources) {
    const snapshots = await getAllSnapshots(source);

    if (snapshots.length > keepPerSource) {
      const toDelete = snapshots.slice(keepPerSource);

      for (const snapshot of toDelete) {
        await deleteSnapshot(snapshot.id);
        deletedCount++;
      }
    }
  }

  return deletedCount;
}

/**
 * Get the most recent snapshot for a source
 */
export async function getLatestSnapshot(
  source: "deployed" | "local" | "git",
): Promise<StoredSnapshot | null> {
  const snapshots = await getAllSnapshots(source);
  return snapshots.length > 0 ? snapshots[0] : null;
}

/**
 * Check if a snapshot with similar content already exists
 * (to avoid storing duplicate snapshots)
 */
export async function findSimilarSnapshot(
  rawSchema: SchemaJSON,
  source: "deployed" | "local" | "git",
): Promise<StoredSnapshot | null> {
  const snapshots = await getAllSnapshots(source);
  const schemaHash = hashSchema(rawSchema);

  for (const snapshot of snapshots) {
    if (hashSchema(snapshot.rawSchema) === schemaHash) {
      return snapshot;
    }
  }

  return null;
}

/**
 * Simple hash function for schema comparison
 */
function hashSchema(schema: SchemaJSON): string {
  // Create a deterministic string representation
  const tableNames = schema.tables
    .map((t) => t.tableName)
    .sort()
    .join(",");

  const tableDetails = schema.tables
    .map((t) => {
      const indexNames = t.indexes
        .map((i) => i.indexDescriptor)
        .sort()
        .join(";");
      const searchNames = t.searchIndexes
        .map((i) => i.indexDescriptor)
        .sort()
        .join(";");
      const docType = t.documentType ? JSON.stringify(t.documentType) : "null";
      return `${t.tableName}:${indexNames}:${searchNames}:${docType}`;
    })
    .sort()
    .join("|");

  // Simple hash - in production you might use a proper hash function
  let hash = 0;
  const str = `${tableNames}|${tableDetails}|${schema.schemaValidation}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}

// ============================================================================
// Settings Storage
// ============================================================================

interface DiffModeSettings {
  key: "diffModeSettings";
  enabled: boolean;
  viewMode: "side-by-side" | "unified" | "visual-overlay";
  fromSnapshotId: string | null;
  toSnapshotId: string | null;
  showOnlyChanges: boolean;
  filterStatus: "added" | "removed" | "modified" | "unchanged" | "all";
}

/**
 * Save diff mode settings
 */
export async function saveDiffModeSettings(
  settings: Omit<DiffModeSettings, "key">,
): Promise<void> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SETTINGS_STORE, "readwrite");
    const store = transaction.objectStore(SETTINGS_STORE);
    const request = store.put({ key: "diffModeSettings", ...settings });

    request.onerror = () => {
      console.error("Failed to save diff mode settings:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve();
    };
  });
}

/**
 * Load diff mode settings
 */
export async function loadDiffModeSettings(): Promise<Omit<
  DiffModeSettings,
  "key"
> | null> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SETTINGS_STORE, "readonly");
    const store = transaction.objectStore(SETTINGS_STORE);
    const request = store.get("diffModeSettings");

    request.onerror = () => {
      console.error("Failed to load diff mode settings:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      if (request.result) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { key, ...settings } = request.result;
        resolve(settings);
      } else {
        resolve(null);
      }
    };
  });
}

/**
 * Clear all data (for testing/debugging)
 */
export async function clearAllData(): Promise<void> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      [SNAPSHOTS_STORE, SETTINGS_STORE],
      "readwrite",
    );

    transaction.objectStore(SNAPSHOTS_STORE).clear();
    transaction.objectStore(SETTINGS_STORE).clear();

    transaction.oncomplete = () => {
      resolve();
    };

    transaction.onerror = () => {
      reject(transaction.error);
    };
  });
}

/**
 * Get storage statistics
 */
export async function getStorageStats(): Promise<{
  snapshotCount: number;
  deployedCount: number;
  localCount: number;
  gitCount: number;
}> {
  const all = await getAllSnapshots();
  const deployed = all.filter((s) => s.source === "deployed");
  const local = all.filter((s) => s.source === "local");
  const git = all.filter((s) => s.source === "git");

  return {
    snapshotCount: all.length,
    deployedCount: deployed.length,
    localCount: local.length,
    gitCount: git.length,
  };
}
