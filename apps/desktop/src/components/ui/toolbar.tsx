import * as React from "react";
import { cn } from "@/lib/utils";

export interface ToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  left?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
  bordered?: boolean;
}

export const Toolbar = React.forwardRef<HTMLDivElement, ToolbarProps>(
  ({ left, right, className, bordered = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-between px-3 py-2 gap-3",
          bordered && "border-b",
          className
        )}
        style={{
          height: "45px",
          minHeight: "45px",
          borderBottomColor: bordered
            ? "var(--color-border-base)"
            : "transparent",
          backgroundColor: "var(--color-surface-base)",
          ...props.style,
        }}
        {...props}
      >
        {left && <div className="flex items-center gap-2">{left}</div>}
        {right && <div className="flex items-center gap-2">{right}</div>}
      </div>
    );
  }
);
Toolbar.displayName = "Toolbar";
