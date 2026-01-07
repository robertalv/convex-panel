/**
 * ContextMenu Component
 * A simple context menu for cell actions
 * Simplified version of @packages/panel context-menu.tsx
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";

export interface ContextMenuItemDescriptor {
  label: string;
  onClick: () => void;
  shortcut?: string;
  destructive?: boolean;
}

export type ContextMenuEntry = ContextMenuItemDescriptor | { type: "divider" };

export interface ContextMenuProps {
  items: ContextMenuEntry[];
  position: { x: number; y: number };
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  items,
  position,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  // Get only actionable items (no dividers)
  const actionableItems = items.filter(
    (item): item is ContextMenuItemDescriptor =>
      !("type" in item && (item as { type: string }).type === "divider"),
  );

  // Execute selected item
  const executeSelected = useCallback(() => {
    if (selectedIndex >= 0 && selectedIndex < actionableItems.length) {
      const item = actionableItems[selectedIndex];
      item.onClick();
      onClose();
    }
  }, [selectedIndex, actionableItems, onClose]);

  // Adjust position to stay within viewport
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let x = position.x;
      let y = position.y;

      // Adjust horizontal position
      if (x + rect.width > viewportWidth - 10) {
        x = viewportWidth - rect.width - 10;
      }

      // Adjust vertical position
      if (y + rect.height > viewportHeight - 10) {
        y = viewportHeight - rect.height - 10;
      }

      // Ensure not negative
      x = Math.max(10, x);
      y = Math.max(10, y);

      setAdjustedPosition({ x, y });
    }
  }, [position]);

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (!menuRef.current) return;
      const target = event.target as Node;
      if (!menuRef.current.contains(target)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      // Arrow key navigation
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % actionableItems.length);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex(
          (prev) =>
            (prev - 1 + actionableItems.length) % actionableItems.length,
        );
        return;
      }

      // Enter to activate
      if (event.key === "Enter") {
        event.preventDefault();
        executeSelected();
        return;
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, actionableItems, executeSelected]);

  return createPortal(
    <div
      ref={menuRef}
      style={{
        position: "fixed",
        top: adjustedPosition.y,
        left: adjustedPosition.x,
        minWidth: 180,
        backgroundColor: "var(--color-surface-raised)",
        border: "1px solid var(--color-border-base)",
        borderRadius: 8,
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
        padding: "4px 0",
        zIndex: 100000,
        pointerEvents: "auto",
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {items.map((item, index) => {
        if ("type" in item && item.type === "divider") {
          return (
            <div
              key={`divider-${index}`}
              style={{
                borderTop: "1px solid var(--color-border-base)",
                margin: "4px 0",
              }}
            />
          );
        }
        const action = item as ContextMenuItemDescriptor;
        const actionableIndex = actionableItems.findIndex((a) => a === action);
        const isSelected = actionableIndex === selectedIndex;

        return (
          <button
            key={action.label}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              event.preventDefault();
              action.onClick();
              onClose();
            }}
            onMouseEnter={() => setSelectedIndex(actionableIndex)}
            style={{
              width: "100%",
              padding: "6px 12px",
              backgroundColor: isSelected
                ? action.destructive
                  ? "rgba(239, 68, 68, 0.1)"
                  : "var(--color-surface-overlay)"
                : "transparent",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "12px",
              color: action.destructive
                ? "var(--color-error-base)"
                : "var(--color-text-base)",
              cursor: "pointer",
              transition: "background 0.1s",
            }}
          >
            <span>{action.label}</span>
            {action.shortcut && (
              <span
                style={{
                  color: "var(--color-text-muted)",
                  fontSize: "11px",
                  marginLeft: "16px",
                }}
              >
                {action.shortcut}
              </span>
            )}
          </button>
        );
      })}
    </div>,
    document.body,
  );
};

export default ContextMenu;
