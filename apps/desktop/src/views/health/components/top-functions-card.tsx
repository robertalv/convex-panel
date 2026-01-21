
import { HealthCard } from "@/components/ui";
import { FunctionList } from "./base/function-list";
import { EmptyState } from "./base/empty-state";
import type { FunctionStat } from "../hooks/useFunctionHealth";

interface TopFunctionsCardProps {
  functions: FunctionStat[];
  maxItems?: number;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
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
  className,
}: TopFunctionsCardProps) {
  return (
    <HealthCard
      title="Top Functions"
      tip="Most called functions in the last hour."
      loading={isLoading}
      error={error}
      className={className}
    >
      {!functions || functions.length === 0 ? (
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
