/**
 * useFileWatcher Hook
 * Watches files or directories for changes using Tauri's fs watch plugin
 */

import { useEffect, useRef, useCallback } from "react";
import { watch, type WatchEvent } from "@tauri-apps/plugin-fs";
import { useTimeoutRef } from "../../../hooks/useTimeoutRef";

interface UseFileWatcherOptions {
  /** Path to watch (file or directory). If null, watcher is disabled. */
  path: string | null;
  /** Watch subdirectories recursively (default: false) */
  recursive?: boolean;
  /** Debounce delay in milliseconds (default: 300) */
  debounceMs?: number;
  /** Callback when file changes are detected */
  onFileChange?: (event: WatchEvent) => void;
  /** Enable debug logging (default: false) */
  debug?: boolean;
}

/**
 * Hook to watch files or directories for changes
 * Automatically starts/stops watching based on path availability
 * Debounces rapid file change events (useful during file saves)
 */
export function useFileWatcher({
  path,
  recursive = false,
  debounceMs = 300,
  onFileChange,
  debug = false,
}: UseFileWatcherOptions) {
  const stopWatchingRef = useRef<(() => void) | null>(null);
  const { ref: debounceTimerRef, clear: clearDebounceTimer } = useTimeoutRef();
  const isWatchingRef = useRef(false);

  const log = useCallback(
    (...args: any[]) => {
      if (debug) {
        console.log("[useFileWatcher]", ...args);
      }
    },
    [debug],
  );

  // Cleanup function
  const stopWatching = useCallback(() => {
    if (stopWatchingRef.current) {
      log("Stopping file watcher");
      stopWatchingRef.current();
      stopWatchingRef.current = null;
      isWatchingRef.current = false;
    }

    // Clear any pending debounce
    clearDebounceTimer();
  }, [log, clearDebounceTimer]);

  // Start watching
  const startWatching = useCallback(
    async (watchPath: string) => {
      // Stop any existing watcher first
      stopWatching();

      try {
        log(
          `Starting file watcher for: ${watchPath} (recursive: ${recursive})`,
        );

        const unwatch = await watch(
          watchPath,
          (event) => {
            log("File change detected:", event);

            // Debounce the callback
            clearDebounceTimer();

            debounceTimerRef.current = setTimeout(() => {
              log("Triggering onFileChange callback");
              onFileChange?.(event);
              debounceTimerRef.current = null;
            }, debounceMs);
          },
          { recursive },
        );

        stopWatchingRef.current = unwatch;
        isWatchingRef.current = true;
        log("File watcher started successfully");
      } catch (error) {
        console.error("[useFileWatcher] Failed to start watching:", error);
        isWatchingRef.current = false;
        throw error;
      }
    },
    [recursive, debounceMs, onFileChange, stopWatching, log, debounceTimerRef, clearDebounceTimer],
  );

  // Effect to start/stop watching based on path
  useEffect(() => {
    if (path) {
      startWatching(path).catch((error) => {
        console.error("[useFileWatcher] Error starting watcher:", error);
      });
    } else {
      stopWatching();
    }

    // Cleanup on unmount
    return () => {
      stopWatching();
    };
  }, [path, startWatching, stopWatching]);

  return {
    isWatching: isWatchingRef.current,
    stopWatching,
    startWatching,
  };
}

export default useFileWatcher;
