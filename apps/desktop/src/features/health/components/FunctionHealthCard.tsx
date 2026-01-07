import { AlertTriangle, Clock, TrendingUp, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { HealthCard } from "./HealthCard";
import type { FunctionStat } from "../hooks/useFunctionHealth";

interface FunctionHealthCardProps {
  /** Top functions by failure rate */
  topFailing: FunctionStat[];
  /** Top functions by execution time */
  slowest: FunctionStat[];
  /** Top functions by invocation count */
  mostCalled: FunctionStat[];
  /** Total invocations */
  totalInvocations: number;
  /** Total errors */
  totalErrors: number;
  /** Overall failure rate percentage */
  overallFailureRate: number;
  /** Whether data is loading */
  isLoading?: boolean;
  /** Retry callback */
  onRetry?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Format a number with K/M suffix for large values.
 */
function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

/**
 * Format execution time in ms.
 */
function formatTime(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms)}ms`;
}

/**
 * Get the function short name from full identifier.
 */
function getShortName(fullName: string): string {
  const parts = fullName.split(":");
  return parts[parts.length - 1] || fullName;
}

/**
 * Get type badge classes
 */
function getTypeBadgeClasses(type: string): string {
  switch (type.toLowerCase()) {
    case "query":
      return "bg-info-bg text-info";
    case "mutation":
      return "bg-success-bg text-success";
    case "action":
      return "bg-warning-bg text-warning";
    default:
      return "bg-surface-alt text-muted";
  }
}

/**
 * Card displaying function health analytics.
 * Matches the Convex dashboard design.
 */
export function FunctionHealthCard({
  topFailing,
  slowest,
  mostCalled,
  totalInvocations,
  totalErrors,
  overallFailureRate,
  isLoading = false,
  onRetry,
  className,
}: FunctionHealthCardProps) {
  return (
    <HealthCard
      title="Function Health"
      tip="Performance analytics for the last hour."
      loading={isLoading}
      error={null}
      className={cn("col-span-2", className)}
      action={
        onRetry && (
          <button
            onClick={onRetry}
            className={cn(
              "p-1 rounded-md border-0",
              "bg-transparent text-muted",
              "hover:bg-overlay hover:text-foreground",
              "cursor-pointer transition-all duration-150",
              "flex items-center justify-center",
            )}
            title="Refresh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        )
      }
    >
      <div className="space-y-4 w-full px-2 pb-2">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground font-mono">
              {formatNumber(totalInvocations)}
            </div>
            <div className="text-xs text-muted">Total Invocations</div>
          </div>
          <div className="text-center">
            <div
              className={cn(
                "text-2xl font-bold font-mono",
                totalErrors > 0 ? "text-error" : "text-success",
              )}
            >
              {formatNumber(totalErrors)}
            </div>
            <div className="text-xs text-muted">Errors</div>
          </div>
          <div className="text-center">
            <div
              className={cn(
                "text-2xl font-bold font-mono",
                overallFailureRate < 1
                  ? "text-success"
                  : overallFailureRate < 5
                    ? "text-warning"
                    : "text-error",
              )}
            >
              {overallFailureRate.toFixed(2)}%
            </div>
            <div className="text-xs text-muted">Failure Rate</div>
          </div>
        </div>

        {/* Function lists */}
        <div className="grid grid-cols-3 gap-4">
          {/* Top Failing */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle className="h-3.5 w-3.5 text-error" />
              <span className="text-xs font-medium text-muted">
                Top Failing
              </span>
            </div>
            {topFailing.length === 0 ? (
              <div className="text-xs text-muted italic">No failures</div>
            ) : (
              <div className="space-y-1.5">
                {topFailing.slice(0, 3).map((fn) => (
                  <div
                    key={fn.name}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span
                        className={cn(
                          "px-1 py-0.5 rounded text-[10px] font-medium uppercase",
                          getTypeBadgeClasses(fn.type),
                        )}
                      >
                        {fn.type.charAt(0)}
                      </span>
                      <span
                        className="text-xs text-foreground truncate font-mono"
                        title={fn.name}
                      >
                        {getShortName(fn.name)}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-error whitespace-nowrap font-mono">
                      {fn.failureRate.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Slowest */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Clock className="h-3.5 w-3.5 text-warning" />
              <span className="text-xs font-medium text-muted">Slowest</span>
            </div>
            {slowest.length === 0 ? (
              <div className="text-xs text-muted italic">No data</div>
            ) : (
              <div className="space-y-1.5">
                {slowest.slice(0, 3).map((fn) => (
                  <div
                    key={fn.name}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span
                        className={cn(
                          "px-1 py-0.5 rounded text-[10px] font-medium uppercase",
                          getTypeBadgeClasses(fn.type),
                        )}
                      >
                        {fn.type.charAt(0)}
                      </span>
                      <span
                        className="text-xs text-foreground truncate font-mono"
                        title={fn.name}
                      >
                        {getShortName(fn.name)}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-warning whitespace-nowrap font-mono">
                      {formatTime(fn.avgExecutionTime)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Most Called */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className="h-3.5 w-3.5 text-success" />
              <span className="text-xs font-medium text-muted">
                Most Called
              </span>
            </div>
            {mostCalled.length === 0 ? (
              <div className="text-xs text-muted italic">No data</div>
            ) : (
              <div className="space-y-1.5">
                {mostCalled.slice(0, 3).map((fn) => (
                  <div
                    key={fn.name}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span
                        className={cn(
                          "px-1 py-0.5 rounded text-[10px] font-medium uppercase",
                          getTypeBadgeClasses(fn.type),
                        )}
                      >
                        {fn.type.charAt(0)}
                      </span>
                      <span
                        className="text-xs text-foreground truncate font-mono"
                        title={fn.name}
                      >
                        {getShortName(fn.name)}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-muted whitespace-nowrap font-mono">
                      {formatNumber(fn.invocations)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </HealthCard>
  );
}
