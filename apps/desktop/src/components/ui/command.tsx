import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { SearchIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Create a handle for programmatically controlling the command palette
 */
function CommandCreateHandle() {
  return React.createRef<{ open: () => void; close: () => void }>();
}

function Command({
  className,
  items,
  filter,
  ...props
}: React.ComponentProps<typeof CommandPrimitive> & {
  items?: unknown[];
  filter?: (value: unknown, search: string) => boolean;
}) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        "bg-surface-base text-text-base flex h-full w-full flex-col overflow-hidden rounded-lg",
        className,
      )}
      filter={filter}
      {...props}
    />
  );
}

function CommandDialog({
  title = "Command Palette",
  description = "Search for a command to run...",
  children,
  className,
  showCloseButton = false,
  handle,
  ...props
}: React.ComponentProps<typeof Dialog> & {
  title?: string;
  description?: string;
  className?: string;
  showCloseButton?: boolean;
  handle?: ReturnType<typeof CommandCreateHandle>;
}) {
  React.useImperativeHandle(handle, () => ({
    open: () => props.onOpenChange?.(true),
    close: () => props.onOpenChange?.(false),
  }));

  return (
    <Dialog {...props}>
      <DialogHeader className="sr-only">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogContent
        className={cn(
          "overflow-hidden p-0 max-w-2xl bg-surface-base border-border-base",
          className,
        )}
        showCloseButton={showCloseButton}
      >
        {children}
      </DialogContent>
    </Dialog>
  );
}

function CommandDialogPopup({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="command-dialog-popup"
      className={cn("flex flex-col h-full", className)}
      {...props}
    />
  );
}

function CommandPanel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="command-panel"
      className={cn("flex-1 overflow-hidden", className)}
      {...props}
    />
  );
}

function CommandFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="command-footer"
      className={cn(
        "flex items-center justify-between gap-4 border-t border-border-muted px-4 py-2.5 text-xs text-text-subtle bg-surface-base",
        className,
      )}
      {...props}
    />
  );
}

function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div
      data-slot="command-input-wrapper"
      className="flex h-12 items-center gap-3 px-4"
    >
      <SearchIcon className="size-4 shrink-0 text-text-subtle" />
      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn(
          "placeholder:text-text-disabled flex h-10 w-full rounded-md bg-transparent py-3 text-sm border-none outline-none ring-0 focus:outline-none focus:ring-0 focus:border-none focus:shadow-none focus-visible:outline-none focus-visible:ring-0 focus-visible:border-none focus-visible:shadow-none active:outline-none active:ring-0 active:border-none disabled:cursor-not-allowed disabled:opacity-50 text-text-base appearance-none",
          className,
        )}
        style={{
          outline: 'none',
          boxShadow: 'none',
          ...props.style,
        }}
        {...props}
      />
    </div>
  );
}

function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        "max-h-[400px] scroll-py-1 overflow-x-hidden overflow-y-auto",
        className,
      )}
      {...props}
    />
  );
}

function CommandEmpty({
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className="py-8 text-center text-sm text-text-muted"
      {...props}
    />
  );
}

function CommandGroup({
  className,
  items,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group> & {
  items?: unknown[];
}) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        "text-text-base [&_[cmdk-group-heading]]:text-text-subtle overflow-hidden p-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider",
        className,
      )}
      {...props}
    />
  );
}

function CommandGroupLabel({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="command-group-label"
      className={cn(
        "px-3 py-2 text-xs font-semibold text-text-subtle uppercase tracking-wider",
        className,
      )}
      {...props}
    />
  );
}

function CommandCollection<T>({
  children,
}: {
  children: (item: T) => React.ReactNode;
}) {
  return (<>{children}</>) as unknown as React.ReactElement;
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn("bg-border-muted -mx-1 h-px my-2", className)}
      {...props}
    />
  );
}

function CommandItem({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "data-[selected=true]:bg-interactive-muted data-[selected=true]:text-text-base relative flex cursor-default items-center gap-3 rounded-md px-3 py-2.5 text-sm outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 text-text-muted hover:bg-surface-raised hover:text-text-base transition-colors duration-fast",
        className,
      )}
      {...props}
    />
  );
}

function CommandShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn("text-text-subtle ml-auto text-xs font-mono", className)}
      {...props}
    />
  );
}

export {
  Command,
  CommandDialog,
  CommandDialogPopup,
  CommandPanel,
  CommandFooter,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandGroupLabel,
  CommandCollection,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
  CommandCreateHandle,
};
