/**
 * DataSidebarSkeleton Component
 * Skeleton loading state that matches the exact layout of DataSidebar
 * Displays animated tree item placeholders
 */

import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, Database, Search } from "lucide-react";

interface DataSidebarSkeletonProps {
  /** Width of the sidebar */
  width: number;
  /** Number of table items to display */
  tableCount?: number;
  /** Whether to show recently viewed section */
  showRecentlyViewed?: boolean;
}

function TreeItemSkeleton({
  hasIcon = true,
  delayOffset = 0,
  labelWidth = 80,
}: {
  hasIcon?: boolean;
  delayOffset: number;
  labelWidth?: number;
}) {
  return (
    <div className="flex items-center h-7 text-xs" style={{ paddingLeft: 12 }}>
      {/* Expand indicator space */}
      <span className="w-4 mr-1" />
      {/* Icon */}
      {hasIcon && (
        <Skeleton
          className="w-3 h-3 rounded mr-2 shrink-0"
          style={{ animationDelay: `${delayOffset}s` }}
        />
      )}
      {/* Label */}
      <Skeleton
        className="h-3 rounded flex-1"
        style={{
          width: `${labelWidth}px`,
          maxWidth: "70%",
          animationDelay: `${delayOffset + 0.02}s`,
        }}
      />
    </div>
  );
}

export function DataSidebarSkeleton({
  width,
  tableCount = 8,
  showRecentlyViewed = false,
}: DataSidebarSkeletonProps) {
  return (
    <div
      className="flex flex-col h-full"
      style={{
        width,
        backgroundColor: "var(--color-surface-base)",
        borderRight: "1px solid var(--color-border-base)",
      }}
    >
      {/* Search input */}
      <div
        className="p-2"
        style={{ borderBottom: "1px solid var(--color-border-base)" }}
      >
        <div className="relative">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2"
            style={{ color: "var(--color-text-muted)", opacity: 0.5 }}
          />
          <div
            className="w-full pl-8 pr-8 py-1.5 text-xs rounded-md"
            style={{
              backgroundColor: "var(--color-surface-raised)",
              border: "1px solid var(--color-border-base)",
              height: "28px",
            }}
          />
        </div>
      </div>

      {/* Tree content */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ scrollbarColor: "var(--color-border-strong) transparent" }}
      >
        {/* Recently Viewed section (optional) */}
        {showRecentlyViewed && (
          <>
            <div
              className="flex items-center h-7 text-xs"
              style={{ paddingLeft: 12 }}
            >
              <span
                className="w-4 h-4 flex items-center justify-center mr-1"
                style={{ color: "var(--color-text-muted)", opacity: 0.5 }}
              >
                <ChevronDown size={12} />
              </span>
              <Skeleton className="w-3 h-3 rounded mr-2" />
              <Skeleton className="h-3 w-24 rounded" />
            </div>

            {/* Recent items */}
            {Array.from({ length: 3 }).map((_, index) => (
              <TreeItemSkeleton
                key={`recent-${index}`}
                delayOffset={index * 0.03}
                labelWidth={60 + (index % 3) * 20}
              />
            ))}

            <div
              className="h-px my-2 mx-2"
              style={{ backgroundColor: "var(--color-border-base)" }}
            />
          </>
        )}

        {/* Tables section header */}
        <div
          className="flex items-center h-7 text-xs"
          style={{ paddingLeft: 12 }}
        >
          <span
            className="w-4 h-4 flex items-center justify-center mr-1"
            style={{ color: "var(--color-text-muted)", opacity: 0.5 }}
          >
            <ChevronDown size={12} />
          </span>
          <Database
            size={14}
            style={{ color: "var(--color-text-muted)", opacity: 0.5 }}
            className="mr-2"
          />
          <span
            className="flex-1 text-xs"
            style={{ color: "var(--color-text-muted)", opacity: 0.7 }}
          >
            Tables
          </span>
          <Skeleton className="w-4 h-3 rounded mr-2" />
        </div>

        {/* Table items */}
        {Array.from({ length: tableCount }).map((_, index) => {
          // Vary the label widths for visual interest
          const widths = [70, 85, 60, 95, 75, 80, 65, 90];
          return (
            <TreeItemSkeleton
              key={index}
              delayOffset={0.1 + index * 0.04}
              labelWidth={widths[index % widths.length]}
            />
          );
        })}
      </div>

      {/* Stats footer */}
      <div
        className="p-2 text-[10px] flex items-center justify-between"
        style={{
          borderTop: "1px solid var(--color-border-base)",
          color: "var(--color-text-muted)",
        }}
      >
        <Skeleton className="w-12 h-3 rounded" />
        <Skeleton className="w-16 h-3 rounded" />
      </div>
    </div>
  );
}

export default DataSidebarSkeleton;
