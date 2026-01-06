import { cn } from "@/lib/utils";
import { Zap, Database, Play, AlertTriangle } from "lucide-react";
import type { FunctionStat } from "../../hooks/useFunctionHealth";

interface FunctionListProps {
  /** List of function stats to display */
  functions: FunctionStat[];
  /** Maximum number of items to show */
  maxItems?: number;
  /** Metric to highlight */
  highlightMetric?: "failureRate" | "avgExecutionTime" | "invocations";
  /** Whether to show the function type badge */
  showType?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Callback when a function is clicked */
  onFunctionClick?: (fn: FunctionStat) => void;
}

interface TypeConfig {
  icon: typeof Zap;
  label: string;
  colorClass: string;
  bgClass: string;
}

const typeConfig: Record<string, TypeConfig> = {
  query: {
    icon: Database,
    label: "Query",
    colorClass: "text-info",
    bgClass: "bg-info-bg",
  },
  Query: {
    icon: Database,
    label: "Query",
    colorClass: "text-info",
    bgClass: "bg-info-bg",
  },
  mutation: {
    icon: Play,
    label: "Mutation",
    colorClass: "text-success",
    bgClass: "bg-success-bg",
  },
  Mutation: {
    icon: Play,
    label: "Mutation",
    colorClass: "text-success",
    bgClass: "bg-success-bg",
  },
  action: {
    icon: Zap,
    label: "Action",
    colorClass: "text-warning",
    bgClass: "bg-warning-bg",
  },
  Action: {
    icon: Zap,
    label: "Action",
    colorClass: "text-warning",
    bgClass: "bg-warning-bg",
  },
  unknown: {
    icon: Zap,
    label: "Unknown",
    colorClass: "text-muted",
    bgClass: "bg-surface-alt",
  },
};

function formatDuration(ms: number): string {
  if (ms < 1) return "<1ms";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

/**
 * Individual function list item
 */
function FunctionListItem({
  fn,
  highlightMetric,
  showType,
  onClick,
}: {
  fn: FunctionStat;
  highlightMetric: "failureRate" | "avgExecutionTime" | "invocations";
  showType: boolean;
  onClick?: () => void;
}) {
  const typeInfo = typeConfig[fn.type] ?? typeConfig.unknown;
  const TypeIcon = typeInfo.icon;

  // Determine the highlighted value based on metric
  let highlightValue: string;
  let highlightLabel: string;
  let isWarning = false;

  switch (highlightMetric) {
    case "failureRate":
      highlightValue = `${fn.failureRate.toFixed(1)}%`;
      highlightLabel = "failure rate";
      isWarning = fn.failureRate > 1;
      break;
    case "avgExecutionTime":
      highlightValue = formatDuration(fn.avgExecutionTime);
      highlightLabel = "avg time";
      isWarning = fn.avgExecutionTime > 1000;
      break;
    case "invocations":
    default:
      highlightValue = formatNumber(fn.invocations);
      highlightLabel = "calls";
      break;
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center justify-between p-2 rounded-lg",
        "transition-colors duration-150",
        "hover:bg-surface-alt",
        onClick && "cursor-pointer",
      )}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {showType && (
          <span
            className={cn(
              "inline-flex items-center justify-center h-5 w-5 rounded shrink-0",
              typeInfo.bgClass,
              typeInfo.colorClass,
            )}
            title={typeInfo.label}
          >
            <TypeIcon size={12} />
          </span>
        )}
        <span className="text-[13px] font-mono text-foreground truncate">
          {fn.name}
        </span>
        {fn.errors > 0 && highlightMetric !== "failureRate" && (
          <span className="inline-flex items-center gap-0.5 text-xs text-error">
            <AlertTriangle size={12} />
            {fn.errors}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <span
            className={cn(
              "text-[13px] font-medium font-mono",
              isWarning ? "text-error" : "text-foreground",
            )}
          >
            {highlightValue}
          </span>
          <span className="text-[11px] text-muted ml-1">{highlightLabel}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * List component for displaying function statistics.
 * Styled with Tailwind for consistent theming.
 */
export function FunctionList({
  functions,
  maxItems = 5,
  highlightMetric = "invocations",
  showType = true,
  className,
  onFunctionClick,
}: FunctionListProps) {
  const displayFunctions = functions.slice(0, maxItems);

  if (displayFunctions.length === 0) {
    return (
      <div className="py-4 text-center text-xs text-muted">
        No functions to display
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {displayFunctions.map((fn, index) => (
        <FunctionListItem
          key={`${fn.name}-${index}`}
          fn={fn}
          highlightMetric={highlightMetric}
          showType={showType}
          onClick={onFunctionClick ? () => onFunctionClick(fn) : undefined}
        />
      ))}
    </div>
  );
}
