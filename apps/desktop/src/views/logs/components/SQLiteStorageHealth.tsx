/**
 * SQLiteStorageHealth Component
 * Visual indicator for SQLite log storage usage and health
 */

import { useEffect } from "react";
import { Database, CheckCircle } from "lucide-react";
import { useLocalLogStore } from "../hooks/useLocalLogStore";
import { formatBytes, formatDateTime } from "../utils/formatters";

interface SQLiteStorageHealthProps {
  /** Optional class name */
  className?: string;
  /** Whether to show as a compact badge (toolbar) or full display */
  variant?: "compact" | "full";
  /** Refresh interval in ms (default: 30000 = 30s) */
  refreshInterval?: number;
}

export function SQLiteStorageHealth({
  className = "",
  variant = "full",
  refreshInterval = 30000,
}: SQLiteStorageHealthProps) {
  const { stats, refreshStats, isLoading } = useLocalLogStore();

  // Periodic refresh
  useEffect(() => {
    const interval = setInterval(refreshStats, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshStats, refreshInterval]);

  if (isLoading && !stats) {
    return (
      <div
        className={`flex items-center gap-1.5 px-2 py-1 text-xs ${className}`}
        style={{ color: "var(--color-text-muted)" }}
      >
        <Database className="h-3.5 w-3.5 animate-pulse" />
        {variant === "full" && <span>Loading...</span>}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  // Compact variant - just an icon with count
  if (variant === "compact") {
    return (
      <div
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs ${className}`}
        style={{ color: "var(--color-brand-base)" }}
        title={`${stats.total_logs.toLocaleString()} logs stored (${formatBytes(stats.db_size_bytes)})`}
      >
        <Database className="h-3.5 w-3.5" />
        <span>{stats.total_logs.toLocaleString()}</span>
      </div>
    );
  }

  // Full variant - detailed display
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle
            className="h-4 w-4"
            style={{ color: "var(--color-success-base)" }}
          />
          <span
            className="text-sm font-medium"
            style={{ color: "var(--color-text-base)" }}
          >
            SQLite Storage
          </span>
        </div>
        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          {formatBytes(stats.db_size_bytes)}
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <span style={{ color: "var(--color-text-muted)" }}>Total Logs</span>
          <div
            className="text-base font-semibold"
            style={{ color: "var(--color-text-base)" }}
          >
            {stats.total_logs.toLocaleString()}
          </div>
        </div>
        <div>
          <span style={{ color: "var(--color-text-muted)" }}>
            Database Size
          </span>
          <div
            className="text-base font-semibold"
            style={{ color: "var(--color-text-base)" }}
          >
            {formatBytes(stats.db_size_bytes)}
          </div>
        </div>
        {stats.oldest_ts && (
          <div>
            <span style={{ color: "var(--color-text-muted)" }}>Oldest Log</span>
            <div
              className="text-xs"
              style={{ color: "var(--color-text-base)" }}
            >
              {formatDateTime(stats.oldest_ts)}
            </div>
          </div>
        )}
        {stats.newest_ts && (
          <div>
            <span style={{ color: "var(--color-text-muted)" }}>Newest Log</span>
            <div
              className="text-xs"
              style={{ color: "var(--color-text-base)" }}
            >
              {formatDateTime(stats.newest_ts)}
            </div>
          </div>
        )}
      </div>

      {/* Deployments breakdown */}
      {stats.logs_by_deployment.length > 0 && (
        <div>
          <div
            className="text-xs mb-2"
            style={{ color: "var(--color-text-muted)" }}
          >
            Logs by Deployment
          </div>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {stats.logs_by_deployment.map(([deploymentId, count]) => (
              <div
                key={deploymentId}
                className="flex items-center justify-between text-xs"
              >
                <span
                  className="font-mono truncate max-w-[180px]"
                  style={{ color: "var(--color-text-base)" }}
                  title={deploymentId}
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
  );
}

export default SQLiteStorageHealth;
