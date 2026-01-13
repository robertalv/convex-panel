/**
 * EmptyScheduledJobsState
 * Empty state component for scheduled jobs table with skeleton loader
 */

import { useEffect, useRef, useState } from "react";
import { Calendar, ExternalLink } from "lucide-react";

export interface EmptyScheduledJobsStateProps {
  searchQuery?: string;
}

export function EmptyScheduledJobsState({
  searchQuery,
}: EmptyScheduledJobsStateProps) {
  const tableRef = useRef<HTMLDivElement | null>(null);
  const [fakeRows, setFakeRows] = useState(15);

  useEffect(() => {
    if (!tableRef.current) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const height = entries[0]?.contentRect?.height ?? 0;
      const rowHeight = 40;
      setFakeRows(Math.max(10, Math.ceil(height / rowHeight) + 5));
    });
    observer.observe(tableRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Skeleton Table */}
      <div
        ref={tableRef}
        className="pointer-events-none absolute inset-0"
        style={{
          maskImage:
            "linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.55) 30%, transparent 90%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.55) 30%, transparent 90%)",
        }}
      >
        {/* Skeleton Rows */}
        <div className="pt-0">
          {Array.from({ length: fakeRows }).map((_, rowIdx) => (
            <div
              key={`skeleton-row-${rowIdx}`}
              className="flex items-center border-b border-border-subtle p-2 font-mono text-xs text-text-secondary"
            >
              {/* ID Column */}
              <div className="flex w-1/4 items-center">
                <div
                  className="h-3 animate-pulse rounded-full bg-surface-hover"
                  style={{ width: `${55 + (rowIdx % 4) * 12}%` }}
                />
              </div>
              {/* Scheduled Time Column */}
              <div className="flex w-[180px] items-center">
                <div
                  className="h-3 animate-pulse rounded-full bg-surface-hover"
                  style={{
                    width: `${65 + (rowIdx % 3) * 12}%`,
                    animationDelay: `${rowIdx * 0.1}s`,
                  }}
                />
              </div>
              {/* Status Column */}
              <div className="flex w-[100px] items-center">
                <div
                  className="h-3 animate-pulse rounded-full bg-surface-hover"
                  style={{
                    width: `${45 + (rowIdx % 3) * 18}%`,
                    animationDelay: `${rowIdx * 0.15}s`,
                  }}
                />
              </div>
              {/* Function Column */}
              <div className="flex flex-1 items-center">
                <div
                  className="h-3 animate-pulse rounded-full bg-surface-hover"
                  style={{
                    width: `${60 + (rowIdx % 5) * 7}%`,
                    animationDelay: `${rowIdx * 0.12}s`,
                  }}
                />
              </div>
              {/* Actions Column */}
              <div className="flex w-[100px] items-center justify-end gap-1">
                <div
                  className="h-6 w-6 animate-pulse rounded-lg bg-surface-hover"
                  style={{ animationDelay: `${rowIdx * 0.18}s` }}
                />
                <div
                  className="h-6 w-6 animate-pulse rounded-lg bg-surface-hover"
                  style={{ animationDelay: `${rowIdx * 0.2}s` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Centered Message */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="w-[90%] max-w-[420px] rounded-3xl border border-border-base bg-surface-base/95 p-8 text-center shadow-2xl backdrop-blur-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-error-base/10">
            <Calendar size={24} className="text-error-base" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-text-base">
            {searchQuery
              ? "No matching schedules found"
              : "Schedule functions to run later"}
          </h3>
          <p className="mb-6 text-sm text-text-muted">
            {searchQuery
              ? "Try adjusting your search query"
              : "Scheduled functions can run after an amount of time passes, or at a specific date."}
          </p>
          {!searchQuery && (
            <a
              href="https://docs.convex.dev/scheduling/scheduled-functions"
              target="_blank"
              rel="noopener noreferrer"
              className="pointer-events-auto inline-flex items-center gap-1 text-sm text-info-base hover:underline"
            >
              <ExternalLink size={12} /> Learn more about scheduled functions
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
