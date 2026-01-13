/**
 * useLogStorage Hook
 * React hook for managing log persistence with IndexedDB
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type { LogEntry } from "../types";
import {
  saveLogsDedup,
  getLogsForDeployment,
  clearAllLogs,
  pruneLogs,
  loadSettings,
  saveSettings,
  getStorageStats,
  deleteLogsForDeployment,
  type LogStorageSettings,
  type LogQueryOptions,
  type StoredLogEntry,
} from "../utils/log-storage";

export interface UseLogStorageOptions {
  /** Deployment ID for filtering logs */
  deploymentId: string;
  /** Whether storage is enabled */
  enabled?: boolean;
  /** Auto-prune old logs on mount */
  autoPrune?: boolean;
}

export interface UseLogStorageReturn {
  /** Whether storage is enabled */
  isEnabled: boolean;
  /** Toggle storage on/off */
  setEnabled: (enabled: boolean) => void;
  /** Storage settings */
  settings: LogStorageSettings | null;
  /** Update storage settings */
  updateSettings: (settings: Partial<LogStorageSettings>) => Promise<void>;
  /** Save logs to storage */
  persistLogs: (logs: LogEntry[]) => Promise<number>;
  /** Load logs from storage */
  loadLogs: (
    options?: Omit<LogQueryOptions, "deploymentId">,
  ) => Promise<StoredLogEntry[]>;
  /** Clear all stored logs */
  clearStoredLogs: () => Promise<void>;
  /** Clear logs for current deployment only */
  clearDeploymentLogs: () => Promise<void>;
  /** Storage statistics */
  stats: {
    totalLogs: number;
    deploymentLogs: number;
    oldestLog: Date | null;
    newestLog: Date | null;
    estimatedSizeMB: number;
  } | null;
  /** Refresh statistics */
  refreshStats: () => Promise<void>;
  /** Whether an operation is in progress */
  isLoading: boolean;
  /** Last error */
  error: Error | null;
}

export function useLogStorage({
  deploymentId,
  enabled: initialEnabled = false,
  autoPrune = true,
}: UseLogStorageOptions): UseLogStorageReturn {
  const [isEnabled, setIsEnabledState] = useState(initialEnabled);
  const [settings, setSettings] = useState<LogStorageSettings | null>(null);
  const [stats, setStats] = useState<UseLogStorageReturn["stats"]>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Track if we've initialized
  const initializedRef = useRef(false);

  // Load settings on mount
  useEffect(() => {
    async function init() {
      if (initializedRef.current) return;
      initializedRef.current = true;

      try {
        setIsLoading(true);
        const loadedSettings = await loadSettings();
        setSettings(loadedSettings);
        setIsEnabledState(loadedSettings.enabled);

        // Auto-prune if enabled
        if (autoPrune && loadedSettings.autoPrune) {
          await pruneLogs({
            maxLogsPerDeployment: loadedSettings.maxLogsPerDeployment,
            retentionDays: loadedSettings.retentionDays,
          });
        }

        // Load initial stats
        await refreshStatsInternal();
      } catch (err) {
        console.error("[useLogStorage] Failed to initialize:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    }

    init();
  }, [autoPrune]);

  // Internal stats refresh
  const refreshStatsInternal = async () => {
    try {
      const storageStats = await getStorageStats();
      const deploymentCount =
        storageStats.logsByDeployment.get(deploymentId) || 0;

      setStats({
        totalLogs: storageStats.totalLogs,
        deploymentLogs: deploymentCount,
        oldestLog: storageStats.oldestLog
          ? new Date(storageStats.oldestLog)
          : null,
        newestLog: storageStats.newestLog
          ? new Date(storageStats.newestLog)
          : null,
        estimatedSizeMB: storageStats.estimatedSizeBytes / (1024 * 1024),
      });
    } catch (err) {
      console.error("[useLogStorage] Failed to get stats:", err);
    }
  };

  // Toggle enabled state
  const setEnabled = useCallback(
    async (enabled: boolean) => {
      try {
        setIsEnabledState(enabled);
        const currentSettings = settings || {
          enabled: false,
          maxLogsPerDeployment: 100000,
          retentionDays: 7,
          autoPrune: true,
        };
        const newSettings = { ...currentSettings, enabled };
        await saveSettings(newSettings);
        setSettings(newSettings);
      } catch (err) {
        console.error("[useLogStorage] Failed to update enabled state:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [settings],
  );

  // Update settings
  const updateSettings = useCallback(
    async (updates: Partial<LogStorageSettings>) => {
      try {
        const currentSettings = settings || {
          enabled: false,
          maxLogsPerDeployment: 100000,
          retentionDays: 7,
          autoPrune: true,
        };
        const newSettings = { ...currentSettings, ...updates };
        await saveSettings(newSettings);
        setSettings(newSettings);
        setIsEnabledState(newSettings.enabled);
      } catch (err) {
        console.error("[useLogStorage] Failed to update settings:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      }
    },
    [settings],
  );

  // Persist logs to storage
  const persistLogs = useCallback(
    async (logs: LogEntry[]): Promise<number> => {
      if (!isEnabled || logs.length === 0) return 0;

      try {
        setIsLoading(true);
        const count = await saveLogsDedup(logs, deploymentId);
        await refreshStatsInternal();
        return count;
      } catch (err) {
        console.error("[useLogStorage] Failed to persist logs:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        return 0;
      } finally {
        setIsLoading(false);
      }
    },
    [isEnabled, deploymentId],
  );

  // Load logs from storage
  const loadLogs = useCallback(
    async (
      options: Omit<LogQueryOptions, "deploymentId"> = {},
    ): Promise<StoredLogEntry[]> => {
      try {
        setIsLoading(true);
        setError(null);
        return await getLogsForDeployment(deploymentId, options);
      } catch (err) {
        console.error("[useLogStorage] Failed to load logs:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [deploymentId],
  );

  // Clear all stored logs
  const clearStoredLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      await clearAllLogs();
      await refreshStatsInternal();
    } catch (err) {
      console.error("[useLogStorage] Failed to clear logs:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clear logs for current deployment
  const clearDeploymentLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      await deleteLogsForDeployment(deploymentId);
      await refreshStatsInternal();
    } catch (err) {
      console.error("[useLogStorage] Failed to clear deployment logs:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [deploymentId]);

  // Refresh stats
  const refreshStats = useCallback(async () => {
    await refreshStatsInternal();
  }, []);

  return {
    isEnabled,
    setEnabled,
    settings,
    updateSettings,
    persistLogs,
    loadLogs,
    clearStoredLogs,
    clearDeploymentLogs,
    stats,
    refreshStats,
    isLoading,
    error,
  };
}

export default useLogStorage;
