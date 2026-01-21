import { HealthCard } from "@/components/ui";
import { MetricChart } from "./metric-chart";
import { BigMetric, type MetricHealth } from "./big-metric";
import { getChartColor } from "@/utils/metrics";
import { MetricChartSkeleton } from "./skeletons/metric-chart-skeleton";
import type { MultiSeriesChartData, DeploymentMarker } from "../types";

interface FailureRateCardProps {
  currentRate?: number;
  chartData: MultiSeriesChartData | null | undefined;
  deploymentMarkers?: DeploymentMarker[];
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

function getFailureRateHealth(rate: number): MetricHealth {
  if (rate < 0.5) return "healthy";
  if (rate < 2) return "warning";
  return "error";
}

/**
 * Card displaying the failure rate metric with chart.
 * Matches the Convex dashboard design with full chart display.
 */
export function FailureRateCard({
  currentRate,
  chartData,
  deploymentMarkers = [],
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
      <div className="flex-1 flex flex-col">
        {chartData === null ? (
          <MetricChartSkeleton />
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
              formatTooltipValue={(v) => `${v.toFixed(2)}%`}
            />
          </div>
        ) : (
          currentRate !== undefined && (
            <BigMetric health={health} metric={`${currentRate.toFixed(2)}%`}>
              No recent failures
            </BigMetric>
          )
        )}
      </div>
    </HealthCard>
  );
}
