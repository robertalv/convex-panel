import { cn } from "@/lib/utils";

export type HealthStatus = "healthy" | "warning" | "error";

interface StatusBadgeProps {
  status: HealthStatus;
  label?: string;
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
}

interface StatusConfig {
  label: string;
  bgClass: string;
  textClass: string;
  dotClass: string;
}

function getStatusConfig(status: HealthStatus): StatusConfig {
  switch (status) {
    case "healthy":
      return {
        label: "Healthy",
        bgClass: "bg-success-bg",
        textClass: "text-success",
        dotClass: "bg-success",
      };
    case "warning":
      return {
        label: "Warning",
        bgClass: "bg-warning-bg",
        textClass: "text-warning",
        dotClass: "bg-warning",
      };
    case "error":
      return {
        label: "Error",
        bgClass: "bg-error-bg",
        textClass: "text-error",
        dotClass: "bg-error",
      };
    default:
      return {
        label: "Unknown",
        bgClass: "bg-surface-alt",
        textClass: "text-muted",
        dotClass: "bg-subtle",
      };
  }
}

interface SizeConfig {
  padding: string;
  text: string;
  gap: string;
  dotSize: string;
}

function getSizeConfig(size: "sm" | "md" | "lg"): SizeConfig {
  switch (size) {
    case "sm":
      return {
        padding: "px-1.5 py-0.5",
        text: "text-[11px]",
        gap: "gap-1",
        dotSize: "h-1.5 w-1.5",
      };
    case "lg":
      return {
        padding: "px-2.5 py-1.5",
        text: "text-sm",
        gap: "gap-2",
        dotSize: "h-2.5 w-2.5",
      };
    default:
      return {
        padding: "px-2 py-1",
        text: "text-xs",
        gap: "gap-1.5",
        dotSize: "h-2 w-2",
      };
  }
}

/**
 * Status badge component for displaying health/status indicators.
 * Styled with Tailwind for consistent theming.
 */
export function StatusBadge({
  status,
  label,
  size = "md",
  pulse = false,
}: StatusBadgeProps) {
  const config = getStatusConfig(status);
  const sizes = getSizeConfig(size);

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full",
        sizes.padding,
        sizes.text,
        sizes.gap,
        config.bgClass,
        config.textClass,
      )}
    >
      <span className="relative flex">
        <span className={cn("rounded-full", sizes.dotSize, config.dotClass)} />
        {pulse && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
              config.dotClass,
            )}
          />
        )}
      </span>
      {label ?? config.label}
    </span>
  );
}
