import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Error state */
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base styles
          "flex h-9 w-full rounded-lg px-3 py-2",
          "text-sm text-text-base placeholder:text-text-subtle",
          "bg-surface-base border border-border-base",
          // Focus states - prevent any underline or border changes
          "focus:!outline-none focus:!ring-0 focus:!ring-offset-0 focus:!shadow-none",
          "focus:border-border-base",
          "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:shadow-none focus-visible:ring-transparent",
          // Hover
          "hover:border-border-strong",
          // Disabled
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Transition
          "transition-colors duration-150",
          // Error state
          error && "border-error-base",
          // File input special styles
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
