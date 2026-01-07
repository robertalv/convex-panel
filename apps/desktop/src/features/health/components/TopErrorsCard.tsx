import { useMemo } from "react";
import { RefreshCw, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { HealthCard } from "./HealthCard";
import type { FunctionStat } from "../hooks/useFunctionHealth";

interface TopErrorsCardProps {
  /** List of functions with errors, sorted by error count */
  functions: FunctionStat[];
  /** Total error count */
  totalErrors: number;
  /** Maximum number of functions to display */
  maxItems?: number;
  /** Whether data is loading */
  loading?: boolean;
  /** Error message */
  error?: string | null;
  /** Retry callback */
  onRetry?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get the type badge abbreviation for a function type.
 */
function getTypeBadge(type: string): string {
  const normalized = type.toLowerCase();
  if (normalized === "query" || normalized === "q") return "Q";
  if (normalized === "mutation" || normalized === "m") return "M";
  if (
    normalized === "httpaction" ||
    normalized === "http" ||
    normalized === "h"
  )
    return "HTTP";
  return "A";
}

/**
 * Get color classes based on error rate.
 */
function getErrorRateColorClass(rate: number): string {
  if (rate > 50) return "text-error";
  return "text-warning";
}

/**
 * Get bar color class based on error rate.
 */
function getBarColorClass(rate: number): string {
  if (rate > 50) return "bg-error";
  return "bg-warning";
}

interface TypeBadgeConfig {
  colorClass: string;
  bgClass: string;
}

/**
 * Get type badge styling classes
 */
function getTypeBadgeClasses(type: string): TypeBadgeConfig {
  const normalized = type.toLowerCase();
  if (normalized === "query") {
    return {
      colorClass: "text-info",
      bgClass: "bg-info/15",
    };
  }
  if (normalized === "mutation") {
    return {
      colorClass: "text-success",
      bgClass: "bg-success/15",
    };
  }
  if (normalized === "action") {
    return {
      colorClass: "text-warning",
      bgClass: "bg-warning/15",
    };
  }
  if (normalized === "httpaction") {
    return {
      colorClass: "text-[#8b5cf6]",
      bgClass: "bg-[rgba(139,92,246,0.15)]",
    };
  }
  return {
    colorClass: "text-muted",
    bgClass: "bg-surface-alt",
  };
}

/**
 * Truncate error message
 */
function truncateError(error: string, maxLen: number = 60): string {
  if (error.length <= maxLen) return error;
  return error.substring(0, maxLen) + "...";
}

/**
 * Action button for card header
 */
function RefreshButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="Refresh"
      className={cn(
        "p-1 rounded-md border-0",
        "bg-transparent text-muted",
        "hover:bg-overlay hover:text-foreground",
        "cursor-pointer transition-all duration-150",
        "flex items-center justify-center",
      )}
    >
      <RefreshCw size={14} />
    </button>
  );
}

/**
 * Card displaying functions with the most errors.
 * Matches the Convex dashboard design with error bars and lastError preview.
 */
export function TopErrorsCard({
  functions,
  totalErrors,
  maxItems = 5,
  loading = false,
  error = null,
  onRetry,
  className,
}: TopErrorsCardProps) {
  // Filter and sort by error count
  const displayFunctions = useMemo(() => {
    return [...functions]
      .filter((f) => f.errors > 0)
      .sort((a, b) => b.errors - a.errors)
      .slice(0, maxItems);
  }, [functions, maxItems]);

  const maxErrors = useMemo(() => {
    if (displayFunctions.length === 0) return 1;
    return Math.max(...displayFunctions.map((f) => f.errors));
  }, [displayFunctions]);

  return (
    <HealthCard
      title="Top Errors"
      tip="Functions with the most errors in the last hour. High error rates may indicate bugs, invalid inputs, or infrastructure issues."
      loading={loading}
      error={error}
      className={className}
      action={onRetry && <RefreshButton onClick={onRetry} />}
    >
      <div className="flex flex-col gap-4 w-full">
        {/* Summary */}
        <div className="flex items-baseline gap-2">
          <span
            className={cn(
              "text-2xl font-semibold font-mono",
              totalErrors === 0
                ? "text-success"
                : totalErrors < 10
                  ? "text-warning"
                  : "text-error",
            )}
          >
            {totalErrors.toLocaleString()}
          </span>
          <span className="text-xs text-muted">total errors (1h)</span>
        </div>

        {/* Error functions list */}
        {displayFunctions.length > 0 ? (
          <div className="flex flex-col gap-3">
            {displayFunctions.map((fn) => {
              const typeClasses = getTypeBadgeClasses(fn.type);

              return (
                <div key={fn.name} className="flex flex-col gap-1">
                  {/* Function name row */}
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase shrink-0",
                        typeClasses.bgClass,
                        typeClasses.colorClass,
                      )}
                    >
                      {getTypeBadge(fn.type)}
                    </span>
                    <span
                      className="text-xs text-foreground truncate flex-1 font-mono"
                      title={fn.name}
                    >
                      {fn.name}
                    </span>
                    <span
                      className={cn(
                        "text-[11px] font-medium shrink-0 font-mono",
                        getErrorRateColorClass(fn.failureRate),
                      )}
                    >
                      {fn.errors} ({fn.failureRate.toFixed(1)}%)
                    </span>
                  </div>

                  {/* Error bar */}
                  <div className="h-1 bg-surface-alt rounded-sm overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-sm transition-all duration-300",
                        getBarColorClass(fn.failureRate),
                      )}
                      style={{
                        width: `${Math.min(100, (fn.errors / maxErrors) * 100)}%`,
                      }}
                    />
                  </div>

                  {/* Last error message preview */}
                  {fn.lastError && (
                    <p
                      className="text-[10px] text-muted italic truncate"
                      title={fn.lastError}
                    >
                      {truncateError(fn.lastError)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : !loading ? (
          <div className="flex flex-col items-center justify-center h-24 text-success">
            <CheckCircle size={24} className="opacity-70 mb-2" />
            <span className="text-[13px]">No errors in the last hour</span>
          </div>
        ) : null}
      </div>
    </HealthCard>
  );
}
