import * as React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "text" | "circular" | "rectangular";
}

function Skeleton({ className, variant = "default", ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-shimmer bg-surface-raised",
        {
          "rounded-md": variant === "default" || variant === "rectangular",
          "rounded-full": variant === "circular",
          "h-4 rounded": variant === "text",
        },
        className,
      )}
      {...props}
    />
  );
}

function SkeletonText({
  lines = 3,
  className,
  ...props
}: { lines?: number } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className={cn(
            "h-4",
            i === lines - 1 && "w-3/4",
          )}
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  );
}

function SkeletonCard({
  className,
  showHeader = true,
  showChart = false,
  ...props
}: {
  showHeader?: boolean;
  showChart?: boolean;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border-base bg-surface-base p-4",
        className,
      )}
      {...props}
    >
      {showHeader && (
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-4 rounded-full" />
        </div>
      )}
      {showChart ? (
        <div className="space-y-3">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : (
        <div className="space-y-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
      )}
    </div>
  );
}

function SkeletonList({
  items = 5,
  className,
  ...props
}: { items?: number } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg border border-border-muted bg-surface-raised p-3"
          style={{ animationDelay: `${i * 0.05}s` }}
        >
          <Skeleton className="h-8 w-8 rounded-md" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export { Skeleton, SkeletonText, SkeletonCard, SkeletonList };
