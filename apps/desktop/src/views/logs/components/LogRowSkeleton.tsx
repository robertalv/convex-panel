/**
 * LogRowSkeleton Component
 * Skeleton loading state that matches the exact layout of LogRow
 */

import { Skeleton } from "@/components/ui/skeleton";
import { ITEM_SIZE } from "./LogRow";

interface LogRowSkeletonProps {
  /** Row index for staggered animation */
  index?: number;
}

export function LogRowSkeleton({ index = 0 }: LogRowSkeletonProps) {
  // Stagger animation delay based on index
  const delay = index * 0.03;

  return (
    <div
      className="flex items-center px-4 py-1"
      style={{
        height: ITEM_SIZE,
        fontFamily: "monospace",
        fontSize: "12px",
        borderBottom: "1px solid transparent",
      }}
    >
      {/* Timestamp - 148px */}
      <div style={{ width: "148px" }}>
        <Skeleton
          className="h-3 rounded"
          style={{
            width: "120px",
            animationDelay: `${delay}s`,
          }}
        />
      </div>

      {/* Request ID badge - 60px */}
      <div style={{ width: "60px" }}>
        <Skeleton
          className="h-4 rounded"
          style={{
            width: "36px",
            animationDelay: `${delay + 0.01}s`,
          }}
        />
      </div>

      {/* Status and duration - 112px */}
      <div
        style={{
          width: "112px",
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        <Skeleton
          className="h-3 rounded"
          style={{
            width: "24px",
            animationDelay: `${delay + 0.02}s`,
          }}
        />
        <Skeleton
          className="h-3 rounded"
          style={{
            width: "32px",
            animationDelay: `${delay + 0.025}s`,
          }}
        />
      </div>

      {/* Function - flex: 1 */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        {/* Function type icon */}
        <Skeleton
          className="h-4 w-4 rounded-md shrink-0"
          style={{ animationDelay: `${delay + 0.03}s` }}
        />

        {/* Function name */}
        <Skeleton
          className="h-3 rounded"
          style={{
            width: `${80 + (index % 5) * 30}px`,
            maxWidth: "200px",
            animationDelay: `${delay + 0.035}s`,
          }}
        />

        {/* Console output preview (sometimes) */}
        {index % 3 !== 0 && (
          <Skeleton
            className="h-3 rounded flex-1"
            style={{
              maxWidth: "300px",
              animationDelay: `${delay + 0.04}s`,
            }}
          />
        )}
      </div>
    </div>
  );
}

interface LogsSkeletonListProps {
  /** Number of skeleton rows to show */
  count?: number;
}

/**
 * A list of skeleton log rows for loading state
 */
export function LogsSkeletonList({ count = 20 }: LogsSkeletonListProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <LogRowSkeleton key={i} index={i} />
      ))}
    </>
  );
}

export default LogRowSkeleton;
