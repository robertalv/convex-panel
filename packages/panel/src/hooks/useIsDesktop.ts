/**
 * Hook to detect if running in the desktop (Tauri) app
 */

import { useState, useEffect } from "react";

declare global {
  interface Window {
    __TAURI__?: unknown;
    __TAURI_INTERNALS__?: unknown;
  }
}

/**
 * Check if currently running in the Tauri desktop app
 */
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    // Check for Tauri global objects
    const hasTauri =
      typeof window !== "undefined" &&
      (window.__TAURI__ !== undefined ||
        window.__TAURI_INTERNALS__ !== undefined);

    setIsDesktop(hasTauri);
  }, []);

  return isDesktop;
}

/**
 * Synchronous check for Tauri environment
 * Useful for conditional rendering without flash
 */
export function isDesktopEnvironment(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.__TAURI__ !== undefined || window.__TAURI_INTERNALS__ !== undefined
  );
}
