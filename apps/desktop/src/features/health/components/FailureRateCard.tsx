import { HealthCard } from "./HealthCard";
import { MetricChart, type TimeSeriesDataPoint } from "./MetricChart";
import { BigMetric, type MetricHealth } from "./BigMetric";

interface FailureRateCardProps {
  /** Current failure rate as percentage (0-100) */
  currentRate?: number;
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

/**
 * Determines health status based on failure rate percentage.
 */
function getFailureRateHealth(rate: number): MetricHealth {
  if (rate < 0.5) return "healthy";
  if (rate < 2) return "warning";
  return "error";
}

/**
 * Get chart color based on health
 */
function getChartColor(
  health: MetricHealth,
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
 * Card displaying the failure rate metric with chart.
 * Matches the Convex dashboard design with full chart display.
 */
export function FailureRateCard({
  currentRate,
  chartData,
  isLoading = false,
  error = null,
  className,
}: FailureRateCardProps) {
  const health =
    currentRate !== undefined ? getFailureRateHealth(currentRate) : undefined;

  return (
    <HealthCard
      title="Failure Rate"
      tip="The failure rate of all your running functions, bucketed by minute."
      loading={isLoading}
      error={error}
      className={className}
    >
      {chartData === null ? (
        // No data yet
        <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm text-muted">
          Data will appear here as your functions are called.
        </div>
      ) : chartData === undefined ? null : chartData.length > 0 ? ( // Loading
        // Show chart with data
        <div className="h-full w-full">
          <MetricChart
            data={chartData}
            color={health ? getChartColor(health) : "brand"}
            height={140}
            showXAxis
            showYAxis
            formatValue={(v) => `${v.toFixed(0)}%`}
            formatTooltipValue={(v) => `${v.toFixed(2)}%`}
          />
        </div>
      ) : (
        // No data points but array exists - show current rate as big metric
        currentRate !== undefined && (
          <BigMetric health={health} metric={`${currentRate.toFixed(2)}%`}>
            No recent failures
          </BigMetric>
        )
      )}
    </HealthCard>
  );
}
