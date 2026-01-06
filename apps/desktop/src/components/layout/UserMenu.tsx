import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import type { User, Team, Project } from "convex-panel";
import {
  User as UserIcon,
  Settings,
  LogOut,
  Sun,
  Moon,
  Zap,
  ExternalLink,
} from "lucide-react";

interface UserMenuProps {
  user: User | null;
  selectedTeam: Team | null;
  selectedProject: Project | null;
  theme: "light" | "dark" | "system";
  onThemeChange: (theme: "light" | "dark" | "system") => void;
  onLogout: () => void;
}

type ThemeOption = "system" | "light" | "dark";

/**
 * User menu dropdown with profile info, theme switcher, and logout.
 * Similar to the Convex dashboard user menu.
 */
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
    value: ThemeOption;
    icon: React.ReactNode;
    label: string;
  }[] = [
    { value: "system", icon: <Zap className="h-3.5 w-3.5" />, label: "System" },
    { value: "light", icon: <Sun className="h-3.5 w-3.5" />, label: "Light" },
    { value: "dark", icon: <Moon className="h-3.5 w-3.5" />, label: "Dark" },
  ];

  // Open external link in browser
  const openExternalLink = async (url: string) => {
    // Check if we're in Tauri environment
    if (
      typeof window !== "undefined" &&
      (window as unknown as { __TAURI_INTERNALS__?: unknown })
        .__TAURI_INTERNALS__
    ) {
      try {
        const { open } = await import("@tauri-apps/plugin-shell");
        await open(url);
      } catch {
        // Fallback to window.open if Tauri plugin fails
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
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

        {/* Menu items */}
        <div className="p-1">
          {/* Profile Settings - opens in browser */}
          <MenuItem
            icon={<UserIcon className="h-4 w-4" />}
            external
            onClick={() =>
              openExternalLink("https://dashboard.convex.dev/profile")
            }
          >
            Profile Settings
          </MenuItem>

          {/* Team Settings - opens in browser */}
          {selectedTeam && (
            <MenuItem
              icon={<Settings className="h-4 w-4" />}
              rightLabel={selectedTeam.name}
              external
              onClick={() =>
                openExternalLink(
                  `https://dashboard.convex.dev/t/${selectedTeam.slug}/settings`,
                )
              }
            >
              Team Settings
            </MenuItem>
          )}

          {/* Project Settings - opens in browser */}
          {selectedTeam && selectedProject && (
            <MenuItem
              icon={<Settings className="h-4 w-4" />}
              rightLabel={selectedProject.name}
              external
              onClick={() =>
                openExternalLink(
                  `https://dashboard.convex.dev/t/${selectedTeam.slug}/${selectedProject.slug}/settings`,
                )
              }
            >
              Project Settings
            </MenuItem>
          )}

          <Separator className="bg-border-muted my-1.5" />

          <div className="px-3 flex items-center justify-between">
            <span className="text-sm text-text-base">Theme</span>
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

          {/* Logout */}
          <MenuItem
            icon={<LogOut className="h-4 w-4" />}
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
      <div className="flex items-center gap-2.5">
        {icon && <span className="text-text-muted">{icon}</span>}
        <span>{children}</span>
      </div>
      <div className="flex items-center gap-1.5">
        {rightLabel && (
          <span className="text-text-muted text-xs truncate max-w-[80px]">
            {rightLabel}
          </span>
        )}
        {external && <ExternalLink className="h-3 w-3 text-text-disabled" />}
      </div>
    </button>
  );
}

export default UserMenu;
