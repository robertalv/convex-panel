import { RefreshCw, CheckCircle2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { HealthCard } from "./HealthCard";
import type { Insight } from "@convex-panel/shared/api";

interface InsightsSummaryCardProps {
  /** List of insights from BigBrain API */
  insights: Insight[];
  /** Whether data is loading */
  loading?: boolean;
  /** Error message */
  error?: string | null;
  /** Retry callback */
  onRetry?: () => void;
  /** Callback when an insight is clicked */
  onInsightClick?: (insight: Insight) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get severity level for an insight kind.
 */
function getSeverity(kind: Insight["kind"]): "critical" | "warning" | "info" {
  switch (kind) {
    case "occFailedPermanently":
    case "bytesReadLimit":
    case "documentsReadLimit":
      return "critical";
    case "occRetried":
    case "bytesReadThreshold":
    case "documentsReadThreshold":
      return "warning";
    default:
      return "info";
  }
}

/**
 * Get human-readable problem description for an insight.
 */
function getProblemDescription(insight: Insight): string {
  switch (insight.kind) {
    case "occRetried":
      return `OCC retried ${insight.details.occCalls} times${insight.details.occTableName ? ` on table "${insight.details.occTableName}"` : ""}`;
    case "occFailedPermanently":
      return `OCC failed permanently ${insight.details.occCalls} times${insight.details.occTableName ? ` on table "${insight.details.occTableName}"` : ""}`;
    case "bytesReadLimit":
      return `Hit bytes read limit ${insight.details.count} times`;
    case "bytesReadThreshold":
      return `Approaching bytes read threshold (${insight.details.count} occurrences)`;
    case "documentsReadLimit":
      return `Hit documents read limit ${insight.details.count} times`;
    case "documentsReadThreshold":
      return `Approaching documents read threshold (${insight.details.count} occurrences)`;
    default:
      return "Unknown issue";
  }
}

/**
 * Get severity badge classes
 */
function getSeverityClasses(severity: "critical" | "warning" | "info"): {
  bgClass: string;
  textClass: string;
} {
  switch (severity) {
    case "critical":
      return {
        bgClass: "bg-error-bg",
        textClass: "text-error",
      };
    case "warning":
      return {
        bgClass: "bg-warning-bg",
        textClass: "text-warning",
      };
    case "info":
      return {
        bgClass: "bg-info-bg",
        textClass: "text-info",
      };
  }
}

/**
 * Severity badge component.
 */
function SeverityBadge({
  severity,
}: {
  severity: "critical" | "warning" | "info";
}) {
  const classes = getSeverityClasses(severity);

  return (
    <span
      className={cn(
        "px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase",
        classes.bgClass,
        classes.textClass,
      )}
    >
      {severity}
    </span>
  );
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
 * Get time range for display (last 7 days)
 */
function getTimeRange(): string {
  const now = new Date();
  const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  return `${formatDate(from)} - ${formatDate(now)}`;
}

/**
 * Card displaying insights summary from BigBrain API.
 * Matches the Convex dashboard design.
 */
export function InsightsSummaryCard({
  insights,
  loading = false,
  error = null,
  onRetry,
  onInsightClick,
  className,
}: InsightsSummaryCardProps) {
  return (
    <HealthCard
      title="Insights"
      tip={`Performance insights from ${getTimeRange()}`}
      loading={loading}
      error={error}
      className={className}
      action={onRetry && <RefreshButton onClick={onRetry} />}
    >
      {insights.length > 0 ? (
        <div className="flex flex-col gap-1 w-full">
          {/* Table header */}
          <div className="grid grid-cols-[60px_1fr_1.5fr] gap-2 text-[10px] text-muted border-b border-border pb-2 mb-2">
            <span>Severity</span>
            <span>Function</span>
            <span>Problem</span>
          </div>

          {/* Insights list */}
          {insights.slice(0, 5).map((insight, idx) => {
            const severity = getSeverity(insight.kind);
            return (
              <div
                key={idx}
                onClick={() => onInsightClick?.(insight)}
                className={cn(
                  "grid grid-cols-[60px_1fr_1.5fr] gap-2 py-2 items-center",
                  idx < Math.min(insights.length, 5) - 1 &&
                    "border-b border-border",
                  onInsightClick && "cursor-pointer hover:bg-overlay transition-colors rounded px-1",
                )}
              >
                <SeverityBadge severity={severity} />
                <span
                  className="text-xs text-foreground truncate font-mono"
                  title={insight.functionId}
                >
                  {insight.functionId}
                </span>
                <span
                  className="text-xs text-muted truncate"
                  title={getProblemDescription(insight)}
                >
                  {getProblemDescription(insight)}
                </span>
              </div>
            );
          })}

          {insights.length > 5 && (
            <div className="text-xs text-muted pt-2">
              +{insights.length - 5} more insights
            </div>
          )}
        </div>
      ) : !loading ? (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-9 h-9 rounded-lg bg-success-bg border border-success/30 flex items-center justify-center mb-2.5">
            <CheckCircle2 size={18} className="text-success" />
          </div>
          <h3 className="text-sm font-medium text-foreground mb-1">
            All clear!
          </h3>
          <p className="text-[11px] text-muted text-center mb-3">
            There are no issues here to address.
          </p>
          <a
            href="https://docs.convex.dev/dashboard/deployments/health#insights"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-medium flex items-center gap-1 text-accent hover:text-accent/80 transition-colors"
          >
            <ExternalLink size={12} />
            Learn more about Insights
          </a>
        </div>
      ) : null}
    </HealthCard>
  );
}
