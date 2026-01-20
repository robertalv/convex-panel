import { HealthCard } from "@/components/ui";
import { MetricChart, type TimeSeriesDataPoint } from "./MetricChart";
import { BigMetric } from "./BigMetric";

interface RequestRateCardProps {
  /** Current requests per minute */
  currentRate?: number;
  /** Time series data for the chart */
  chartData: TimeSeriesDataPoint[] | null | undefined;
  /** Whether data is loading */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Format large numbers with K/M suffixes.
 */
function formatRate(rate: number): string {
  if (rate >= 1_000_000) return `${(rate / 1_000_000).toFixed(1)}M`;
  if (rate >= 1_000) return `${(rate / 1_000).toFixed(1)}K`;
  return rate.toFixed(0);
}

/**
 * Card displaying the request rate metric with chart.
 * Matches the Convex dashboard design.
 */
export function RequestRateCard({
  currentRate,
  chartData,
  isLoading = false,
  className,
}: RequestRateCardProps) {
  return (
    <HealthCard
      title="Request Rate"
      tip="Function invocations per minute."
      loading={isLoading}
      error={null}
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
            color="brand"
            height={140}
            showXAxis
            showYAxis
            formatValue={(v) => formatRate(v)}
            formatTooltipValue={(v) => `${formatRate(v)} req/min`}
          />
        </div>
      ) : (
        // No data points but array exists - show current rate as big metric
        currentRate !== undefined && (
          <BigMetric metric={`${formatRate(currentRate)} req/min`}>
            No recent requests
          </BigMetric>
        )
      )}
    </HealthCard>
  );
}
