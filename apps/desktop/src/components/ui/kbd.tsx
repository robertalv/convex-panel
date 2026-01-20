import * as React from "react";
import { cn } from "@/lib/utils";

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

export function Kbd({ className, children, ...props }: KbdProps) {
  return (
    <kbd
      className={cn(
        "text-[10px] text-text-subtle bg-surface-base px-1 py-0.5 rounded",
        className,
      )}
      {...props}
    >
      {children}
    </kbd>
  );
}
