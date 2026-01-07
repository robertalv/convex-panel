import { useMemo } from "react";
import { RefreshCw, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { HealthCard } from "./HealthCard";
import type { FunctionStat } from "../hooks/useFunctionHealth";

interface SlowestFunctionsCardProps {
  /** List of slowest functions */
  functions: FunctionStat[];
  /** Maximum number of functions to display */
  maxItems?: number;
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
 * Get type badge abbreviation and classes
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

interface TypeBadgeConfig {
  colorClass: string;
  bgClass: string;
}

function getTypeBadgeClasses(type: string): TypeBadgeConfig {
  const normalized = type.toLowerCase();
  if (normalized === "query") {
    return { colorClass: "text-info", bgClass: "bg-info/15" };
  }
  if (normalized === "mutation") {
    return { colorClass: "text-success", bgClass: "bg-success/15" };
  }
  if (normalized === "action") {
    return { colorClass: "text-warning", bgClass: "bg-warning/15" };
  }
  if (normalized === "httpaction") {
    return {
      colorClass: "text-[#8b5cf6]",
      bgClass: "bg-[rgba(139,92,246,0.15)]",
    };
  }
  return { colorClass: "text-muted", bgClass: "bg-surface-alt" };
}

/**
 * Get color class based on latency
 */
function getLatencyColorClass(ms: number): string {
  if (ms > 5000) return "text-error"; // Red for > 5s
  if (ms > 1000) return "text-warning"; // Orange for > 1s
  if (ms > 500) return "text-yellow-500"; // Yellow for > 500ms
  return "text-foreground";
}

/**
 * Get bar color class based on latency
 */
function getBarColorClass(ms: number): string {
  if (ms > 5000) return "bg-error";
  if (ms > 1000) return "bg-warning";
  if (ms > 500) return "bg-yellow-500";
  return "bg-success";
}

/**
 * Format latency to human readable
 */
function formatLatency(ms: number): string {
  if (ms < 1) return "<1ms";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
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
 * Card displaying the slowest functions by p95 latency.
 * Matches the Convex dashboard design with latency bars.
 */
export function SlowestFunctionsCard({
  functions,
  maxItems = 5,
  isLoading = false,
  error = null,
  onRetry,
  className,
}: SlowestFunctionsCardProps) {
  // Sort by p95 latency and take top N
  const displayFunctions = useMemo(() => {
    if (!functions || !Array.isArray(functions)) return [];

    return [...functions]
      .filter((f) => f && f.p95Latency != null && f.p95Latency > 0)
      .sort((a, b) => (b.p95Latency || 0) - (a.p95Latency || 0))
      .slice(0, maxItems);
  }, [functions, maxItems]);

  // Find max p95 for bar scaling
  const maxP95 = useMemo(() => {
    if (displayFunctions.length === 0) return 1000;
    return Math.max(...displayFunctions.map((f) => f.p95Latency));
  }, [displayFunctions]);

  return (
    <HealthCard
      title="Slowest Functions"
      tip="Top functions by p95 latency. Functions with high latency may benefit from optimization, caching, or splitting into smaller operations."
      loading={isLoading}
      error={error}
      className={className}
      action={onRetry && <RefreshButton onClick={onRetry} />}
    >
      {displayFunctions.length > 0 ? (
        <div className="flex flex-col gap-3 w-full">
          {displayFunctions.map((fn) => {
            const typeClasses = getTypeBadgeClasses(fn.type);

            return (
              <div key={fn.name} className="flex flex-col gap-1.5">
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
                  <span className="text-[10px] text-muted shrink-0">
                    {(fn.invocations || 0).toLocaleString()} calls
                  </span>
                </div>

                {/* Latency bar and values */}
                <div className="flex items-center gap-2">
                  {/* Latency bar */}
                  <div className="flex-1 h-1.5 bg-surface-alt rounded-sm overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-sm transition-all duration-300",
                        getBarColorClass(fn.p95Latency),
                      )}
                      style={{
                        width: `${Math.min(100, ((fn.p95Latency || 0) / maxP95) * 100)}%`,
                      }}
                    />
                  </div>

                  {/* Latency values */}
                  <div className="flex gap-2 text-[10px] shrink-0">
                    <span className="text-muted">
                      p50:{" "}
                      <span className="text-foreground font-mono">
                        {formatLatency(fn.p50Latency || 0)}
                      </span>
                    </span>
                    <span className="text-muted">
                      p95:{" "}
                      <span
                        className={cn(
                          "font-medium font-mono",
                          getLatencyColorClass(fn.p95Latency || 0),
                        )}
                      >
                        {formatLatency(fn.p95Latency || 0)}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : !isLoading ? (
        <div className="flex flex-col items-center justify-center h-32 text-muted">
          <Clock size={24} className="opacity-50 mb-2" />
          <span className="text-xs">No latency data available</span>
        </div>
      ) : null}
    </HealthCard>
  );
}
