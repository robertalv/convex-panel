import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Base styles
  [
    "inline-flex items-center justify-center gap-2",
    "whitespace-nowrap rounded-lg font-medium",
    "transition-all duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-base focus-visible:ring-offset-2 focus-visible:ring-offset-background-base",
    "disabled:pointer-events-none disabled:opacity-50",
    "select-none",
  ],
  {
    variants: {
      variant: {
        default: [
          "bg-brand-base text-white",
          "hover:bg-brand-hover",
          "active:bg-brand-base",
          "shadow-sm",
        ],
        secondary: [
          "bg-surface-raised text-text-base",
          "border border-border-base",
          "hover:bg-surface-overlay hover:border-border-strong",
          "active:bg-surface-base",
        ],
        ghost: [
          "bg-transparent text-text-muted",
          "hover:bg-interactive-muted hover:text-text-base",
          "active:bg-interactive-muted",
        ],
        outline: [
          "bg-transparent text-text-base",
          "border border-border-base",
          "hover:bg-surface-raised hover:border-border-strong",
          "active:bg-surface-base",
        ],
        destructive: [
          "bg-error-base text-white",
          "hover:bg-error-base/90",
          "active:bg-error-base",
        ],
        link: [
          "bg-transparent text-brand-base underline-offset-4",
          "hover:underline",
        ],
      },
      size: {
        sm: "h-8 px-3 text-sm",
        default: "h-9 px-4 text-sm",
        lg: "h-10 px-5 text-base",
        icon: "h-9 w-9",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
