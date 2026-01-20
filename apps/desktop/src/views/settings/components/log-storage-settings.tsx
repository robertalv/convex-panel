/**
 * Log Storage Settings Component
 * Settings page section for managing SQLite log persistence and storage
 */

import React, { useState, useEffect } from "react";
import {
  Database,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Zap,
  FileText,
  Activity,
} from "lucide-react";
import { useLocalLogStore } from "../../logs/hooks/useLocalLogStore";
import {
  exportLogsToFile,
  type ExportFormat,
} from "../../logs/utils/log-export";
import { toast } from "sonner";
import { formatBytes } from "../../logs/utils/formatters";

// ============================================================================
// UI Components
// ============================================================================

const Toggle = ({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (c: boolean) => void;
  disabled?: boolean;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => !disabled && onChange(!checked)}
    disabled={disabled}
    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
      checked ? "bg-brand-base" : "bg-surface-overlay"
    } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
  >
    <span
      aria-hidden="true"
      className={`pointer-events-none ml-0.5 mt-0.5 inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
        checked ? "translate-x-4" : "translate-x-0"
      }`}
    />
  </button>
);

const SettingCard = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`overflow-hidden rounded-xl border border-border-base bg-surface-base ${className}`}
  >
    {children}
  </div>
);

const SettingRow = ({
  label,
  description,
  children,
  border = true,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
  border?: boolean;
}) => (
  <div
    className={`flex items-center justify-between gap-4 p-4 transition-colors hover:bg-surface-overlay/50 ${
      border ? "border-b border-border-base" : ""
    }`}
  >
    <div className="flex-1">
      <div className="text-sm font-medium text-text-base">{label}</div>
      {description && (
        <div className="m-0 mt-1 max-w-xl text-xs text-text-muted">
          {description}
        </div>
      )}
    </div>
    <div className="flex-shrink-0">{children}</div>
  </div>
);

// ============================================================================
// Main Component
// ============================================================================

export function LogStorageSettings() {
  const {
    settings,
    stats,
    updateSettings,
    refreshStats,
    queryLogs,
    clearLogs,
    deleteOlderThan,
    optimizeDb,
    isLoading: hookIsLoading,
  } = useLocalLogStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isPruning, setIsPruning] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Load settings and stats on mount
  useEffect(() => {
    setIsLoading(hookIsLoading);
  }, [hookIsLoading]);

  const handleSettingChange = async (
    key: "enabled" | "retention_days",
    value: boolean | number,
  ) => {
    if (!settings) return;
    try {
      setIsSaving(true);
      await updateSettings({ [key]: value });
      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("[LogStorageSettings] Failed to save:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearAllLogs = async () => {
    if (
      !confirm(
        "Are you sure you want to delete all stored logs? This cannot be undone.",
      )
    )
      return;
    try {
      setIsClearing(true);
      await clearLogs();
      await refreshStats();
      toast.success("All logs cleared successfully");
    } catch (error) {
      console.error("[LogStorageSettings] Failed to clear logs:", error);
      toast.error("Failed to clear logs");
    } finally {
      setIsClearing(false);
    }
  };

  const handlePruneLogs = async () => {
    if (!settings) return;
    try {
      setIsPruning(true);
      await deleteOlderThan(settings.retention_days);
      await refreshStats();
      toast.success("Old logs pruned successfully");
    } catch (error) {
      console.error("[LogStorageSettings] Failed to prune logs:", error);
      toast.error("Failed to prune logs");
    } finally {
      setIsPruning(false);
    }
  };

  const handleOptimizeDb = async () => {
    try {
      setIsOptimizing(true);
      await optimizeDb();
      toast.success("Database optimized successfully");
    } catch (error) {
      console.error("[LogStorageSettings] Failed to optimize DB:", error);
      toast.error("Failed to optimize database");
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleExportLogs = async (format: ExportFormat) => {
    try {
      setIsExporting(true);
      const result = await queryLogs({}, undefined, undefined);
      if (result.logs.length === 0) {
        toast.info("No logs available to export");
        return;
      }

      const logsForExport = result.logs.map((log) => {
        let parsed: any = {};
        try {
          parsed = JSON.parse(log.json_blob);
        } catch (e) {
          /* ignore */
        }
        return {
          id: log.id,
          timestamp: log.ts,
          functionIdentifier: log.function_path,
          functionName: log.function_name,
          udfType: log.udf_type,
          requestId: log.request_id,
          executionId: log.execution_id,
          success: log.success,
          durationMs: log.duration_ms,
          error: parsed.error,
          logLines: parsed.logLines,
          raw: parsed,
        };
      });

      await exportLogsToFile(logsForExport as any, format);
      toast.success(
        `Exported ${result.logs.length} logs to ${format.toUpperCase()}`,
      );
    } catch (error) {
      console.error("[LogStorageSettings] Failed to export:", error);
      toast.error("Failed to export logs");
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden bg-background-base">
        <div className="flex flex-1 items-center justify-center">
          <Activity className="animate-spin text-text-muted" size={24} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background-base">
      <div className="flex flex-1 justify-center overflow-y-auto p-4">
        <div className="w-full max-w-[600px] space-y-4 pb-20">
          {/* Storage Health Section */}
          <section>
            <SettingCard>
              <div className="grid grid-cols-1 gap-6 p-4 md:grid-cols-3">
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
                    Status
                  </span>
                  <div className="flex items-center gap-2.5">
                    {stats ? (
                      <>
                        <CheckCircle2 size={20} className="text-success-base" />
                        <span className="text-lg font-medium text-text-base">
                          Operational
                        </span>
                      </>
                    ) : (
                      <span className="text-lg font-medium text-text-muted">
                        Loading...
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-text-muted">
                    SQLite Database
                  </span>
                </div>

                <div className="flex flex-col gap-2 md:border-l md:border-border-base md:pl-8">
                  <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
                    Database Size
                  </span>
                  <div className="flex items-center gap-2.5">
                    <Database size={20} className="text-brand-base" />
                    <span className="text-lg font-medium text-text-base">
                      {stats ? formatBytes(stats.db_size_bytes) : "0 B"}
                    </span>
                  </div>
                  <span className="text-xs text-text-muted">
                    convex-logs.db
                  </span>
                </div>

                <div className="flex flex-col gap-2 md:border-l md:border-border-base md:pl-8">
                  <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
                    Total Logs
                  </span>
                  <div className="flex items-center gap-2.5">
                    <Zap size={20} className="text-warning-base" />
                    <span className="text-lg font-medium text-text-base">
                      {stats?.total_logs.toLocaleString() || "0"}
                    </span>
                  </div>
                  <span className="text-xs text-text-muted">
                    Indexed records
                  </span>
                </div>
              </div>
            </SettingCard>
          </section>

          {/* Configuration Section */}
          <section>
            <SettingCard>
              <SettingRow
                label="Enable Log Storage"
                description="When enabled, function execution logs are written to the local SQLite database for historical analysis."
              >
                <Toggle
                  checked={settings?.enabled ?? true}
                  onChange={(checked) =>
                    handleSettingChange("enabled", checked)
                  }
                  disabled={isSaving}
                />
              </SettingRow>

              <SettingRow
                label="Retention Period"
                description="Number of days to keep logs before deletion."
                border={false}
              >
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={settings?.retention_days ?? 30}
                      onChange={(e) =>
                        handleSettingChange(
                          "retention_days",
                          parseInt(e.target.value) || 30,
                        )
                      }
                      className="w-20 rounded-md border border-border-base bg-surface-base py-1.5 pl-3 pr-8 text-sm text-text-base transition-all focus:border-brand-base focus:outline-none focus:ring-1 focus:ring-brand-base"
                    />
                    <span className="pointer-events-none absolute right-3 top-1.5 text-xs text-text-muted">
                      d
                    </span>
                  </div>
                </div>
              </SettingRow>
            </SettingCard>
          </section>

          {/* Operations Section */}
          <section>
            <SettingCard>
              <SettingRow
                label="Export Data"
                description="Download all stored logs in your preferred format."
              >
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExportLogs("json")}
                    disabled={isExporting || !stats?.total_logs}
                    className="flex items-center gap-2 rounded-md border border-border-base bg-surface-base px-3 py-1.5 text-xs font-medium text-text-base transition-colors hover:bg-surface-overlay disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FileText size={14} /> JSON
                  </button>
                  <button
                    onClick={() => handleExportLogs("csv")}
                    disabled={isExporting || !stats?.total_logs}
                    className="flex items-center gap-2 rounded-md border border-border-base bg-surface-base px-3 py-1.5 text-xs font-medium text-text-base transition-colors hover:bg-surface-overlay disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FileText size={14} /> CSV
                  </button>
                </div>
              </SettingRow>

              <SettingRow
                label="Optimize Database"
                description="Rebuilds the FTS index and runs a VACUUM command to reclaim unused space."
              >
                <button
                  onClick={handleOptimizeDb}
                  disabled={isOptimizing}
                  className="flex items-center gap-2 rounded-md border border-border-base bg-surface-base px-4 py-1.5 text-xs font-medium text-text-base transition-all hover:bg-surface-overlay disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw
                    size={14}
                    className={isOptimizing ? "animate-spin" : ""}
                  />
                  {isOptimizing ? "Optimizing..." : "Run Optimize"}
                </button>
              </SettingRow>

              <SettingRow
                label="Prune Old Logs"
                description="Immediately delete logs older than the configured retention period."
                border={false}
              >
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePruneLogs}
                    disabled={isPruning || !stats?.total_logs}
                    className="flex items-center gap-2 rounded-md border border-error-base/20 bg-error-base/10 px-4 py-1.5 text-xs font-medium text-error-base transition-all hover:border-error-base/30 hover:bg-error-base/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                    Prune Now
                  </button>

                  <button
                    onClick={handleClearAllLogs}
                    disabled={isClearing || !stats?.total_logs}
                    className="flex items-center gap-2 rounded-md border border-error-base/20 bg-error-base/10 px-4 py-1.5 text-xs font-medium text-error-base transition-all hover:border-error-base/30 hover:bg-error-base/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                    Clear All
                  </button>
                </div>
              </SettingRow>
            </SettingCard>
          </section>
        </div>
      </div>
    </div>
  );
}
