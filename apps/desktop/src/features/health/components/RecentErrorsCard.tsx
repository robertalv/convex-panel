import { RefreshCw, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { HealthCard } from "@/components/ui";
import type { ErrorSummary } from "../hooks/useRecentErrors";

interface RecentErrorsCardProps {
  /** Total error count */
  errorCount: number;
  /** Top error messages */
  topErrors: ErrorSummary[];
  /** Whether data is loading */
  isLoading?: boolean;
  /** Retry callback */
  onRetry?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Truncate error message to a reasonable length.
 */
function truncateMessage(message: string, maxLength: number = 60): string {
  if (message.length <= maxLength) return message;
  return `${message.slice(0, maxLength)}...`;
}

/**
 * Card displaying recent errors summary.
 * Matches the Convex dashboard design.
 */
export function RecentErrorsCard({
  errorCount,
  topErrors,
  isLoading = false,
  onRetry,
  className,
}: RecentErrorsCardProps) {
  return (
    <HealthCard
      title="Recent Errors"
      tip="Errors in the last hour."
      loading={isLoading}
      error={null}
      className={className}
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
      <div className="space-y-3 w-full px-2 pb-2">
        {/* Error count */}
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex items-center justify-center w-12 h-12 rounded-lg",
              errorCount === 0 && "bg-success-bg text-success",
              errorCount > 0 && errorCount < 10 && "bg-warning-bg text-warning",
              errorCount >= 10 && "bg-error-bg text-error",
            )}
          >
            <span className="text-xl font-bold font-mono">{errorCount}</span>
          </div>
          <div>
            <div className="text-sm font-medium text-foreground">
              {errorCount === 0
                ? "No errors"
                : errorCount === 1
                  ? "1 error"
                  : `${errorCount} errors`}
            </div>
            <div className="text-xs text-muted">in the last hour</div>
          </div>
        </div>

        {/* Top errors list */}
        {topErrors.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-muted mb-2">
              Most frequent errors
            </div>
            {topErrors.slice(0, 4).map((err, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-2 rounded-lg bg-surface-alt hover:bg-overlay transition-colors cursor-default group"
              >
                <ChevronRight className="h-3 w-3 text-muted mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div
                    className="text-xs text-foreground truncate font-mono"
                    title={err.message}
                  >
                    {truncateMessage(err.message)}
                  </div>
                </div>
                <div className="shrink-0">
                  <span
                    className={cn(
                      "text-xs font-medium px-1.5 py-0.5 rounded font-mono",
                      err.count >= 10
                        ? "bg-error-bg text-error"
                        : "bg-warning-bg text-warning",
                    )}
                  >
                    {err.count}x
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {errorCount === 0 && (
          <div className="text-center py-2">
            <div className="text-success text-sm font-medium">All clear!</div>
            <div className="text-xs text-muted">No errors in the last hour</div>
          </div>
        )}
      </div>
    </HealthCard>
  );
}
