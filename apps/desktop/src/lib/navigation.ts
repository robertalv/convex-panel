import { IconProps } from "@/components";

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: IconProps;
  shortcut?: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: "health",
    label: "Health",
    path: "/health",
    icon: { name: "activity" },
    shortcut: "G then H",
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
  },
  {
    id: "advisor",
    label: "Advisor",
    path: "/advisor",
    icon: { name: "performance" },
    shortcut: "⌘4",
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
];