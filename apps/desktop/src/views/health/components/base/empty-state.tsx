import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";

interface EmptyStateProps {
  title?: string;
  description?: string;
  variant?: "empty" | "no-results" | "error";
  icon?: React.ReactNode;
  onAction?: () => void;
  actionLabel?: string;
  className?: string;
}

const variantConfig = {
  empty: {
    icon: "files",
    title: "No data available",
    description: "There's no data to display at this time.",
  },
  "no-results": {
    icon: "search",
    title: "No results found",
    description: "Try adjusting your filters or search criteria.",
  },
  error: {
    icon: "alert-circle",
    title: "Failed to load data",
    description: "An error occurred while loading. Please try again.",
  },
};

/**
 * Empty state component for when there's no data to display.
 * Styled with Tailwind for consistent theming.
 */
export function EmptyState({
  title,
  description,
  variant = "empty",
  icon,
  onAction,
  actionLabel,
  className,
}: EmptyStateProps) {
  const config = variantConfig[variant];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-8 px-4 text-center",
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-alt mb-4">
        {icon ?? (
          <Icon name={config.icon} size={24} className="text-subtle" />
        )}
      </div>
      <h3 className="text-sm font-medium text-foreground mb-1">
        {title ?? config.title}
      </h3>
      <p className="text-xs text-muted max-w-[280px]">
        {description ?? config.description}
      </p>
      {onAction && (
        <button
          onClick={onAction}
          className={cn(
            "mt-4 inline-flex items-center gap-1.5 px-3 py-1.5",
            "text-xs font-medium rounded-lg border-0",
            "bg-surface-alt text-muted",
            "hover:bg-overlay hover:text-foreground",
            "cursor-pointer transition-all duration-150",
          )}
        >
          {variant === "error" && <Icon name="spinner" size={12} />}
          {actionLabel ?? (variant === "error" ? "Retry" : "Refresh")}
        </button>
      )}
    </div>
  );
}
