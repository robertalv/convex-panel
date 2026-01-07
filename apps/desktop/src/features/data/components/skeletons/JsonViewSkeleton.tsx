/**
 * JsonViewSkeleton Component
 * Skeleton loading state that matches the exact layout of JsonView with DocumentJsonBlocks
 * Displays animated JSON block placeholders
 */

import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown } from "lucide-react";

// Default fields to show in skeleton JSON blocks
const SKELETON_FIELDS = ["_id", "name", "email", "status", "_creationTime"];

interface JsonViewSkeletonProps {
  /** Number of JSON blocks to display */
  blocks?: number;
  /** Fields to show per block */
  fields?: string[];
}

function JsonBlockSkeleton({
  fields,
  delayOffset = 0,
}: {
  fields: string[];
  delayOffset: number;
}) {
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        backgroundColor: "var(--color-surface-base)",
        border: "1px solid var(--color-border-base)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ backgroundColor: "var(--color-surface-raised)" }}
      >
        <div className="flex items-center gap-2">
          <span style={{ color: "var(--color-text-muted)", opacity: 0.5 }}>
            <ChevronDown size={14} />
          </span>
          {/* Document ID skeleton */}
          <Skeleton
            className="h-4 rounded"
            style={{
              width: "180px",
              animationDelay: `${delayOffset}s`,
            }}
          />
        </div>
        {/* Copy button skeleton */}
        <Skeleton
          className="w-5 h-5 rounded"
          style={{ animationDelay: `${delayOffset + 0.02}s` }}
        />
      </div>

      {/* JSON Content */}
      <div className="py-2 overflow-x-auto">
        {/* Opening brace */}
        <div
          className="font-mono text-xs pl-3"
          style={{ color: "var(--color-text-muted)", opacity: 0.4 }}
        >
          {"{"}
        </div>

        {/* Fields */}
        {fields.map((field, idx) => {
          const indent = 16; // depth 1
          const isIdField = field === "_id";
          const isDateField = field === "_creationTime";
          const valueWidth = isIdField
            ? 200
            : isDateField
              ? 160
              : 60 + (idx % 4) * 30;

          return (
            <div
              key={field}
              className="flex items-center font-mono text-xs py-0.5"
              style={{ paddingLeft: indent }}
            >
              {/* Key skeleton */}
              <Skeleton
                className="h-3 rounded mr-1"
                style={{
                  width: `${40 + field.length * 5}px`,
                  animationDelay: `${delayOffset + idx * 0.04}s`,
                }}
              />
              {/* Colon */}
              <span
                style={{ color: "var(--color-text-muted)", opacity: 0.3 }}
                className="mx-1"
              >
                :
              </span>
              {/* Value skeleton */}
              <Skeleton
                className="h-3 rounded"
                style={{
                  width: `${valueWidth}px`,
                  animationDelay: `${delayOffset + idx * 0.04 + 0.02}s`,
                }}
              />
              {/* Comma */}
              {idx < fields.length - 1 && (
                <span
                  style={{ color: "var(--color-text-muted)", opacity: 0.3 }}
                  className="ml-0.5"
                >
                  ,
                </span>
              )}
            </div>
          );
        })}

        {/* Closing brace */}
        <div
          className="font-mono text-xs pl-3"
          style={{ color: "var(--color-text-muted)", opacity: 0.4 }}
        >
          {"}"}
        </div>
      </div>
    </div>
  );
}

export function JsonViewSkeleton({
  blocks = 5,
  fields = SKELETON_FIELDS,
}: JsonViewSkeletonProps) {
  return (
    <div className="h-full overflow-auto p-4">
      <div className="space-y-3 max-w-5xl">
        {Array.from({ length: blocks }).map((_, index) => (
          <JsonBlockSkeleton
            key={index}
            fields={fields}
            delayOffset={index * 0.06}
          />
        ))}
      </div>
    </div>
  );
}

export default JsonViewSkeleton;
