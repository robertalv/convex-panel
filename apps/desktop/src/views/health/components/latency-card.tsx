import { cn } from "@/lib/utils";
import { HealthCard } from "@/components/ui";
import { Icon } from "@/components/ui/icon";
import type { MetricHealth } from "./big-metric";
import { formatLatency } from "@/utils/metrics";

interface LatencyPercentiles {
  p50: number;
  p95: number;
  p99: number;
}

interface LatencyCardProps {
  percentiles?: LatencyPercentiles;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

/**
 * Determine health status based on p95 latency.
 * Thresholds: < 150ms healthy, 150-400ms warning, > 400ms error
 */
function getLatencyHealth(p95: number): MetricHealth {
  if (p95 < 150) return "healthy";
  if (p95 < 400) return "warning";
  return "error";
}

const HEALTH_CONFIG = {
  healthy: {
    color: "text-success",
    bg: "bg-success/10",
    border: "border-success/20",
    icon: <Icon name="zap" size={14} />,
    status: "Optimal Performance Detected",
  },
  warning: {
    color: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/20",
    icon: <Icon name="clock" size={14} />,
    status: "Elevated Latency Warning",
  },
  error: {
    color: "text-error",
    bg: "bg-error/15",
    border: "border-error/30",
    icon: <Icon name="trendingUp" size={14} />,
    status: "High latency detected",
  },
};

interface BadgeProps {
  label: string;
  value: string;
  health: MetricHealth;
  isTrigger?: boolean;
}

function PercentileBadge({
  label,
  value,
  health,
  isTrigger,
}: BadgeProps) {
  const config = HEALTH_CONFIG[health];

  if (isTrigger && health !== "healthy") {
    return (
      <div
        className={cn(
          "relative flex flex-col justify-between rounded-lg border p-4 transition-all duration-300",
          config.bg,
          config.border,
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <span
            className={cn(
              "text-[10px] font-bold uppercase tracking-wider",
              config.color,
            )}
          >
            {label}
          </span>
          <div className={cn(config.color, "opacity-80")}>
            <Icon name="clock" size={16} />
          </div>
        </div>
        <span
          className={cn(
            "font-mono text-2xl font-bold tracking-tight",
            config.color,
          )}
        >
          {value}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between rounded-lg border border-border bg-surface-alt p-4 transition-all hover:bg-surface-alt/80">
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted mb-2">
        {label}
      </span>
      <span className="font-mono text-2xl font-bold tracking-tight text-foreground">
        {value}
      </span>
    </div>
  );
}

/**
 * Card displaying latency percentiles (p50, p95, p99).
 * Enhanced with health status indicators and better visual hierarchy.
 */
export function LatencyCard({
  percentiles,
  isLoading = false,
  error = null,
  className,
}: LatencyCardProps) {
  const health = percentiles?.p95
    ? getLatencyHealth(percentiles.p95)
    : "healthy";
  const config = HEALTH_CONFIG[health];

  return (
    <HealthCard
      title="Latency"
      tip="Performance metrics tracked globally. P95 is the standard indicator of user experience."
      loading={isLoading}
      error={error}
      className={className}
    >
      {percentiles ? (
        <div className="flex flex-col gap-4">
          {/* Status Banner */}
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-xs border",
              config.bg,
              config.border,
              config.color,
            )}
          >
            {config.icon}
            <span className="tracking-wide">{config.status}</span>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-3 gap-3">
            <PercentileBadge
              label="P50"
              value={formatLatency(percentiles.p50, 3)}
              health={health}
            />
            <PercentileBadge
              label="P95"
              value={formatLatency(percentiles.p95, 3)}
              health={health}
              isTrigger
            />
            <PercentileBadge
              label="P99"
              value={formatLatency(percentiles.p99, 3)}
              health={health}
            />
          </div>
        </div>
      ) : (
        <div className="flex h-[180px] items-center justify-center text-[10px] font-bold uppercase tracking-widest text-muted">
          No active stream
        </div>
      )}
    </HealthCard>
  );
}
