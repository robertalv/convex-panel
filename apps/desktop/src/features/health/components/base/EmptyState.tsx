import { cn } from "@/lib/utils";
import { Inbox, Search, AlertCircle, RefreshCw } from "lucide-react";

interface EmptyStateProps {
  /** Title text */
  title?: string;
  /** Description text */
  description?: string;
  /** Empty state variant */
  variant?: "empty" | "no-results" | "error";
  /** Custom icon */
  icon?: React.ReactNode;
  /** Action button callback */
  onAction?: () => void;
  /** Action button label */
  actionLabel?: string;
  /** Additional CSS classes */
  className?: string;
}

const variantConfig = {
  empty: {
    icon: Inbox,
    title: "No data available",
    description: "There's no data to display at this time.",
  },
  "no-results": {
    icon: Search,
    title: "No results found",
    description: "Try adjusting your filters or search criteria.",
  },
  error: {
    icon: AlertCircle,
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
  const Icon = icon ? null : config.icon;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-8 px-4 text-center",
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-alt mb-4">
        {icon ?? (Icon && <Icon size={24} className="text-subtle" />)}
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
          {variant === "error" && <RefreshCw size={12} />}
          {actionLabel ?? (variant === "error" ? "Retry" : "Refresh")}
        </button>
      )}
    </div>
  );
}
