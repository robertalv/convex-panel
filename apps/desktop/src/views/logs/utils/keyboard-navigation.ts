/**
 * Keyboard Navigation Utilities
 * Reusable keyboard handlers for log navigation in both live and historical views
 */

import { useEffect, useCallback, useRef } from "react";
import type { LogEntry } from "../types";

export interface KeyboardNavigationOptions<T = LogEntry> {
  /** Array of items to navigate through */
  items: T[];
  /** Currently selected item */
  selectedItem: T | null;
  /** Callback when selection changes */
  onSelectItem: (item: T | null) => void;
  /** Whether the detail sheet is open */
  isDetailOpen: boolean;
  /** Callback to close the detail sheet */
  onCloseDetail: () => void;
  /** Optional: Custom key extractor */
  getItemKey?: (item: T) => string;
  /** Optional: Disable navigation */
  disabled?: boolean;
}

/**
 * Hook for keyboard navigation in log lists
 * Supports: Arrow Up/Down, Escape, Enter
 */
export function useKeyboardNavigation<T extends LogEntry>({
  items,
  selectedItem,
  onSelectItem,
  isDetailOpen,
  onCloseDetail,
  getItemKey = (item) => item.id,
  disabled = false,
}: KeyboardNavigationOptions<T>) {
  const itemsRef = useRef(items);
  const selectedItemRef = useRef(selectedItem);

  // Keep refs in sync
  useEffect(() => {
    itemsRef.current = items;
    selectedItemRef.current = selectedItem;
  }, [items, selectedItem]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (disabled) return;

      // Close detail sheet on Escape
      if (event.key === "Escape" && isDetailOpen) {
        event.preventDefault();
        onCloseDetail();
        return;
      }

      // Don't handle navigation if focus is in an input/textarea
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const currentItems = itemsRef.current;
      const currentSelected = selectedItemRef.current;

      if (currentItems.length === 0) return;

      // Arrow Up - Select previous item
      if (event.key === "ArrowUp") {
        event.preventDefault();
        const currentIndex = currentSelected
          ? currentItems.findIndex(
              (item) => getItemKey(item) === getItemKey(currentSelected),
            )
          : -1;
        const prevIndex =
          currentIndex <= 0 ? currentItems.length - 1 : currentIndex - 1;
        onSelectItem(currentItems[prevIndex]);
        return;
      }

      // Arrow Down - Select next item
      if (event.key === "ArrowDown") {
        event.preventDefault();
        const currentIndex = currentSelected
          ? currentItems.findIndex(
              (item) => getItemKey(item) === getItemKey(currentSelected),
            )
          : -1;
        const nextIndex =
          currentIndex >= currentItems.length - 1 ? 0 : currentIndex + 1;
        onSelectItem(currentItems[nextIndex]);
        return;
      }

      // Enter - Open detail sheet for selected item
      if (event.key === "Enter" && currentSelected && !isDetailOpen) {
        event.preventDefault();
        // Selection already done, detail sheet will open automatically
        // This is just to prevent default behavior
        return;
      }
    },
    [disabled, isDetailOpen, onCloseDetail, onSelectItem, getItemKey],
  );

  useEffect(() => {
    if (disabled) return;

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown, disabled]);
}

/**
 * Scrolls an element into view smoothly
 */
export function scrollIntoViewIfNeeded(
  element: HTMLElement | null,
  container: HTMLElement | null,
) {
  if (!element || !container) return;

  const elementRect = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  // Check if element is already fully visible
  const isVisible =
    elementRect.top >= containerRect.top &&
    elementRect.bottom <= containerRect.bottom;

  if (!isVisible) {
    element.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }
}

/**
 * Helper to get keyboard shortcut display string for the platform
 */
export function getKeyboardShortcut(
  key: string,
  modifiers?: {
    meta?: boolean;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
  },
): string {
  const isMac =
    typeof navigator !== "undefined" &&
    navigator.platform.toUpperCase().includes("MAC");
  const parts: string[] = [];

  if (modifiers?.meta) {
    parts.push(isMac ? "⌘" : "Ctrl");
  }
  if (modifiers?.ctrl && !modifiers?.meta) {
    parts.push("Ctrl");
  }
  if (modifiers?.shift) {
    parts.push("⇧");
  }
  if (modifiers?.alt) {
    parts.push(isMac ? "⌥" : "Alt");
  }

  parts.push(key);
  return parts.join(isMac ? "" : "+");
}

/**
 * Common keyboard shortcuts for log views
 */
export const LOG_KEYBOARD_SHORTCUTS = {
  NAVIGATE_UP: { key: "ArrowUp", label: "Navigate up" },
  NAVIGATE_DOWN: { key: "ArrowDown", label: "Navigate down" },
  OPEN_DETAIL: { key: "Enter", label: "Open details" },
  CLOSE_DETAIL: { key: "Escape", label: "Close details" },
  SEARCH: { key: "/", label: "Focus search", modifiers: { meta: true } },
} as const;
