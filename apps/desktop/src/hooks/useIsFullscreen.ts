import { useState, useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

/**
 * Hook to detect if the Tauri window is fullscreen
 */
export function useIsFullscreen(): boolean {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // Only run in Tauri environment
    if (typeof window === "undefined" || !(window as any).__TAURI_INTERNALS__) {
      return;
    }

    const appWindow = getCurrentWindow();
    let unlisten: (() => void) | undefined;

    const checkFullscreen = async () => {
      try {
        const fullscreen = await appWindow.isFullscreen();
        setIsFullscreen(fullscreen);
      } catch (error) {
        console.debug("[useIsFullscreen] Could not detect fullscreen state:", error);
      }
    };

    checkFullscreen();

    const setupListener = async () => {
      try {
        unlisten = await appWindow.onResized(() => {
          checkFullscreen();
        });
      } catch (error) {
        console.debug("[useIsFullscreen] Could not setup resize listener:", error);
      }
    };

    setupListener();

    return () => {
      unlisten?.();
    };
  }, []);

  return isFullscreen;
}

