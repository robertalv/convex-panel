import * as React from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface HealthCardProps {
  /** Card title */
  title: string;
  /** Tooltip shown when hovering the info icon */
  tip: string;
  /** Whether data is loading */
  loading: boolean;
  /** Error message to display */
  error: string | null;
  /** Card content */
  children: React.ReactNode;
  /** Optional action element in header */
  action?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

/**
 * Base health card component matching Convex dashboard/panel design.
 * Uses the same styling as the panel package cards.
 */
export function HealthCard({
  title,
  tip,
  loading,
  error,
  children,
  action,
  className,
  style,
}: HealthCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-lg border border-border overflow-hidden",
        "bg-surface-raised",
        className,
      )}
      style={style}
    >
      {/* Header - matches panel's cp-card-header */}
      <div
        className={cn(
          "flex items-center justify-between",
          "px-3 py-2 min-h-[32px]",
          "border-b border-border",
        )}
      >
        <h3 className="text-[10px] font-medium text-muted uppercase tracking-wide">
          {title}
        </h3>
        <div className="flex items-center gap-2">
          {action}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="p-0.5 cursor-help text-muted hover:text-foreground transition-colors">
                <Info className="h-4 w-4" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <div className="max-w-xs text-xs">{tip}</div>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Content - matches panel's cp-card-content */}
      <div className="flex-1 p-3 flex flex-col">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center text-error text-xs py-8">
            {error}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
