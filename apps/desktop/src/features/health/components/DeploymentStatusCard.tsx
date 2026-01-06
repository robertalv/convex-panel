import { Server, Clock, Pause, Play, Activity, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { HealthCard } from "./HealthCard";

interface DeploymentStatusCardProps {
  /** Current deployment state */
  state: "running" | "paused" | "unknown";
  /** Server version string */
  version: string | null;
  /** Last code push timestamp */
  lastPush: Date | null;
  /** Whether data is loading */
  isLoading?: boolean;
  /** Retry callback */
  onRetry?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Format a date as relative time (e.g., "2 hours ago")
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? "" : "s"} ago`;
  if (diffHours < 24)
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;

  return date.toLocaleDateString();
}

/**
 * Card displaying deployment status information.
 * Matches the Convex dashboard design.
 */
export function DeploymentStatusCard({
  state,
  version,
  lastPush,
  isLoading = false,
  onRetry,
  className,
}: DeploymentStatusCardProps) {
  const StateIcon =
    state === "paused" ? Pause : state === "running" ? Play : Activity;

  return (
    <HealthCard
      title="Deployment Status"
      tip="Current state and version info."
      loading={isLoading}
      error={null}
      className={className}
      action={
        onRetry && (
          <button
            onClick={onRetry}
            className={cn(
              "p-1 rounded-md border-0",
              "bg-transparent text-muted",
              "hover:bg-overlay hover:text-foreground",
              "cursor-pointer transition-all duration-150",
              "flex items-center justify-center",
            )}
            title="Refresh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        )
      }
    >
      <div className="space-y-4 w-full px-2 pb-2">
        {/* State indicator */}
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-lg",
              state === "running" && "bg-success-bg text-success",
              state === "paused" && "bg-warning-bg text-warning",
              state === "unknown" && "bg-surface-alt text-muted",
            )}
          >
            <StateIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-lg font-semibold text-foreground capitalize">
              {state}
            </div>
            <div className="text-xs text-muted">Deployment State</div>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Version */}
          <div className="flex items-start gap-2">
            <Server className="h-4 w-4 text-muted mt-0.5" />
            <div className="min-w-0 flex-1">
              <div className="text-xs text-muted">Version</div>
              <div
                className="text-sm font-medium text-foreground truncate font-mono"
                title={version || "Unknown"}
              >
                {version || "-"}
              </div>
            </div>
          </div>

          {/* Last Push */}
          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 text-muted mt-0.5" />
            <div className="min-w-0 flex-1">
              <div className="text-xs text-muted">Last Push</div>
              <div
                className="text-sm font-medium text-foreground truncate"
                title={lastPush?.toLocaleString() || "Unknown"}
              >
                {lastPush ? formatRelativeTime(lastPush) : "-"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </HealthCard>
  );
}
