/**
 * Log Storage Settings Component
 * Settings page section for managing SQLite log persistence and storage
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Database,
  Trash2,
  Download,
  HardDrive,
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Wrench,
} from "lucide-react";
import { SQLiteStorageHealth } from "../../logs/components/SQLiteStorageHealth";
import { useLocalLogStore } from "../../logs/hooks/useLocalLogStore";
import {
  exportLogsToFile,
  type ExportFormat,
} from "../../logs/utils/log-export";
import { formatBytes, formatDateTime } from "../../logs/utils/formatters";

const MAX_RETENTION_DAYS = 30;

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
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

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
      setStatusMessage({
        type: "success",
        message: "Settings saved",
      });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error) {
      console.error("[LogStorageSettings] Failed to save:", error);
      setStatusMessage({
        type: "error",
        message: "Failed to save settings",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearAllLogs = async () => {
    if (
      !confirm(
        "Are you sure you want to delete all stored logs? This cannot be undone.",
      )
    ) {
      return;
    }

    try {
      setIsClearing(true);
      await clearLogs();
      await refreshStats();
      setStatusMessage({
        type: "success",
        message: "All logs cleared successfully",
      });
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (error) {
      console.error("[LogStorageSettings] Failed to clear logs:", error);
      setStatusMessage({
        type: "error",
        message: "Failed to clear logs",
      });
    } finally {
      setIsClearing(false);
    }
  };

  const handlePruneLogs = async () => {
    if (!settings) return;

    try {
      setIsPruning(true);
      const deleted = await deleteOlderThan(settings.retention_days);
      await refreshStats();
      setStatusMessage({
        type: "success",
        message: `Pruned ${deleted} old logs`,
      });
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (error) {
      console.error("[LogStorageSettings] Failed to prune logs:", error);
      setStatusMessage({
        type: "error",
        message: "Failed to prune logs",
      });
    } finally {
      setIsPruning(false);
    }
  };

  const handleOptimizeDb = async () => {
    try {
      setIsOptimizing(true);
      await optimizeDb();
      setStatusMessage({
        type: "success",
        message: "Database optimized successfully",
      });
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (error) {
      console.error("[LogStorageSettings] Failed to optimize DB:", error);
      setStatusMessage({
        type: "error",
        message: "Failed to optimize database",
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleExportLogs = async (format: ExportFormat) => {
    try {
      setIsExporting(true);

      // Fetch all logs (no filters, no limit)
      const result = await queryLogs({}, undefined, undefined);

      if (result.logs.length === 0) {
        setStatusMessage({
          type: "error",
          message: "No logs to export",
        });
        return;
      }

      // Convert LocalLogEntry to LogEntry format for export
      const logsForExport = result.logs.map((log) => {
        // Parse json_blob to get error and logLines
        let parsed: any = {};
        try {
          parsed = JSON.parse(log.json_blob);
        } catch (e) {
          console.warn("[Export] Failed to parse json_blob:", e);
        }

        return {
          id: log.id,
          timestamp: log.ts,
          functionIdentifier: log.function_path || undefined,
          functionName: log.function_name || undefined,
          udfType: log.udf_type || undefined,
          requestId: log.request_id || undefined,
          executionId: log.execution_id || undefined,
          success: log.success || false,
          durationMs: log.duration_ms || undefined,
          error: parsed.error || undefined,
          logLines: parsed.logLines || undefined,
          raw: parsed,
        };
      });

      await exportLogsToFile(logsForExport as any, format);

      setStatusMessage({
        type: "success",
        message: `Exported ${logsForExport.length} logs as ${format.toUpperCase()}`,
      });
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (error) {
      console.error("[LogStorageSettings] Failed to export:", error);
      setStatusMessage({
        type: "error",
        message: "Failed to export logs",
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div
        style={{
          flex: 1,
          overflow: "auto",
          backgroundColor: "var(--color-surface-base)",
        }}
      >
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "24px" }}>
          <div className="flex items-center justify-center py-12">
            <RefreshCw
              className="h-6 w-6 animate-spin"
              style={{ color: "var(--color-text-muted)" }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        overflow: "auto",
        backgroundColor: "var(--color-surface-base)",
      }}
    >
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "24px" }}>
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 600,
              color: "var(--color-text-base)",
              marginBottom: "8px",
            }}
          >
            Log Storage
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "var(--color-text-muted)",
            }}
          >
            Configure local SQLite storage for function execution logs
          </p>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`flex items-center gap-2 p-3 rounded-md text-sm mb-6 ${
              statusMessage.type === "success"
                ? "bg-green-50 dark:bg-green-950 text-green-900 dark:text-green-100"
                : "bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-100"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            )}
            <span>{statusMessage.message}</span>
          </div>
        )}

        {/* Storage Health */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              <CardTitle>Storage Health</CardTitle>
            </div>
            <CardDescription>
              SQLite database storage usage and status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SQLiteStorageHealth variant="full" />
          </CardContent>
        </Card>

        {/* Enable/Disable Storage */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <CardTitle>Log Persistence</CardTitle>
            </div>
            <CardDescription>
              Store function logs locally for viewing historical data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="storage-enabled">Enable Log Storage</Label>
                <div className="text-sm text-muted-foreground">
                  When enabled, function logs are saved to SQLite database
                </div>
              </div>
              <Switch
                id="storage-enabled"
                checked={settings?.enabled ?? true}
                onCheckedChange={(checked) =>
                  handleSettingChange("enabled", checked)
                }
                disabled={isSaving}
              />
            </div>
          </CardContent>
        </Card>

        {/* Storage Limits */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <CardTitle>Storage Limits</CardTitle>
            </div>
            <CardDescription>
              Configure time-based log retention policy
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="retention-days">Retention Period</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="retention-days"
                  type="number"
                  min={1}
                  max={MAX_RETENTION_DAYS}
                  value={settings?.retention_days ?? 30}
                  onChange={(e) =>
                    handleSettingChange(
                      "retention_days",
                      parseInt(e.target.value) || 30,
                    )
                  }
                  disabled={isSaving}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">
                  days (max: {MAX_RETENTION_DAYS})
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Logs older than this will be automatically deleted every 24
                hours
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Storage Statistics */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                <CardTitle>Storage Statistics</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshStats}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>Current log storage usage</CardDescription>
          </CardHeader>
          <CardContent>
            {stats ? (
              <div className="grid grid-cols-2 gap-4">
                <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: "var(--color-surface-raised)" }}
                >
                  <div
                    className="text-xs"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    Total Logs
                  </div>
                  <div
                    className="text-xl font-semibold"
                    style={{ color: "var(--color-text-base)" }}
                  >
                    {stats.total_logs.toLocaleString()}
                  </div>
                </div>

                <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: "var(--color-surface-raised)" }}
                >
                  <div
                    className="text-xs"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    Database Size
                  </div>
                  <div
                    className="text-xl font-semibold"
                    style={{ color: "var(--color-text-base)" }}
                  >
                    {formatBytes(stats.db_size_bytes)}
                  </div>
                </div>

                <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: "var(--color-surface-raised)" }}
                >
                  <div
                    className="text-xs"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    Oldest Log
                  </div>
                  <div
                    className="text-sm font-medium"
                    style={{ color: "var(--color-text-base)" }}
                  >
                    {stats.oldest_ts ? formatDateTime(stats.oldest_ts) : "N/A"}
                  </div>
                </div>

                <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: "var(--color-surface-raised)" }}
                >
                  <div
                    className="text-xs"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    Newest Log
                  </div>
                  <div
                    className="text-sm font-medium"
                    style={{ color: "var(--color-text-base)" }}
                  >
                    {stats.newest_ts ? formatDateTime(stats.newest_ts) : "N/A"}
                  </div>
                </div>

                {stats.logs_by_deployment.length > 0 && (
                  <div
                    className="col-span-2 p-3 rounded-lg"
                    style={{ backgroundColor: "var(--color-surface-raised)" }}
                  >
                    <div
                      className="text-xs mb-2"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      Logs by Deployment
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {stats.logs_by_deployment.map(([deploymentId, count]) => (
                        <div
                          key={deploymentId}
                          className="flex items-center justify-between text-sm"
                        >
                          <span
                            className="font-mono text-xs truncate max-w-[200px]"
                            style={{ color: "var(--color-text-base)" }}
                          >
                            {deploymentId}
                          </span>
                          <span style={{ color: "var(--color-text-muted)" }}>
                            {count.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No statistics available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>
              Export, optimize, or clear stored logs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Export */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Export All Logs</Label>
                <div className="text-sm text-muted-foreground">
                  Download all stored logs in various formats
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportLogs("json")}
                  disabled={isExporting || !stats?.total_logs}
                >
                  <Download className="h-4 w-4 mr-2" />
                  JSON
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportLogs("csv")}
                  disabled={isExporting || !stats?.total_logs}
                >
                  <Download className="h-4 w-4 mr-2" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportLogs("txt")}
                  disabled={isExporting || !stats?.total_logs}
                >
                  <Download className="h-4 w-4 mr-2" />
                  TXT
                </Button>
              </div>
            </div>

            {/* Prune */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="space-y-0.5">
                <Label>Prune Old Logs</Label>
                <div className="text-sm text-muted-foreground">
                  Remove logs older than retention period now
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePruneLogs}
                disabled={isPruning || !stats?.total_logs}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isPruning ? "animate-spin" : ""}`}
                />
                {isPruning ? "Pruning..." : "Prune Now"}
              </Button>
            </div>

            {/* Optimize */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="space-y-0.5">
                <Label>Optimize Database</Label>
                <div className="text-sm text-muted-foreground">
                  Rebuild FTS index and reclaim unused space
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOptimizeDb}
                disabled={isOptimizing}
              >
                <Wrench
                  className={`h-4 w-4 mr-2 ${isOptimizing ? "animate-spin" : ""}`}
                />
                {isOptimizing ? "Optimizing..." : "Optimize"}
              </Button>
            </div>

            {/* Clear All */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="space-y-0.5">
                <Label className="text-destructive">Clear All Logs</Label>
                <div className="text-sm text-muted-foreground">
                  Permanently delete all stored logs
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearAllLogs}
                disabled={isClearing || !stats?.total_logs}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isClearing ? "Clearing..." : "Clear All"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
