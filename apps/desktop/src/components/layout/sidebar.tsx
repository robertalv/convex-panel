import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TooltipWithKeybind } from "@/components/ui/tooltip";
import { Kbd } from "@/components/ui/kbd";
import { ResizeHandle } from "../ui/resize-handle";
import type { NavItem } from "@/lib/navigation";
import { Icon, IconProps } from "../ui/icon";
import { SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from "@/lib/layout";

interface SidebarProps {
  navItems: NavItem[];
  currentPath: string;
  onNavigate: (path: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  width: number;
  onResize: (width: number) => void;
  minWidth?: number;
  maxWidth?: number;
  className?: string;
  onOpenSettings?: () => void;
  isSettingsActive?: boolean;
}

interface SidebarItemProps {
  icon: IconProps;
  label: string;
  shortcut?: string;
  isActive: boolean;
  collapsed: boolean;
  onClick: () => void;
}

function renderShortcut(shortcut: string): React.ReactNode {
  const match = shortcut.match(/^(\w+)\s+then\s+(\w+)$/i);
  if (match) {
    const [, firstKey, secondKey] = match;
    return (
      <span className="flex items-center gap-1">
        <Kbd>{firstKey}</Kbd>
        <span className="text-[10px] text-text-subtle">then</span>
        <Kbd>{secondKey}</Kbd>
      </span>
    );
  }
  return <Kbd>{shortcut}</Kbd>;
}

function SidebarItem({
  icon,
  label,
  shortcut,
  isActive,
  collapsed,
  onClick,
}: SidebarItemProps) {
  if (collapsed) {
    return (
      <TooltipWithKeybind content={label} keybind={shortcut} side="right">
        <div className="flex items-center justify-center w-full gap-1.5">
          <div
            className={cn(
              "-ml-2",
              "w-[3px] h-5 rounded-full shrink-0",
              "transition-all duration-200 ease-out",
              isActive ? "bg-brand-base" : "bg-transparent",
            )}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={onClick}
            className={cn(
              "w-7 h-7 flex items-center justify-center rounded-md",
              "transition-all duration-200",
              isActive
                ? "bg-surface-overlay text-text-base"
                : "text-text-muted hover:text-text-base hover:bg-surface-raised",
            )}
          >
            <Icon {...icon} className="h-3.5 w-3.5" />
          </Button>
        </div>
      </TooltipWithKeybind>
    );
  }

  return (
    <div className="flex items-center w-full gap-1.5">
      <div
        className={cn(
          "w-[3px] h-5 rounded-full shrink-0",
          "transition-all duration-200 ease-out",
          isActive ? "bg-brand-base" : "bg-transparent",
        )}
      />
      <Button
        variant="ghost"
        size="sm"
        onClick={onClick}
        className={cn(
          "flex-1 justify-start gap-2.5 h-7",
          "transition-all duration-200",
          isActive
            ? "bg-surface-overlay text-text-base"
            : "text-text-muted hover:text-text-base hover:bg-surface-raised",
        )}
      >
        <Icon {...icon} className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate flex-1 text-left text-sm">{label}</span>
        {shortcut && renderShortcut(shortcut)}
      </Button>
    </div>
  );
}

export function Sidebar({
  navItems,
  currentPath,
  onNavigate,
  collapsed,
  onToggleCollapse,
  width,
  onResize,
  minWidth = SIDEBAR_MIN_WIDTH,
  maxWidth = SIDEBAR_MAX_WIDTH,
  className,
  onOpenSettings,
  isSettingsActive = false,
}: SidebarProps) {
  const handleResize = React.useCallback(
    (delta: number) => {
      const newWidth = Math.min(maxWidth, Math.max(minWidth, width + delta));
      onResize(newWidth);
    },
    [width, minWidth, maxWidth, onResize],
  );

  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED_WIDTH : width;

  return (
    <aside
      className={cn(
        "relative flex flex-col h-full",
        "bg-background-raised border-r border-border-muted",
        "transition-[width] duration-slow ease-out",
        className,
      )}
      style={{ width: sidebarWidth }}
    >
      <nav className="flex-1 py-2 px-2 overflow-y-auto scrollbar-hide">
        <div className="flex flex-col justify-between h-full gap-1">
          <div className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = currentPath.startsWith(item.path);

            return (
              <SidebarItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                shortcut={item.shortcut}
                isActive={isActive}
                collapsed={collapsed}
                onClick={() => onNavigate(item.path)}
              />
              );
            })}
          </div>

          {onOpenSettings && (
            <SidebarItem
              icon={{ name: "settings" }}
              label="Settings"
              shortcut="⌘,"
              isActive={isSettingsActive}
              collapsed={collapsed}
              onClick={onOpenSettings}
            />
          )}
        </div>
      </nav>

      <div className="p-2 border-t border-border-muted">
        <div className="flex flex-col gap-1">
          <div className="flex items-center w-full gap-1.5">
            <div className="shrink-0" />
            <TooltipWithKeybind
              content={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              keybind="⌘B"
              side={collapsed ? "right" : "top"}
            >
              <Button
                variant="ghost"
                size={collapsed ? "icon" : "sm"}
                onClick={onToggleCollapse}
                className={cn(
                  "transition-all duration-200",
                  "text-text-muted hover:text-text-base hover:bg-surface-raised",
                  collapsed
                    ? "w-7 h-7 rounded-md"
                    : "flex-1 justify-start gap-2.5 h-7",
                )}
              >
                {collapsed ? (
                  <Icon name="chevron-right" className="h-3.5 w-3.5" />
                ) : (
                  <>
                    <Icon name="chevron-back" className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate text-sm">Collapse</span>
                  </>
                )}
              </Button>
            </TooltipWithKeybind>
          </div>
        </div>
      </div>

      {!collapsed && (
        <ResizeHandle
          direction="horizontal"
          onResize={handleResize}
          className="absolute right-0 top-0 bottom-0"
        />
      )}
    </aside>
  );
}

export default Sidebar;
