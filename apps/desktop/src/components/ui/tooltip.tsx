import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        // Base styles
        "z-50 overflow-hidden rounded-md px-3 py-1.5",
        "bg-surface-overlay text-sm text-text-base",
        "border border-border-base shadow-md",
        // Animation
        "animate-fade-up",
        "data-[state=closed]:animate-fade-out",
        className,
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

/**
 * Tooltip with keyboard shortcut display.
 */
interface TooltipWithKeybindProps {
  children: React.ReactNode;
  content: string;
  keybind?: string;
  side?: "top" | "right" | "bottom" | "left";
  delayDuration?: number;
}

function TooltipWithKeybind({
  children,
  content,
  keybind,
  side = "top",
  delayDuration = 300,
}: TooltipWithKeybindProps) {
  return (
    <Tooltip delayDuration={delayDuration}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} className="py-0.5 px-1.5 rounded-lg">
        <div className="flex items-center gap-1">
          <span>{content}</span>
          {keybind && (
            <kbd className="rounded-lg bg-surface-base px-1.5 py-0.5 text-xs font-medium text-text-muted border border-border-base">
              {keybind}
            </kbd>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  TooltipWithKeybind,
};
