import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-lg px-3 py-2",
          "text-sm text-text-base placeholder:text-text-subtle",
          "bg-surface-base border border-border-base",
          "focus:outline-none! focus:ring-0! focus:ring-offset-0! focus:shadow-none!",
          "focus:border-border-base",
          "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:shadow-none focus-visible:ring-transparent",
          "hover:border-border-strong",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-colors duration-150",
          error && "border-error-base",
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
