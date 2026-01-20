import { Cpu, Layers, ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { HealthCard } from "@/components/ui";
import { formatBytes } from "../hooks/useUsageMetrics";

interface ResourceUsageCardProps {
  /** Total memory used in MB */
  totalMemoryUsedMb: number;
  /** Peak memory used in MB */
  peakMemoryUsedMb: number;
  /** Vector index read bytes */
  vectorIndexReadBytes: number;
  /** Vector index write bytes */
  vectorIndexWriteBytes: number;
  /** Whether data is loading */
  isLoading?: boolean;
  /** Error message */
  error?: string | null;
  /** Retry callback */
  onRetry?: () => void;
  /** Additional CSS classes */
  className?: string;
}

interface StatBadgeProps {
  label: string;
  value: string;
  subLabel?: string;
  highlight?: boolean;
}

function StatBadge({ label, value, subLabel, highlight }: StatBadgeProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-lg py-3 px-4",
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
        {value}
      </span>
      {subLabel && (
        <span className="text-[10px] text-muted mt-0.5">{subLabel}</span>
      )}
    </div>
  );
}

function formatMemory(mb: number): string {
  if (mb < 1) return `${(mb * 1024).toFixed(0)} KB`;
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb.toFixed(1)} MB`;
}

/**
 * Card displaying memory and vector index usage metrics.
 */
export function ResourceUsageCard({
  totalMemoryUsedMb,
  peakMemoryUsedMb,
  vectorIndexReadBytes,
  vectorIndexWriteBytes,
  isLoading = false,
  error = null,
  className,
}: ResourceUsageCardProps) {
  const hasMemoryData = totalMemoryUsedMb > 0 || peakMemoryUsedMb > 0;
  const hasVectorData = vectorIndexReadBytes > 0 || vectorIndexWriteBytes > 0;
  const hasData = hasMemoryData || hasVectorData;

  return (
    <HealthCard
      title="Resource Usage"
      tip="Memory consumption and vector index I/O in the last hour."
      loading={isLoading}
      error={error}
      className={className}
    >
      {hasData ? (
        <div className="flex flex-col gap-4">
          {/* Memory metrics */}
          <div>
            <div className="flex items-center gap-2 mb-2 px-1">
              <Cpu size={14} className="text-muted" />
              <span className="text-xs font-medium text-muted">Memory</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <StatBadge
                label="Total Used"
                value={formatMemory(totalMemoryUsedMb)}
                subLabel="cumulative"
              />
              <StatBadge
                label="Peak"
                value={formatMemory(peakMemoryUsedMb)}
                subLabel="max single execution"
                highlight={peakMemoryUsedMb > 128}
              />
            </div>
          </div>

          {/* Vector index metrics */}
          {hasVectorData && (
            <div>
              <div className="flex items-center gap-2 mb-2 px-1">
                <Layers size={14} className="text-muted" />
                <span className="text-xs font-medium text-muted">
                  Vector Index
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-alt/50">
                  <div className="flex items-center gap-2">
                    <ArrowDown size={14} className="text-success" />
                    <span className="text-xs text-muted">Read</span>
                  </div>
                  <span className="font-mono text-sm text-foreground">
                    {formatBytes(vectorIndexReadBytes)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-alt/50">
                  <div className="flex items-center gap-2">
                    <ArrowUp size={14} className="text-warning" />
                    <span className="text-xs text-muted">Write</span>
                  </div>
                  <span className="font-mono text-sm text-foreground">
                    {formatBytes(vectorIndexWriteBytes)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm text-muted">
          No resource usage data in the last hour
        </div>
      )}
    </HealthCard>
  );
}
