import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export type MetricHealth = "healthy" | "warning" | "error";

/**
 * Get the color class for a health status
 */
function getHealthColorClass(health?: MetricHealth): string {
  switch (health) {
    case "healthy":
      return "text-success";
    case "warning":
      return "text-warning";
    case "error":
      return "text-error";
    default:
      return "text-foreground";
  }
}

interface BigMetricProps {
  /** Health status for color coding */
  health?: MetricHealth;
  /** The main metric value to display */
  metric: string;
  /** Optional description below the metric */
  children?: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Large metric display component matching Convex dashboard design.
 * Centered layout with status-based colors.
 * Uses monospace font for values per our design enhancement.
 */
export function BigMetric({
  health,
  metric,
  children,
  className,
}: BigMetricProps) {
  return (
    <div
      className={cn(
        "flex animate-fadeInFromLoading flex-col items-center justify-center gap-2 px-2 pb-2",
        className,
      )}
    >
      <div
        className={cn(
          "text-4xl font-semibold font-mono tracking-tight",
          getHealthColorClass(health),
        )}
      >
        {metric}
      </div>
      {children && (
        <div className="max-h-10 min-h-5 truncate text-center text-pretty text-muted text-sm">
          {children}
        </div>
      )}
    </div>
  );
}
