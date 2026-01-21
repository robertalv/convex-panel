import { HealthCard } from "@/components/ui";
import { MetricChart, type TimeSeriesDataPoint } from "./metric-chart";
import { BigMetric } from "./big-metric";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";

interface RequestRateCardProps {
  currentRate?: number;
  chartData: TimeSeriesDataPoint[] | null | undefined;
  trend?: string;
  isLoading?: boolean;
  className?: string;
}

/**
 * Format large numbers with K/M suffixes.
 */
function formatRate(rate: number): string {
  if (rate >= 1_000_000) return `${(rate / 1_000_000).toFixed(1)}M`;
  if (rate >= 1_000) return `${(rate / 1_000).toFixed(1)}K`;
  return rate.toFixed(1);
}

/**
 * Card displaying the request rate metric with chart.
 * Matches the Convex dashboard design.
 */
export function RequestRateCard({
  currentRate,
  chartData,
  trend,
  isLoading = false,
  className,
}: RequestRateCardProps) {
  const trendValue = trend ? parseFloat(trend.replace(/[+%]/g, "")) : null;
  const isPositive = trendValue !== null && trendValue > 0;
  const isNegative = trendValue !== null && trendValue < 0;
  
  const TrendIcon = isNegative ? "arrow-down-right" : "arrow-up-right";
  return (
    <HealthCard
      title="Traffic Volume"
      tip="Real-time request throughput measured in requests per minute (RPM). High spikes may indicate traffic surges or bot activity."
      loading={isLoading}
      error={null}
      className={className}
    >
      <div className="flex flex-col gap-5">
        {chartData === null ? (
          <div className="flex h-[180px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface-alt/50 px-8 text-center transition-all hover:bg-surface-alt">
            <div className="h-10 w-10 rounded-full bg-surface-alt flex items-center justify-center mb-4 text-muted">
              <Icon name="arrow-up-right" size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted">No Traffic Detected</span>
            <p className="mt-2 text-[11px] text-subtle leading-relaxed">System is idle. Metrics will populate once the first invocation occurs.</p>
          </div>
        ) : chartData === undefined ? (
          <div className="h-[180px]" />
        ) : chartData.length > 1 ? (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-4xl font-bold tracking-tighter text-foreground">
                    {currentRate !== undefined ? formatRate(currentRate) : '0.0'}
                  </span>
                  <span className="text-[10px] text-muted uppercase tracking-widest">req / min</span>
                </div>
              </div>
              {trend && (
                <div className="flex flex-col items-end gap-1">
                  <div className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-full border text-[10px] font-bold",
                    isPositive && "bg-success/10 border-success/20 text-success",
                    isNegative && "bg-error/10 border-error/20 text-error",
                    !isPositive && !isNegative && "bg-surface-alt border-border text-muted"
                  )}>
                    <Icon name={TrendIcon} size={12} />
                    {trend}
                  </div>
                  <span className="text-[9px] text-subtle uppercase">vs Earlier Period</span>
                </div>
              )}
            </div>

            <div className="h-[140px] w-full py-2 bg-surface-alt overflow-hidden relative group">
              {/* Subtle scanning line effect */}
              <div className="absolute inset-y-0 left-0 w-[2px] bg-brand/10 blur-sm animate-[scan_4s_linear_infinite]" />
              <MetricChart
                data={chartData}
                color="brand"
                height={120}
                showYAxis
                showXAxis
                formatValue={(v) => formatRate(v)}
                formatTooltipValue={(v) => `${formatRate(v)} req/min`}
              />
            </div>
          </div>
        ) : (
          currentRate !== undefined && (
            <BigMetric metric={`${formatRate(currentRate)}`}>
              Inbound Requests / Minute
            </BigMetric>
          )
        )}
      </div>

      <style>{`
        @keyframes scan {
          0% { left: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }
      `}</style>
    </HealthCard>
  );
}
