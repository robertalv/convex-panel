import type { ClassValue } from "clsx";

export type Framework = "react" | "vite" | "nextjs" | "tanstack-start";

export const frameworks: { id: Framework; label: string; icon: string }[] = [
  { id: "react", label: "React", icon: "⚛️" },
  { id: "vite", label: "Vite", icon: "⚡" },
  { id: "nextjs", label: "Next.js", icon: "▲" },
  { id: "tanstack-start", label: "TanStack Start", icon: "💚" },
];

export type DocsPath =
  | "/docs"
  | "/docs/installation"
  | "/docs/environment"
  | "/docs/quick-start"
  | "/docs/configuration"
  | "/docs/data-view"
  | "/docs/logs-view"
  | "/docs/functions";

export type DocsNavItem = {
  label: string;
  href: DocsPath;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
};

export type DocsNavSection = {
  title: string;
  items: DocsNavItem[];
};

export type CnInput = ClassValue;


