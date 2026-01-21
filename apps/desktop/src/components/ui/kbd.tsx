import * as React from "react";
import { cn } from "@/lib/utils";

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

export function Kbd({ className, children, ...props }: KbdProps) {
  return (
    <kbd
      className={cn(
        "inline-flex items-center justify-center rounded border border-border-muted bg-surface-raised px-1.5 py-0.5 font-mono text-[10px] font-medium text-text-subtle shadow-sm",
        className,
      )}
      {...props}
    >
      {children}
    </kbd>
  );
}

export interface KbdGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function KbdGroup({ className, children, ...props }: KbdGroupProps) {
  return (
    <div
      className={cn("inline-flex items-center gap-0.5", className)}
      {...props}
    >
      {children}
    </div>
  );
}
