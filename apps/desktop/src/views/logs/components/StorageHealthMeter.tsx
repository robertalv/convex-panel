/**
 * StorageHealthMeter Component
 * Visual indicator for IndexedDB storage usage and health
 */

import { useState, useEffect, useCallback } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  Database,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  getStorageHealthInfo,
  requestPersistence,
  type StorageHealthInfo,
  type StorageHealthStatus,
} from "../utils/storage-health";
import { formatBytes } from "../utils/formatters";

interface StorageHealthMeterProps {
  /** Optional class name */
  className?: string;
  /** Whether to show as a compact badge (toolbar) or full display */
  variant?: "compact" | "full";
  /** Callback when storage info changes */
  onHealthChange?: (info: StorageHealthInfo) => void;
  /** Refresh interval in ms (default: 30000 = 30s) */
  refreshInterval?: number;
}

/**
 * Get icon and color based on health status
 */
function getStatusIcon(status: StorageHealthStatus) {
  switch (status) {
    case "healthy":
      return {
        icon: CheckCircle,
        color: "var(--color-success-base)",
        bgColor: "var(--color-success-surface)",
      };
    case "warning":
      return {
        icon: AlertTriangle,
        color: "var(--color-warning-base)",
        bgColor: "var(--color-warning-surface)",
      };
    case "critical":
      return {
        icon: AlertCircle,
        color: "var(--color-error-base)",
        bgColor: "var(--color-error-surface)",
      };
    case "unknown":
    default:
      return {
        icon: Database,
        color: "var(--color-text-muted)",
        bgColor: "var(--color-surface-raised)",
      };
  }
}

/**
 * Get progress bar color based on percentage
 */
function getProgressColor(percentUsed: number): string {
  if (percentUsed >= 90) return "var(--color-error-base)";
  if (percentUsed >= 70) return "var(--color-warning-base)";
  return "var(--color-success-base)";
}

export function StorageHealthMeter({
  className = "",
  variant = "compact",
  onHealthChange,
  refreshInterval = 30000,
}: StorageHealthMeterProps) {
  const [healthInfo, setHealthInfo] = useState<StorageHealthInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequestingPersistence, setIsRequestingPersistence] = useState(false);

  const refreshHealth = useCallback(async () => {
    try {
      const info = await getStorageHealthInfo();
      setHealthInfo(info);
      onHealthChange?.(info);
    } catch (error) {
      console.error("[StorageHealthMeter] Failed to get health info:", error);
    } finally {
      setIsLoading(false);
    }
  }, [onHealthChange]);

  // Initial load and periodic refresh
  useEffect(() => {
    refreshHealth();
    const interval = setInterval(refreshHealth, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshHealth, refreshInterval]);

  const handleRequestPersistence = async () => {
    setIsRequestingPersistence(true);
    try {
      await requestPersistence();
      await refreshHealth();
    } finally {
      setIsRequestingPersistence(false);
    }
  };

  if (isLoading || !healthInfo) {
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

  const { icon: StatusIcon, color } = getStatusIcon(healthInfo.status);
  const progressColor = getProgressColor(healthInfo.percentUsed);

  // Compact variant - just an icon with tooltip
  if (variant === "compact") {
    return (
      <Popover>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <button
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors hover:bg-surface-raised ${className}`}
                style={{ color }}
              >
                <StatusIcon className="h-3.5 w-3.5" />
                <span>{healthInfo.percentUsed.toFixed(0)}%</span>
              </button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <span>Storage: {healthInfo.summary}</span>
          </TooltipContent>
        </Tooltip>

        <PopoverContent align="end" className="w-80 p-0">
          <StorageHealthDetails
            healthInfo={healthInfo}
            onRequestPersistence={handleRequestPersistence}
            isRequestingPersistence={isRequestingPersistence}
          />
        </PopoverContent>
      </Popover>
    );
  }

  // Full variant - progress bar with details
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusIcon className="h-4 w-4" style={{ color }} />
          <span
            className="text-sm font-medium"
            style={{ color: "var(--color-text-base)" }}
          >
            Storage Health
          </span>
        </div>
        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          {healthInfo.summary}
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="h-2 rounded-full overflow-hidden"
        style={{ backgroundColor: "var(--color-surface-overlay)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${Math.min(healthInfo.percentUsed, 100)}%`,
            backgroundColor: progressColor,
          }}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span style={{ color: "var(--color-text-muted)" }}>Used: </span>
          <span style={{ color: "var(--color-text-base)" }}>
            {formatBytes(healthInfo.usage)}
          </span>
        </div>
        <div>
          <span style={{ color: "var(--color-text-muted)" }}>Available: </span>
          <span style={{ color: "var(--color-text-base)" }}>
            {formatBytes(healthInfo.available)}
          </span>
        </div>
        <div>
          <span style={{ color: "var(--color-text-muted)" }}>Quota: </span>
          <span style={{ color: "var(--color-text-base)" }}>
            {formatBytes(healthInfo.quota)}
          </span>
        </div>
        <div>
          <span style={{ color: "var(--color-text-muted)" }}>Persisted: </span>
          <span
            style={{
              color: healthInfo.persisted
                ? "var(--color-success-base)"
                : "var(--color-text-muted)",
            }}
          >
            {healthInfo.persisted ? "Yes" : "No"}
          </span>
        </div>
      </div>

      {/* Request persistence button if not persisted */}
      {!healthInfo.persisted && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleRequestPersistence}
          disabled={isRequestingPersistence}
          className="mt-1"
        >
          {isRequestingPersistence ? "Requesting..." : "Request Persistence"}
        </Button>
      )}
    </div>
  );
}

/**
 * Detailed storage info for popover
 */
interface StorageHealthDetailsProps {
  healthInfo: StorageHealthInfo;
  onRequestPersistence: () => void;
  isRequestingPersistence: boolean;
}

function StorageHealthDetails({
  healthInfo,
  onRequestPersistence,
  isRequestingPersistence,
}: StorageHealthDetailsProps) {
  const { icon: StatusIcon, color } = getStatusIcon(healthInfo.status);
  const progressColor = getProgressColor(healthInfo.percentUsed);

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <StatusIcon className="h-5 w-5" style={{ color }} />
        <div className="flex-1">
          <div
            className="text-sm font-medium"
            style={{ color: "var(--color-text-base)" }}
          >
            Storage Health
          </div>
          <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {healthInfo.status === "healthy" &&
              "Storage usage is within normal limits"}
            {healthInfo.status === "warning" && "Storage usage is getting high"}
            {healthInfo.status === "critical" && "Storage is almost full!"}
            {healthInfo.status === "unknown" &&
              "Unable to determine storage status"}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1">
          <span style={{ color: "var(--color-text-muted)" }}>Usage</span>
          <span style={{ color: "var(--color-text-base)" }}>
            {healthInfo.percentUsed.toFixed(1)}%
          </span>
        </div>
        <div
          className="h-2.5 rounded-full overflow-hidden"
          style={{ backgroundColor: "var(--color-surface-overlay)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${Math.min(healthInfo.percentUsed, 100)}%`,
              backgroundColor: progressColor,
            }}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div
        className="grid grid-cols-2 gap-3 p-3 rounded-lg text-xs"
        style={{ backgroundColor: "var(--color-surface-raised)" }}
      >
        <div>
          <div style={{ color: "var(--color-text-muted)" }}>Used</div>
          <div style={{ color: "var(--color-text-base)", fontWeight: 500 }}>
            {formatBytes(healthInfo.usage)}
          </div>
        </div>
        <div>
          <div style={{ color: "var(--color-text-muted)" }}>Available</div>
          <div style={{ color: "var(--color-text-base)", fontWeight: 500 }}>
            {formatBytes(healthInfo.available)}
          </div>
        </div>
        <div>
          <div style={{ color: "var(--color-text-muted)" }}>Total Quota</div>
          <div style={{ color: "var(--color-text-base)", fontWeight: 500 }}>
            {formatBytes(healthInfo.quota)}
          </div>
        </div>
        <div>
          <div style={{ color: "var(--color-text-muted)" }}>Persistence</div>
          <div
            style={{
              color: healthInfo.persisted
                ? "var(--color-success-base)"
                : "var(--color-warning-base)",
              fontWeight: 500,
            }}
          >
            {healthInfo.persisted ? "Protected" : "Best-effort"}
          </div>
        </div>
      </div>

      {/* Persistence explanation and action */}
      {!healthInfo.persisted && (
        <div
          className="p-3 rounded-lg text-xs"
          style={{ backgroundColor: "var(--color-warning-surface)" }}
        >
          <div className="flex items-start gap-2">
            <AlertTriangle
              className="h-4 w-4 mt-0.5 flex-shrink-0"
              style={{ color: "var(--color-warning-base)" }}
            />
            <div className="flex-1">
              <div style={{ color: "var(--color-text-base)", fontWeight: 500 }}>
                Storage may be cleared
              </div>
              <div
                style={{ color: "var(--color-text-muted)" }}
                className="mt-1"
              >
                Your logs are stored in "best-effort" mode and may be cleared by
                the browser under storage pressure. Request persistence to
                prevent this.
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={onRequestPersistence}
                disabled={isRequestingPersistence}
                className="mt-2"
              >
                {isRequestingPersistence
                  ? "Requesting..."
                  : "Request Persistence"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {healthInfo.persisted && (
        <div
          className="p-3 rounded-lg text-xs"
          style={{ backgroundColor: "var(--color-success-surface)" }}
        >
          <div className="flex items-start gap-2">
            <CheckCircle
              className="h-4 w-4 mt-0.5 flex-shrink-0"
              style={{ color: "var(--color-success-base)" }}
            />
            <div>
              <div style={{ color: "var(--color-text-base)", fontWeight: 500 }}>
                Storage is protected
              </div>
              <div
                style={{ color: "var(--color-text-muted)" }}
                className="mt-1"
              >
                Your logs are persisted and won't be cleared by the browser.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StorageHealthMeter;
