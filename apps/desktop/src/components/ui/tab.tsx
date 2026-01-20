/**
 * Tab Component
 * Ported from dashboard-common (@convex-dev/design-system)
 * Used with @headlessui/react TabGroup for tabbed interfaces
 */

import { Tab as HeadlessTab } from "@headlessui/react";
import { Fragment, PropsWithChildren } from "react";
import { Button, ButtonProps } from "./button";
import { cn } from "@/lib/utils";

export function Tab({
  disabled,
  children,
  large = false,
  className,
  ...props
}: ButtonProps & PropsWithChildren<{ disabled?: boolean; large?: boolean }>) {
  return (
    <HeadlessTab as={Fragment}>
      {({ selected }) => (
        <Button
          disabled={disabled}
          variant="ghost"
          size="sm"
          className={cn(
            "cursor-pointer px-3 py-2 text-xs whitespace-nowrap rounded-none",
            "focus:outline-none",
            "focus-visible:ring-2 focus-visible:ring-ring",
            !disabled && selected
              ? "border-b-2 border-primary font-semibold"
              : "border-b-2 border-transparent text-muted-foreground",
            disabled
              ? "cursor-not-allowed opacity-50"
              : "hover:text-foreground",
            large && "text-lg",
            className,
          )}
          {...props}
        >
          {children}
        </Button>
      )}
    </HeadlessTab>
  );
}
