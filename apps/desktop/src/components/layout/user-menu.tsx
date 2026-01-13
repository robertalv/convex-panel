import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import type { User, Team, Project, ThemeType } from "@/types/desktop";
import Icon from "../ui/icon";
import { openExternalLink } from "@/lib/utils";

interface UserMenuProps {
  user: User | null;
  selectedTeam: Team | null;
  selectedProject: Project | null;
  theme: ThemeType;
  onThemeChange: (theme: ThemeType) => void;
  onLogout: () => void;
}

export function UserMenu({
  user,
  selectedTeam,
  selectedProject,
  theme,
  onThemeChange,
  onLogout,
}: UserMenuProps) {
  const [open, setOpen] = React.useState(false);

  const avatarUrl = user?.profilePictureUrl || user?.avatarUrl;
  const displayName = user?.name || user?.email || "User";
  const displayEmail = user?.email || "";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const themeOptions: {
    value: ThemeType;
    icon: React.ReactNode;
    label: string;
  }[] = [
    { value: "light", icon: <Icon name="sun" className="h-3.5 w-3.5" />, label: "Light" },
    { value: "dark", icon: <Icon name="moon" className="h-3.5 w-3.5" />, label: "Dark" },
    { value: "system", icon: <Icon name="system" className="h-3.5 w-3.5" />, label: "System" },
  ];

  const handleOpenExternalLink = async (url: string) => {
    await openExternalLink(url);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center justify-center",
            "h-6 w-6 rounded-full",
            "hover:ring-2 hover:ring-border-base hover:ring-offset-2 hover:ring-offset-background-base",
            "focus:outline-none focus:ring-2 focus:ring-brand-base focus:ring-offset-2 focus:ring-offset-background-base",
            "transition-all duration-150",
            "overflow-hidden",
          )}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="h-6 w-6 rounded-full object-cover"
            />
          ) : (
            <div className="h-6 w-6 rounded-full bg-brand-muted flex items-center justify-center text-[10px] text-brand-base font-medium">
              {initials}
            </div>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-64 p-0">
        <div className="px-4 py-3">
          <div className="font-medium text-text-base text-sm">
            {displayName}
          </div>
          {displayEmail && (
            <div className="text-text-muted text-xs mt-0.5 truncate">
              {displayEmail}
            </div>
          )}
        </div>

        <Separator className="bg-border-muted" />

        <div className="p-1">
          <MenuItem
            icon={<Icon name="user" className="h-4 w-4" />}
            external
            onClick={() =>
              handleOpenExternalLink("https://dashboard.convex.dev/profile")
            }
          >
            Profile Settings
          </MenuItem>

          {selectedTeam && (
            <MenuItem
              icon={<Icon name="settings" className="h-4 w-4" />}
              rightLabel={selectedTeam.name}
              external
              onClick={() =>
                handleOpenExternalLink(
                  `https://dashboard.convex.dev/t/${selectedTeam.slug}/settings`,
                )
              }
            >
              Team Settings
            </MenuItem>
          )}

          {selectedTeam && selectedProject && (
            <MenuItem
              icon={<Icon name="settings" className="h-4 w-4" />}
              rightLabel={selectedProject.name}
              external
              onClick={() =>
                handleOpenExternalLink(
                  `https://dashboard.convex.dev/t/${selectedTeam.slug}/${selectedProject.slug}/settings`,
                )
              }
            >
              Project Settings
            </MenuItem>
          )}

          <Separator className="bg-border-muted my-1.5" />

          <div className="px-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="palette" className="h-4 w-4 text-text-muted" />
              <span className="text-sm text-text-base">Theme</span>
            </div>
            <div className="flex items-center bg-surface-raised rounded-xl p-0.5 border border-border-muted">
              {themeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onThemeChange(option.value)}
                  className={cn(
                    "flex rounded-lg items-center justify-center h-6 w-6 transition-all duration-150",
                    theme === option.value
                      ? "bg-brand-base text-white"
                      : "text-text-muted hover:text-text-base hover:bg-surface-base",
                  )}
                  title={option.label}
                >
                  {option.icon}
                </button>
              ))}
            </div>
          </div>

          <Separator className="bg-border-muted my-1.5" />

          <MenuItem
            icon={<Icon name="log-out" className="h-4 w-4" />}
            destructive
            onClick={() => {
              onLogout();
              setOpen(false);
            }}
          >
            Log Out
          </MenuItem>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface MenuItemProps {
  icon?: React.ReactNode;
  children: React.ReactNode;
  rightLabel?: string;
  onClick?: () => void;
  destructive?: boolean;
  external?: boolean;
}

function MenuItem({
  icon,
  children,
  rightLabel,
  onClick,
  destructive,
  external,
}: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-3 py-2 rounded-lg",
        "text-sm text-left transition-colors duration-150",
        destructive
          ? "text-error-base hover:bg-error-muted"
          : "text-text-base hover:bg-surface-raised",
      )}
    >
      <div className="flex items-center gap-2">
        {icon && <span className="text-text-muted">{icon}</span>}
        <span>{children}</span>
      </div>
      <div className="flex items-center gap-1.5">
        {rightLabel && (
          <span className="text-text-muted text-xs truncate max-w-[80px]">
            {rightLabel}
          </span>
        )}
        {external && <Icon name="external-link" className="h-3 w-3 text-text-disabled" />}
      </div>
    </button>
  );
}

export default UserMenu;
