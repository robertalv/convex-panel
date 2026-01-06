import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TooltipWithKeybind } from "@/components/ui/tooltip";
import { ResizeHandle } from "./ResizeHandle";
import {
  PanelLeftClose,
  PanelLeft,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  shortcut?: string;
}

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

const SIDEBAR_MIN_WIDTH = 180;
const SIDEBAR_MAX_WIDTH = 320;
const SIDEBAR_COLLAPSED_WIDTH = 48;

/**
 * Sidebar navigation item with active indicator.
 */
interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  shortcut?: string;
  isActive: boolean;
  collapsed: boolean;
  onClick: () => void;
}

function SidebarItem({
  icon: Icon,
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
          {/* Active indicator */}
          <div
            className={cn(
              "-ml-2",
              "w-[3px] h-5 rounded-full flex-shrink-0",
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
            <Icon className="h-3.5 w-3.5" />
          </Button>
        </div>
      </TooltipWithKeybind>
    );
  }

  return (
    <div className="flex items-center w-full gap-1.5">
      {/* Active indicator */}
      <div
        className={cn(
          "w-[3px] h-5 rounded-full flex-shrink-0",
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
        <Icon className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="truncate flex-1 text-left text-sm">{label}</span>
        {shortcut && (
          <kbd className="text-[10px] text-text-subtle bg-surface-base px-1 py-0.5 rounded">
            {shortcut}
          </kbd>
        )}
      </Button>
    </div>
  );
}

/**
 * Collapsible sidebar with navigation items and resizable width.
 * Supports keyboard shortcut ⌘B to toggle collapse.
 */
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
      {/* Navigation items */}
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
              icon={Settings}
              label="Settings"
              shortcut="⌘,"
              isActive={isSettingsActive}
              collapsed={collapsed}
              onClick={onOpenSettings}
            />
          )}
        </div>
      </nav>

      {/* Footer with settings and collapse toggle */}
      <div className="p-2 border-t border-border-muted">
        <div className="flex flex-col gap-1">
          {/* Collapse toggle */}
          <div className="flex items-center w-full gap-1.5">
            {/* Spacer for indicator alignment */}
            <div className=" flex-shrink-0" />
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
                  <PanelLeft className="h-3.5 w-3.5" />
                ) : (
                  <>
                    <PanelLeftClose className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate text-sm">Collapse</span>
                  </>
                )}
              </Button>
            </TooltipWithKeybind>
          </div>
        </div>
      </div>

      {/* Resize handle (only when not collapsed) */}
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
export { SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH, SIDEBAR_COLLAPSED_WIDTH };
