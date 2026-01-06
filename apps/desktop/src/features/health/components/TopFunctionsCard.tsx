import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { HealthCard } from "./HealthCard";
import { FunctionList } from "./base/FunctionList";
import { EmptyState } from "./base/EmptyState";
import type { FunctionStat } from "../hooks/useFunctionHealth";

interface TopFunctionsCardProps {
  /** List of top functions by invocation count */
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
 * Card displaying the most called functions by invocation count.
 * Matches the Convex dashboard design.
 */
export function TopFunctionsCard({
  functions,
  maxItems = 5,
  isLoading = false,
  error = null,
  onRetry,
  className,
}: TopFunctionsCardProps) {
  return (
    <HealthCard
      title="Top Functions"
      tip="Most called functions in the last hour."
      loading={isLoading}
      error={error}
      className={className}
      action={onRetry && <RefreshButton onClick={onRetry} />}
    >
      {functions.length === 0 ? (
        <EmptyState
          variant="empty"
          title="No data yet"
          description="Function invocation data will appear here once available."
        />
      ) : (
        <div className="w-full">
          <FunctionList
            functions={functions}
            maxItems={maxItems}
            highlightMetric="invocations"
            showType
          />
        </div>
      )}
    </HealthCard>
  );
}
