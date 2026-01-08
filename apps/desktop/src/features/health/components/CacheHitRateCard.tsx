import { HealthCard } from "@/components/ui";
import { MetricChart, type TimeSeriesDataPoint } from "./MetricChart";
import { BigMetric, type MetricHealth } from "./BigMetric";

interface CacheHitRateCardProps {
  /** Current cache hit rate as percentage (0-100) */
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
 * Determines health status based on cache hit rate percentage.
 */
function getCacheHitHealth(rate: number): MetricHealth {
  if (rate >= 80) return "healthy";
  if (rate >= 50) return "warning";
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
 * Card displaying the cache hit rate metric with chart.
 * Matches the Convex dashboard design with full chart display.
 */
export function CacheHitRateCard({
  currentRate,
  chartData,
  isLoading = false,
  error = null,
  className,
}: CacheHitRateCardProps) {
  const health =
    currentRate !== undefined ? getCacheHitHealth(currentRate) : undefined;

  return (
    <HealthCard
      title="Cache Hit Rate"
      tip="The cache hit rate of your queries, bucketed by minute."
      loading={isLoading}
      error={error}
      className={className}
    >
      {chartData === null ? (
        // No data yet
        <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm text-muted">
          Data will appear here as your queries are called.
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
            formatTooltipValue={(v) => `${v.toFixed(1)}%`}
          />
        </div>
      ) : (
        // No data points but array exists - show current rate as big metric
        currentRate !== undefined && (
          <BigMetric health={health} metric={`${currentRate.toFixed(1)}%`}>
            No recent cache data
          </BigMetric>
        )
      )}
    </HealthCard>
  );
}
