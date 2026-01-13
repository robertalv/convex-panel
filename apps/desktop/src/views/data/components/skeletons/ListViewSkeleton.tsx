/**
 * ListViewSkeleton Component
 * Skeleton loading state that matches the exact layout of ListView with DocumentCards
 * Displays animated card placeholders
 */

import { Skeleton } from "@/components/ui/skeleton";

// Constants matching DocumentCard layout
const LABEL_MIN_WIDTH = 100;

// Default fields to show in skeleton cards
const SKELETON_FIELDS = ["_id", "name", "email", "status", "_creationTime"];

interface ListViewSkeletonProps {
  /** Number of cards to display */
  cards?: number;
  /** Fields to show per card */
  fields?: string[];
}

function DocumentCardSkeleton({
  fields,
  delayOffset = 0,
}: {
  fields: string[];
  delayOffset: number;
}) {
  return (
    <div
      className="rounded-lg"
      style={{
        backgroundColor: "var(--color-surface-base)",
        border: "1px solid var(--color-border-base)",
      }}
    >
      <div className="p-3 space-y-1">
        {fields.map((field, idx) => {
          // Vary widths based on field type
          const isIdField = field === "_id";
          const isDateField = field === "_creationTime";
          const valueWidth = isIdField
            ? 180
            : isDateField
              ? 140
              : 60 + (idx % 3) * 40;

          return (
            <div key={field} className="flex items-start gap-2 text-xs">
              {/* Field name skeleton */}
              <Skeleton
                className="h-4 rounded shrink-0"
                style={{
                  minWidth: LABEL_MIN_WIDTH,
                  width: `${40 + field.length * 6}px`,
                  maxWidth: LABEL_MIN_WIDTH,
                  animationDelay: `${delayOffset + idx * 0.03}s`,
                }}
              />
              {/* Colon placeholder */}
              <span
                className="text-[11px]"
                style={{ color: "var(--color-text-subtle)", opacity: 0.3 }}
              >
                :
              </span>
              {/* Value skeleton */}
              <Skeleton
                className="h-4 rounded flex-1"
                style={{
                  width: `${valueWidth}px`,
                  maxWidth: "60%",
                  animationDelay: `${delayOffset + idx * 0.03 + 0.015}s`,
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ListViewSkeleton({
  cards = 6,
  fields = SKELETON_FIELDS,
}: ListViewSkeletonProps) {
  return (
    <div className="h-full overflow-auto p-4">
      <div className="space-y-3 max-w-4xl">
        {Array.from({ length: cards }).map((_, index) => (
          <DocumentCardSkeleton
            key={index}
            fields={fields}
            delayOffset={index * 0.05}
          />
        ))}
      </div>
    </div>
  );
}

export default ListViewSkeleton;
