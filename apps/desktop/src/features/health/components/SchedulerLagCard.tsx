import { useState } from "react";
import {
  CheckCircle,
  AlertTriangle,
  Clock,
  LineChart,
  Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HealthCard } from "@/components/ui";
import { MetricChart, type TimeSeriesDataPoint } from "./MetricChart";

interface SchedulerLagCardProps {
  /** Current scheduler lag in milliseconds */
  currentLag?: number;
  /** Time series data for the chart */
  chartData: TimeSeriesDataPoint[] | null | undefined;
  /** Whether data is loading */
  isLoading?: boolean;
  /** Error message */
  error?: string | null;
  /** Retry callback */
  onRetry?: () => void;
  /** Additional CSS classes */
  className?: string;
}

type SchedulerHealth = "healthy" | "warning" | "error";

/**
 * Determines health status based on scheduler lag.
 */
function getSchedulerHealth(lagMs: number): SchedulerHealth {
  if (lagMs < 1000) return "healthy"; // < 1s
  if (lagMs < 5000) return "warning"; // < 5s
  return "error";
}

/**
 * Format milliseconds to human readable duration.
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

/**
 * Get chart color based on health
 */
function getChartColor(
  health: SchedulerHealth,
): "success" | "warning" | "error" | "brand" {
  switch (health) {
    case "healthy":
      return "success";
    case "warning":
      return "warning";
    case "error":
      return "error";
    default:
      return "brand";
  }
}

/**
 * Action button for toggling views
 */
function ToggleButton({
  onClick,
  showChart,
}: {
  onClick: () => void;
  showChart: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={showChart ? "Show status" : "Show chart"}
      className={cn(
        "p-1 rounded-md border-0",
        "bg-transparent text-muted",
        "hover:bg-overlay hover:text-foreground",
        "cursor-pointer transition-all duration-150",
        "flex items-center justify-center",
      )}
    >
      {showChart ? <Undo2 size={14} /> : <LineChart size={14} />}
    </button>
  );
}

/**
 * Card displaying the scheduler lag metric with chart or status view.
 * Matches the Convex dashboard design.
 */
export function SchedulerLagCard({
  currentLag,
  chartData,
  isLoading = false,
  error = null,
  className,
}: SchedulerLagCardProps) {
  const [showChart, setShowChart] = useState(false);
  const health =
    currentLag !== undefined ? getSchedulerHealth(currentLag) : "healthy";

  // Get health-based styling
  const getHealthColor = (h: SchedulerHealth) => {
    switch (h) {
      case "healthy":
        return "text-success";
      case "warning":
        return "text-warning";
      case "error":
        return "text-error";
    }
  };

  const getHealthBgColor = (h: SchedulerHealth) => {
    switch (h) {
      case "healthy":
        return "bg-success/10";
      case "warning":
        return "bg-warning/10";
      case "error":
        return "bg-error/10";
    }
  };

  const getHealthIcon = (h: SchedulerHealth) => {
    switch (h) {
      case "healthy":
        return <CheckCircle size={32} />;
      case "warning":
        return <Clock size={32} />;
      case "error":
        return <AlertTriangle size={32} />;
    }
  };

  const getMessage = (h: SchedulerHealth, lagMs?: number) => {
    if (h === "healthy") {
      return "Scheduled functions are running on time.";
    }
    if (lagMs !== undefined) {
      return `Scheduling is behind by ${formatDuration(lagMs)}.`;
    }
    return "Scheduling status unknown.";
  };

  return (
    <HealthCard
      title="Scheduler Status"
      tip="The status of function scheduling. Scheduling is unhealthy when functions are executing after their scheduled time."
      loading={isLoading}
      error={error}
      className={className}
      action={
        chartData && chartData.length > 0 ? (
          <ToggleButton
            onClick={() => setShowChart(!showChart)}
            showChart={showChart}
          />
        ) : undefined
      }
    >
      {showChart && chartData && chartData.length > 0 ? (
        // Chart view
        <div className="h-full w-full px-2 pb-2">
          <MetricChart
            data={chartData}
            color={getChartColor(health)}
            height={140}
            showXAxis
            showYAxis
            formatValue={(v) => formatDuration(v)}
            formatTooltipValue={(v) => formatDuration(v)}
          />
        </div>
      ) : (
        // Status icon view (default)
        <div className="flex flex-col items-center justify-center gap-3 py-4">
          {/* Status indicator with icon */}
          <div
            className={cn(
              "flex items-center justify-center w-16 h-16 rounded-full",
              getHealthBgColor(health),
              getHealthColor(health),
            )}
          >
            {getHealthIcon(health)}
          </div>

          {/* Status text */}
          <div className="flex flex-col items-center gap-1">
            <span
              className={cn("text-xl font-semibold", getHealthColor(health))}
            >
              {health === "healthy" ? "On time" : "Overdue"}
            </span>

            {currentLag !== undefined && currentLag >= 1000 && (
              <span
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium",
                  getHealthBgColor(health),
                  getHealthColor(health),
                )}
              >
                <Clock size={12} />
                {formatDuration(currentLag)} behind
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-center text-muted text-[11px] max-w-[200px]">
            {getMessage(health, currentLag)}
          </p>
        </div>
      )}
    </HealthCard>
  );
}
