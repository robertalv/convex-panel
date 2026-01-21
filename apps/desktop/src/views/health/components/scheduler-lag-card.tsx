import { useState } from "react";
import { cn } from "@/lib/utils";
import { HealthCard } from "@/components/ui";
import { Icon } from "@/components/ui/icon";
import { MetricChart, type TimeSeriesDataPoint } from "./metric-chart";
import { formatDuration } from "@/views/logs/utils/formatters";
import { getChartColor } from "@/utils/metrics";
import { ActionButtonForHealthCard } from "./action-button-for-health-card";

interface SchedulerLagCardProps {
  currentLag?: number;
  chartData: TimeSeriesDataPoint[] | null | undefined;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

type SchedulerHealth = "healthy" | "warning" | "error";

function getSchedulerHealth(lagMs: number): SchedulerHealth {
  if (lagMs < 1000) return "healthy"; 
  if (lagMs < 5000) return "warning"; 
  return "error";
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
        return <Icon name="checkmark-circle" size={32} />;
      case "warning":
        return <Icon name="clock" size={32} />;
      case "error":
        return <Icon name="alert-circle" size={32} />;
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
          <ActionButtonForHealthCard
            onClick={() => setShowChart(!showChart)}
            title={showChart ? "Show status" : "Show chart"}
          >
            {showChart ? <Icon name="undo" size={14} /> : <Icon name="lineChart" size={14} />}
          </ActionButtonForHealthCard>
        ) : undefined
      }
    >
      <div className="flex-1 flex flex-col">
        {showChart && chartData && chartData.length > 0 ? (
          // Chart view
          <div className="flex-1 w-full px-2 pb-2">
            <MetricChart
              data={chartData}
              color={getChartColor(health)}
              height={140}
              fullHeight
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
                  <Icon name="clock" size={12} />
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
      </div>
    </HealthCard>
  );
}
