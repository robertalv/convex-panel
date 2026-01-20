import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconButton } from "@/components/ui/button";

interface FilterNavigationButtonsProps {
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  className?: string;
}

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
          "bg-(--color-surface-base)",
          canGoPrevious
            ? "hover:bg-(--color-surface-raised) text-(--color-text-base)"
            : "text-(--color-text-subtle)",
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
          "bg-(--color-surface-base)",
          canGoNext
            ? "hover:bg-(--color-surface-raised) text-(--color-text-base)"
            : "text-(--color-text-subtle)",
        )}
      >
        <ChevronRight size={14} />
      </IconButton>
    </div>
  );
}

export default FilterNavigationButtons;
