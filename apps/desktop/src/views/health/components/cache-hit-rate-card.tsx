import { HealthCard } from "@/components/ui";
import { MetricChart } from "./metric-chart";
import { BigMetric, type MetricHealth } from "./big-metric";
import { getChartColor } from "@/utils/metrics";
import type { MultiSeriesChartData, DeploymentMarker } from "../types";

interface CacheHitRateCardProps {
  currentRate?: number;
  chartData: MultiSeriesChartData | null | undefined;
  deploymentMarkers?: DeploymentMarker[];
  isLoading?: boolean;
  error?: string | null;
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
 * Card displaying the cache hit rate metric with chart.
 * Matches the Convex dashboard design with full chart display.
 */
export function CacheHitRateCard({
  currentRate,
  chartData,
  deploymentMarkers = [],
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
      <div className="flex-1 flex flex-col">
        {chartData === null ? (
          <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm text-muted">
            Data will appear here as your queries are called.
          </div>
        ) : chartData === undefined ? null : chartData.data.length > 0 ? (
          <div className="flex-1 w-full">
            <MetricChart
              multiSeriesData={chartData}
              deploymentMarkers={deploymentMarkers}
              color={health ? getChartColor(health) : "brand"}
              height={140}
              fullHeight
              showXAxis
              showYAxis
              showLegend
              formatValue={(v) => `${v.toFixed(0)}%`}
              formatTooltipValue={(v) => `${v.toFixed(1)}%`}
            />
          </div>
        ) : (
          currentRate !== undefined && (
            <BigMetric health={health} metric={`${currentRate.toFixed(1)}%`}>
              No recent cache data
            </BigMetric>
          )
        )}
      </div>
    </HealthCard>
  );
}
