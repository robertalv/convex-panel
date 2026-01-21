import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { HealthCard } from "@/components/ui";
import type { FunctionStat } from "../hooks/useFunctionHealth";
import {
  getFunctionTypeBadge,
  getFunctionTypeBadgeClasses,
} from "@/utils/metrics";
import { Icon } from "@/components/ui/icon";

interface TopErrorsCardProps {
  functions: FunctionStat[];
  totalErrors?: number;
  maxItems?: number;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

function getErrorCountColorClass(count: number): string {
  if (count === 0) return "text-success";
  if (count < 10) return "text-warning";
  return "text-error";
}

function getErrorRateColorClass(rate: number): string {
  if (rate > 50) return "text-error";
  return "text-warning";
}

function getBarColorClass(rate: number): string {
  if (rate > 50) return "bg-error";
  return "bg-warning";
}

function getBarGlowStyle(rate: number): React.CSSProperties {
  if (rate > 50) {
    return { boxShadow: "0 0 8px var(--color-error-base)" };
  }
  return { boxShadow: "0 0 8px var(--color-warning-base)" };
}

export function TopErrorsCard({
  functions,
  totalErrors = 0,
  maxItems = 5,
  loading = false,
  error = null,
  className,
}: TopErrorsCardProps) {
  const displayFunctions = useMemo(() => {
    if (!functions || !Array.isArray(functions)) return [];
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
      tip="Functions with the most errors in the last hour. The percentage represents the failure rate relative to total calls for that function."
      loading={loading}
      error={error}
      className={className}
    >
      <div className="flex flex-col gap-6">
        {/* Summary Header */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span
                className={cn(
                  "font-mono text-4xl font-bold tracking-tighter",
                  getErrorCountColorClass(totalErrors),
                )}
              >
                {totalErrors.toLocaleString()}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
                Total Errors
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <div
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  totalErrors > 0 ? "bg-error animate-pulse" : "bg-success",
                )}
              />
              <span className="text-[9px] font-bold text-subtle uppercase tracking-tight">
                Real-time Stream
              </span>
            </div>
          </div>

          {totalErrors > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-error/5 border border-error/10 text-[10px] font-bold text-error">
              <Icon name="alert-circle" size={12} />
              CRITICAL THRESHOLD
            </div>
          )}
        </div>

        {/* Error Functions List */}
        {displayFunctions.length > 0 ? (
          <div className="flex flex-col gap-4">
            {displayFunctions.map((fn) => {
              const typeClasses = getFunctionTypeBadgeClasses(fn.type);

              return (
                <div
                  key={fn.name}
                  className="group flex flex-col gap-2 rounded-xl border border-transparent p-1.5 transition-all hover:bg-surface-alt/40 hover:border-border/50"
                >
                  <div className="flex items-center gap-3">
                    {/* Type Badge */}
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter shrink-0",
                        typeClasses.bgClass,
                        typeClasses.colorClass,
                      )}
                    >
                      {getFunctionTypeBadge(fn.type)}
                    </span>

                    {/* Function Name */}
                    <span
                      className="text-xs font-mono font-bold text-foreground truncate flex-1 tracking-tight"
                      title={fn.name}
                    >
                      {fn.name}
                    </span>

                    {/* Stats */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={cn(
                          "text-[10px] font-bold font-mono",
                          getErrorRateColorClass(fn.failureRate),
                        )}
                      >
                        {fn.failureRate.toFixed(1)}%
                      </span>
                      <span className="text-[10px] font-black text-muted font-mono">
                        [{fn.errors}]
                      </span>
                    </div>
                  </div>

                  {/* Visual Bar */}
                  <div className="h-1 w-full bg-surface-alt rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-1000 ease-out",
                        getBarColorClass(fn.failureRate),
                      )}
                      style={{
                        width: `${Math.min(100, (fn.errors / maxErrors) * 100)}%`,
                        ...getBarGlowStyle(fn.failureRate),
                      }}
                    />
                  </div>

                  {/* Last Error Preview */}
                  {fn.lastError && (
                    <div className="flex items-center gap-2 mt-1 px-2 py-1.5 rounded-md bg-surface-alt/50 border border-border/30 group-hover:border-border/50 transition-colors">
                      <Icon name="terminal" size={10} className="text-muted shrink-0" />
                      <p
                        className="text-[10px] font-mono text-subtle italic truncate flex-1"
                        title={fn.lastError}
                      >
                        {fn.lastError}
                      </p>
                      <Icon name="external-link" size={10} className="text-muted/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:text-foreground shrink-0" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : !loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-success/80">
            <div className="p-4 rounded-full bg-success/5 border border-success/10 mb-4">
              <Icon name="checkmark-circle" size={32} />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em]">
              All Systems Nominal
            </span>
            <p className="mt-2 text-[10px] text-muted text-center max-w-[200px]">
              No errors detected in the previous 60 minute window.
            </p>
          </div>
        ) : null}
      </div>
    </HealthCard>
  );
}
