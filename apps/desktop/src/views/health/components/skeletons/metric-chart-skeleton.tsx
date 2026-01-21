import { Skeleton } from "@/components/ui";

/**
 * Skeleton placeholder for metric + chart cards in the Health view.
 * Shows a rough chart layout so the card doesn't look empty before data arrives.
 */
export function MetricChartSkeleton() {
  return (
    <div className="flex h-full w-full flex-col gap-3 px-2 py-2">
      {/* Metric + label header */}
      <div className="flex items-baseline justify-between gap-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-3 w-20" />
      </div>

      {/* Chart area */}
      <div className="flex flex-1 items-end gap-1">
        {Array.from({ length: 18 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-sm"
            style={{
              height: `${40 + ((i * 7) % 40)}px`,
              animationDelay: `${i * 0.04}s`,
            }}
          />
        ))}
      </div>

      {/* X-axis ticks */}
      <div className="mt-1 flex items-center justify-between gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-3 w-6"
            style={{ animationDelay: `${i * 0.05}s` }}
          />
        ))}
      </div>
    </div>
  );
}

