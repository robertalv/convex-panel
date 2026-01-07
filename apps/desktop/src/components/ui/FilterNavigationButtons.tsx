/**
 * FilterNavigationButtons Component
 * Previous/Next buttons for navigating filter history
 * Styled to match the reference DataFilters implementation
 */

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconButton } from "@/components/ui/button";

interface FilterNavigationButtonsProps {
  /** Whether we can navigate to previous (older) filters */
  canGoPrevious: boolean;
  /** Whether we can navigate to next (newer) filters */
  canGoNext: boolean;
  /** Callback when previous button is clicked */
  onPrevious: () => void;
  /** Callback when next button is clicked */
  onNext: () => void;
  /** Optional class name for the container */
  className?: string;
}

/**
 * Navigation buttons for traversing filter history
 * Previous = go back in time (older filters)
 * Next = go forward in time (newer filters)
 */
export function FilterNavigationButtons({
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
  className,
}: FilterNavigationButtonsProps) {
  return (
    <div className={cn("flex items-center", className)}>
      <IconButton
        type="button"
        onClick={onPrevious}
        disabled={!canGoPrevious}
        title="Previous Filters"
        variant="outline"
        className={cn(
          "w-6 h-6 rounded-l-md rounded-r-none",
          "border-r-0",
          "bg-[var(--color-surface-base)]",
          canGoPrevious
            ? "hover:bg-[var(--color-surface-raised)] text-[var(--color-text-base)]"
            : "text-[var(--color-text-subtle)]",
        )}
      >
        <ChevronLeft size={14} />
      </IconButton>
      <IconButton
        type="button"
        onClick={onNext}
        disabled={!canGoNext}
        title="Next Filters"
        variant="outline"
        className={cn(
          "w-6 h-6 rounded-r-md rounded-l-none",
          "bg-[var(--color-surface-base)]",
          canGoNext
            ? "hover:bg-[var(--color-surface-raised)] text-[var(--color-text-base)]"
            : "text-[var(--color-text-subtle)]",
        )}
      >
        <ChevronRight size={14} />
      </IconButton>
    </div>
  );
}

export default FilterNavigationButtons;
