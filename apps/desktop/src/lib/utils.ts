import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { open } from "@tauri-apps/plugin-shell";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const openExternalLink = async (url: string) => {
  if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
    open(url);
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
};

export function getDashboardUrl(
  teamSlug: string | null | undefined,
  projectSlug: string | null | undefined,
  deploymentName: string | undefined,
): string {
  if (teamSlug && projectSlug && deploymentName) {
    return `https://dashboard.convex.dev/t/${teamSlug}/${projectSlug}/${deploymentName}/settings`;
  }
  return "https://dashboard.convex.dev";
}
