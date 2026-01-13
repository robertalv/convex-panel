import { useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import Icon from "../ui/icon";

export interface MenuItemProps {
  icon?: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
  active?: boolean;
  onMouseEnter?: () => void;
}

export function MenuItem({
  icon,
  label,
  onClick,
  disabled = false,
  destructive = false,
  active = false,
  onMouseEnter,
}: MenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={onMouseEnter}
      className={cn(
        "w-full flex items-center justify-between gap-2 px-2 py-1.5 text-left rounded-lg",
        "text-sm transition-colors font-sans font-normal",
        disabled && "opacity-50 cursor-not-allowed",
        !disabled && "hover:bg-surface-raised",
        destructive ? "text-error-base" : "text-text-base",
      )}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {icon && (
          <span
            className={cn(
              "shrink-0",
              destructive
                ? "text-error-base"
                : active
                  ? "text-brand-base"
                  : "text-text-muted",
            )}
          >
            {icon}
          </span>
        )}
        <span className="truncate">{label}</span>
      </div>
      {active && (
        <Icon name="checkmark-circle" className="h-4 w-4 shrink-0 stroke-brand-base" />
      )}
    </button>
  );
}

export function MenuDivider() {
  return <div className="h-px my-1 mx-1 bg-border-muted" />;
}

export interface MenuProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  menuRef?: React.RefObject<HTMLDivElement>;
  align?: "left" | "right" | "center";
  sideOffset?: number;
}

export function Menu({
  open,
  onClose,
  children,
  className,
  style,
  menuRef,
  align = "left",
  sideOffset = 4,
}: MenuProps) {
  const internalMenuRef = useRef<HTMLDivElement>(null);
  const ref = menuRef || internalMenuRef;

  // Handle escape key
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Handle click outside
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Use a small delay to avoid closing immediately when opening
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, onClose, ref]);

  if (!open) return null;

  const alignmentClasses = {
    left: "left-0",
    right: "right-0",
    center: "left-1/2 -translate-x-1/2",
  };

  return (
    <div
      ref={ref}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "absolute top-full z-50",
        alignmentClasses[align],
        "min-w-[180px] max-w-[250px]",
        "bg-surface-base border border-border-muted rounded-xl shadow-lg",
        "overflow-hidden p-1",
        "animate-fade-up",
        className,
      )}
      style={{
        marginTop: `${sideOffset}px`,
        animationDuration: "150ms",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export interface MenuTriggerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checkBeforeOpen?: () => boolean;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function MenuTrigger({
  open,
  onOpenChange,
  checkBeforeOpen,
  children,
  className,
  style,
}: MenuTriggerProps) {
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (checkBeforeOpen?.()) {
        return;
      }
      onOpenChange(!open);
    },
    [open, onOpenChange, checkBeforeOpen],
  );

  return (
    <div
      draggable={false}
      onClick={handleClick}
      className={cn("relative", className)}
      style={style}
    >
      {children}
    </div>
  );
}

