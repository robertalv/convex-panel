import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  [
    "inline-flex items-center gap-1.5",
    "rounded-full px-2.5 py-0.5",
    "text-xs font-medium",
    "transition-colors",
  ],
  {
    variants: {
      variant: {
        default: "bg-surface-raised text-text-muted border border-border-base",
        brand: "bg-brand-muted text-brand-base border border-brand-base/20",
        success:
          "bg-success-muted text-success-text border border-success-base/20",
        warning:
          "bg-warning-muted text-warning-text border border-warning-base/20",
        error: "bg-error-muted text-error-text border border-error-base/20",
        info: "bg-info-muted text-info-text border border-info-base/20",
        outline: "border border-border-base text-text-muted bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /** Show a pulsing dot indicator */
  pulse?: boolean;
}

function Badge({ className, variant, pulse, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
              {
                "bg-text-muted": variant === "default" || variant === "outline",
                "bg-brand-base": variant === "brand",
                "bg-success-base": variant === "success",
                "bg-warning-base": variant === "warning",
                "bg-error-base": variant === "error",
                "bg-info-base": variant === "info",
              },
            )}
          />
          <span
            className={cn("relative inline-flex h-2 w-2 rounded-full", {
              "bg-text-muted": variant === "default" || variant === "outline",
              "bg-brand-base": variant === "brand",
              "bg-success-base": variant === "success",
              "bg-warning-base": variant === "warning",
              "bg-error-base": variant === "error",
              "bg-info-base": variant === "info",
            })}
          />
        </span>
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
