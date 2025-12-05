import type React from "react";

export type Framework = "react" | "next" | "vue" | "svelte" | "tanstack-start";

export type DocSectionId =
  | "quick-start"
  | "intro"
  | "installation"
  | "functions"
  | "queries"
  | "mutations"
  | "actions"
  | "data"
  | "logs"
  | "api-reference"
  | "configuration"
  | "authentication";

export interface FrameworkData {
  id: Framework;
  label: string;
  icon: React.ElementType | string;
  install: string;
  setup: string;
  filename: string;
  description: string;
}

export interface MenuItem {
  id: DocSectionId;
  label: string;
  icon?: React.ElementType;
  subItems?: { id: DocSectionId; label: string }[];
}

export interface MenuCategory {
  category: string;
  items: MenuItem[];
}

