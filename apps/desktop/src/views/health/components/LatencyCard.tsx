import { cn } from "@/lib/utils";
import { HealthCard } from "@/components/ui";

interface LatencyPercentiles {
  p50: number;
  p95: number;
  p99: number;
}

interface LatencyCardProps {
  /** Latency percentiles in milliseconds */
  percentiles?: LatencyPercentiles;
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
 * Format milliseconds to human readable string.
 */
function formatLatency(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}µs`;
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

interface PercentileBadgeProps {
  label: string;
  value: number;
  highlight?: boolean;
}

function PercentileBadge({ label, value, highlight }: PercentileBadgeProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-lg py-2 px-4",
        "transition-colors duration-150",
        highlight
          ? "bg-accent-bg border border-accent/30"
          : "bg-surface-alt border border-transparent",
      )}
    >
      <span className="text-xs font-medium text-muted">{label}</span>
      <span
        className={cn(
          "text-lg font-semibold font-mono",
          highlight ? "text-accent" : "text-foreground",
        )}
      >
        {formatLatency(value)}
      </span>
    </div>
  );
}

/**
 * Card displaying latency percentiles (p50, p95, p99).
 * Matches the Convex dashboard design.
 */
export function LatencyCard({
  percentiles,
  isLoading = false,
  error = null,
  className,
}: LatencyCardProps) {
  return (
    <HealthCard
      title="Latency"
      tip="Function execution time percentiles."
      loading={isLoading}
      error={error}
      className={className}
    >
      {percentiles ? (
        <div className="grid grid-cols-3 gap-2 w-full">
          <PercentileBadge label="p50" value={percentiles.p50} />
          <PercentileBadge label="p95" value={percentiles.p95} highlight />
          <PercentileBadge label="p99" value={percentiles.p99} />
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm text-muted">
          No latency data available
        </div>
      )}
    </HealthCard>
  );
}
