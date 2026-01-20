import { IconProps } from "@/components";

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: IconProps;
  shortcut?: string;
  /** If true, this nav item is only available in OAuth mode (not deploy key mode) */
  requiresOAuth?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: "health",
    label: "Health",
    path: "/health",
    icon: { name: "activity" },
    shortcut: "⌘1",
  },
  {
    id: "data",
    label: "Data",
    path: "/data",
    icon: { name: "table" },
    shortcut: "⌘2",
  },
  {
    id: "schema",
    label: "Schema",
    path: "/schema",
    icon: { name: "flow" },
    shortcut: "⌘3",
    requiresOAuth: true, // Not available in deploy key mode
  },
  {
    id: "advisor",
    label: "Advisor",
    path: "/advisor",
    icon: { name: "performance" },
    shortcut: "⌘4",
    requiresOAuth: true, // Not available in deploy key mode
  },
  {
    id: "functions",
    label: "Functions",
    path: "/functions",
    icon: { name: "code" },
    shortcut: "⌘5",
  },
  {
    id: "files",
    label: "Files",
    path: "/files",
    icon: { name: "files" },
    shortcut: "⌘7",
  },
  {
    id: "schedules",
    label: "Schedules",
    path: "/schedules",
    icon: { name: "timer" },
    shortcut: "⌘8",
  },
  {
    id: "logs",
    label: "Logs",
    path: "/logs",
    icon: { name: "logs" },
    shortcut: "⌘9",
  },
  {
    id: "marketplace",
    label: "Marketplace",
    path: "/marketplace",
    icon: { name: "marketplace" },
    shortcut: "G then M",
    requiresOAuth: true,
  },
];

/**
 * Get filtered navigation items based on auth mode
 * In deploy key mode, items with requiresOAuth=true are hidden
 */
export function getFilteredNavItems(isDeployKeyMode: boolean): NavItem[] {
  if (!isDeployKeyMode) {
    return NAV_ITEMS;
  }
  return NAV_ITEMS.filter((item) => !item.requiresOAuth);
}
