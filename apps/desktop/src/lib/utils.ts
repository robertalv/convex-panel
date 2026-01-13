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