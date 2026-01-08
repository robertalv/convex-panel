/**
 * useSchemaDiff Hook
 * Orchestrates schema diff functionality including:
 * - Managing diff mode state
 * - Loading and saving snapshots
 * - Computing diffs between schema versions
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import type {
  SchemaJSON,
  SchemaSnapshot,
  SchemaDiff,
  DiffModeSettings,
  ParsedSchema,
} from "@convex-panel/shared";
import { diffSchemas, createSnapshot } from "../utils/schema-diff";
import {
  saveSnapshot,
  getAllSnapshots,
  pruneSnapshots,
  type StoredSnapshot,
} from "../utils/schema-storage";
import { parseSchema } from "../utils/schema-parser";

// Storage key for persisting diff mode settings
const DIFF_MODE_STORAGE_KEY = "convex-panel:schema-visualizer:diff-mode";

/**
 * Load persisted diff mode settings from localStorage
 */
function loadPersistedDiffMode(): DiffModeSettings | null {
  try {
    const stored = localStorage.getItem(DIFF_MODE_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate the parsed object has expected structure
      if (
        typeof parsed === "object" &&
        typeof parsed.enabled === "boolean" &&
        typeof parsed.viewMode === "string"
      ) {
        return parsed as DiffModeSettings;
      }
    }
  } catch (e) {
    console.warn("[useSchemaDiff] Failed to load persisted diff mode:", e);
  }
  return null;
}

/**
 * Save diff mode settings to localStorage
 */
function persistDiffMode(settings: DiffModeSettings): void {
  try {
    localStorage.setItem(DIFF_MODE_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn("[useSchemaDiff] Failed to persist diff mode:", e);
  }
}

export interface UseSchemaDiffOptions {
  /** Current deployed schema JSON */
  deployedSchema: SchemaJSON | null;
  /** Current parsed schema */
  parsedSchema: ParsedSchema | null;
  /** Deployment ID for grouping snapshots */
  deploymentId?: string;
  /** Local schema JSON (from schema.ts file) */
  localSchema?: SchemaJSON | null;
  /** Whether local schema is available */
  hasLocalSchema?: boolean;
}

export interface UseSchemaDiffReturn {
  /** Current diff mode settings */
  diffMode: DiffModeSettings;
  /** Update diff mode settings */
  setDiffMode: (settings: Partial<DiffModeSettings>) => void;
  /** Toggle diff mode on/off */
  toggleDiffMode: () => void;
  /** Available snapshots for comparison */
  snapshots: SnapshotInfo[];
  /** Current computed diff (null if no comparison selected) */
  diff: SchemaDiff | null;
  /** Whether the diff has any changes */
  hasChanges: boolean;
  /** Save current schema as a snapshot */
  saveCurrentSnapshot: (label?: string) => Promise<void>;
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Refresh snapshots from storage */
  refreshSnapshots: () => Promise<void>;
}

/** Simplified snapshot info for UI */
export interface SnapshotInfo {
  id: string;
  label: string;
  timestamp: number;
  source: "deployed" | "local" | "git" | "github";
}

const DEFAULT_DIFF_MODE: DiffModeSettings = {
  enabled: false,
  viewMode: "visual-overlay",
  fromSnapshotId: null,
  toSnapshotId: null,
  showOnlyChanges: false,
  filterStatus: "all",
};

export function useSchemaDiff({
  deployedSchema,
  parsedSchema,
  deploymentId,
  localSchema,
  hasLocalSchema = false,
}: UseSchemaDiffOptions): UseSchemaDiffReturn {
  // Initialize diff mode from localStorage or use default
  const [diffMode, setDiffModeState] = useState<DiffModeSettings>(() => {
    const persisted = loadPersistedDiffMode();
    return persisted ?? DEFAULT_DIFF_MODE;
  });
  const [storedSnapshots, setStoredSnapshots] = useState<StoredSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load snapshots from storage on mount
  const loadSnapshots = useCallback(async () => {
    try {
      setLoading(true);
      const snapshots = await getAllSnapshots();
      setStoredSnapshots(snapshots);
      setError(null);
    } catch (err) {
      console.error("Failed to load snapshots:", err);
      setError("Failed to load schema history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSnapshots();
  }, [loadSnapshots]);

  // Convert stored snapshots to UI-friendly format, including local schema if available
  const snapshots: SnapshotInfo[] = useMemo(() => {
    const result: SnapshotInfo[] = [];

    // Add local schema as first option if available
    if (hasLocalSchema && localSchema) {
      result.push({
        id: "__local__",
        label: "Local (schema.ts)",
        timestamp: Date.now(),
        source: "local",
      });
    }

    // Add stored snapshots
    result.push(
      ...storedSnapshots.map((s) => ({
        id: s.id,
        label: s.label,
        timestamp: s.timestamp,
        source: s.source,
      })),
    );

    return result;
  }, [storedSnapshots, hasLocalSchema, localSchema]);

  // Update diff mode settings and persist to localStorage
  const setDiffMode = useCallback((settings: Partial<DiffModeSettings>) => {
    setDiffModeState((prev) => {
      const newState = { ...prev, ...settings };
      persistDiffMode(newState);
      return newState;
    });
  }, []);

  // Toggle diff mode and persist
  const toggleDiffMode = useCallback(() => {
    setDiffModeState((prev) => {
      const newState = { ...prev, enabled: !prev.enabled };
      persistDiffMode(newState);
      return newState;
    });
  }, []);

  // Save current deployed schema as a snapshot
  const saveCurrentSnapshot = useCallback(
    async (label?: string) => {
      console.log("[useSchemaDiff] saveCurrentSnapshot called", {
        hasDeployedSchema: !!deployedSchema,
        deploymentId,
      });

      if (!deployedSchema) {
        console.error("[useSchemaDiff] No deployed schema available to save");
        setError("No deployed schema available to save");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const snapshotLabel =
          label || `Snapshot ${new Date().toLocaleString()}`;
        console.log(
          "[useSchemaDiff] Creating snapshot with label:",
          snapshotLabel,
        );

        const snapshot = createSnapshot(deployedSchema, {
          label: snapshotLabel,
          source: "deployed",
          deploymentId,
        });

        console.log("[useSchemaDiff] Snapshot created:", snapshot.id);

        await saveSnapshot(snapshot);
        console.log("[useSchemaDiff] Snapshot saved to IndexedDB");

        // Prune old snapshots to keep storage manageable
        await pruneSnapshots(20);

        // Refresh the list
        await loadSnapshots();
        console.log(
          "[useSchemaDiff] Snapshots refreshed, count:",
          storedSnapshots.length,
        );
      } catch (err) {
        console.error("[useSchemaDiff] Failed to save snapshot:", err);
        setError("Failed to save schema snapshot");
      } finally {
        setLoading(false);
      }
    },
    [deployedSchema, deploymentId, loadSnapshots, storedSnapshots.length],
  );

  // Compute the diff between selected versions
  const diff = useMemo((): SchemaDiff | null => {
    if (!diffMode.enabled || !diffMode.fromSnapshotId) {
      return null;
    }

    // Helper to find snapshot by ID or commitHash
    const findSnapshot = (snapshotId: string): StoredSnapshot | undefined => {
      // If ID starts with "github:", look up by commit hash
      if (snapshotId.startsWith("github:")) {
        const sha = snapshotId.replace("github:", "");
        return storedSnapshots.find((s) => s.commitHash === sha);
      }
      // Otherwise look up by ID
      return storedSnapshots.find((s) => s.id === snapshotId);
    };

    // Get the "from" snapshot
    let fromSnapshot: SchemaSnapshot;

    if (diffMode.fromSnapshotId === "__local__" && localSchema) {
      // Use local schema.ts as the "from" snapshot
      const localParsed = parseSchema(localSchema);
      fromSnapshot = {
        id: "__local__",
        label: "Local (schema.ts)",
        timestamp: Date.now(),
        schema: localParsed,
        rawSchema: localSchema,
        source: "local",
      };
    } else {
      // Get from stored snapshots
      const fromStored = findSnapshot(diffMode.fromSnapshotId);
      if (!fromStored) {
        return null;
      }

      // Parse the "from" schema
      const fromSchema = parseSchema(fromStored.rawSchema);
      fromSnapshot = {
        id: fromStored.id,
        label: fromStored.label,
        timestamp: fromStored.timestamp,
        schema: fromSchema,
        rawSchema: fromStored.rawSchema,
        source: fromStored.source,
        commitHash: fromStored.commitHash,
        commitMessage: fromStored.commitMessage,
        deploymentId: fromStored.deploymentId,
      };
    }

    // Get the "to" snapshot (current deployed, local, or selected snapshot)
    let toSnapshot: SchemaSnapshot;

    if (diffMode.toSnapshotId === "__local__" && localSchema) {
      // Compare to local schema.ts
      const localParsed = parseSchema(localSchema);
      toSnapshot = {
        id: "__local__",
        label: "Local (schema.ts)",
        timestamp: Date.now(),
        schema: localParsed,
        rawSchema: localSchema,
        source: "local",
      };
    } else if (!diffMode.toSnapshotId && deployedSchema && parsedSchema) {
      // Compare to current deployed schema
      toSnapshot = {
        id: "__current__",
        label: "Current (Deployed)",
        timestamp: Date.now(),
        schema: parsedSchema,
        rawSchema: deployedSchema,
        source: "deployed",
        deploymentId,
      };
    } else if (diffMode.toSnapshotId) {
      // Compare to a specific snapshot
      const toStored = findSnapshot(diffMode.toSnapshotId);
      if (!toStored) {
        return null;
      }
      const toSchema = parseSchema(toStored.rawSchema);
      toSnapshot = {
        id: toStored.id,
        label: toStored.label,
        timestamp: toStored.timestamp,
        schema: toSchema,
        rawSchema: toStored.rawSchema,
        source: toStored.source,
        commitHash: toStored.commitHash,
        commitMessage: toStored.commitMessage,
        deploymentId: toStored.deploymentId,
      };
    } else {
      return null;
    }

    // Compute the diff
    return diffSchemas(fromSnapshot, toSnapshot);
  }, [
    diffMode.enabled,
    diffMode.fromSnapshotId,
    diffMode.toSnapshotId,
    storedSnapshots,
    deployedSchema,
    parsedSchema,
    deploymentId,
    localSchema,
  ]);

  // Check if the diff has any changes
  const hasChanges = useMemo(() => {
    if (!diff) return false;
    const { summary } = diff;
    return (
      summary.tablesAdded > 0 ||
      summary.tablesRemoved > 0 ||
      summary.tablesModified > 0
    );
  }, [diff]);

  return {
    diffMode,
    setDiffMode,
    toggleDiffMode,
    snapshots,
    diff,
    hasChanges,
    saveCurrentSnapshot,
    loading,
    error,
    refreshSnapshots: loadSnapshots,
  };
}

export default useSchemaDiff;
