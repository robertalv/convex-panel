import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";
import { Kbd } from "./kbd";

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
        "z-50 overflow-hidden rounded-md px-3 py-1.5",
        "bg-surface-overlay text-xs text-text-base",
        "border border-border-base shadow-md",
        "animate-fade-up",
        "data-[state=closed]:animate-fade-out",
        className,
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

function renderKeybind(keybind: string): React.ReactNode {
  const match = keybind.match(/^(\w+)\s+then\s+(\w+)$/i);
  if (match) {
    const [, firstKey, secondKey] = match;
    return (
      <span className="flex items-center gap-1">
        <Kbd className="rounded-lg px-1.5 py-0.5 text-xs font-medium text-text-muted border border-border-base">
          {firstKey}
        </Kbd>
        <span className="text-xs text-text-muted">then</span>
        <Kbd className="rounded-lg px-1.5 py-0.5 text-xs font-medium text-text-muted border border-border-base">
          {secondKey}
        </Kbd>
      </span>
    );
  }
  return (
    <Kbd className="rounded-lg px-1.5 py-0.5 text-xs font-medium text-text-muted border border-border-base">
      {keybind}
    </Kbd>
  );
}

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
          {content && <span>{content}</span>}
          {keybind && renderKeybind(keybind)}
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
