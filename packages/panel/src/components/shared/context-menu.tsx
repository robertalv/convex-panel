import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useThemeSafe } from "../../hooks/useTheme";
import { useSheetActionsSafe } from "../../contexts/sheet-context";
import { usePortalTarget } from "../../contexts/portal-context";

export interface ViewingAction {
  title?: string;
  content: React.ReactNode;
  width?: string;
}

export interface ContextMenuItemDescriptor {
  label: string;
  onClick: () => void;
  shortcut?: string;
  destructive?: boolean;
  viewing?: ViewingAction;
  submenu?: ContextMenuEntry[];
}

export type ContextMenuEntry = ContextMenuItemDescriptor | { type: "divider" };

export interface ContextMenuProps {
  items: ContextMenuEntry[];
  position: { x: number; y: number };
  onClose: () => void;
}

// Parse shortcut string to key combination
function parseShortcut(shortcut: string): {
  key: string;
  meta: boolean;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
} {
  const parts = shortcut.toLowerCase().split("+");
  return {
    key: parts[parts.length - 1],
    meta: parts.includes("meta") || parts.includes("cmd"),
    ctrl: parts.includes("ctrl"),
    shift: parts.includes("shift"),
    alt: parts.includes("alt"),
  };
}

// Check if keyboard event matches shortcut
function matchesShortcut(
  event: KeyboardEvent,
  shortcut: {
    key: string;
    meta: boolean;
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
  },
): boolean {
  const isMac = navigator.platform.includes("Mac");
  const key = event.key.toLowerCase();

  // Map special keys
  const keyMap: Record<string, string> = {
    enter: "return",
    " ": "space",
    escape: "esc",
  };

  const normalizedKey = keyMap[key] || key;
  const normalizedShortcutKey = keyMap[shortcut.key] || shortcut.key;

  if (normalizedKey !== normalizedShortcutKey) return false;

  // Check modifiers
  const metaMatch = shortcut.meta
    ? isMac
      ? event.metaKey
      : event.ctrlKey
    : !event.metaKey && !event.ctrlKey;
  const ctrlMatch = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey;
  const shiftMatch = shortcut.shift === event.shiftKey;
  const altMatch = shortcut.alt === event.altKey;

  // For Mac, meta takes precedence over ctrl
  if (isMac && shortcut.meta) {
    return metaMatch && shiftMatch && altMatch && !event.ctrlKey;
  }

  return metaMatch && ctrlMatch && shiftMatch && altMatch;
}

const ViewingContentWrapper: React.FC<{
  title?: string;
  children: React.ReactNode;
}> = ({ title, children }) => {
  const { closeSheet } = useSheetActionsSafe();

  // Parse title to separate "Viewing" from field name
  const parseTitle = (title?: string) => {
    if (!title) return { prefix: null, fieldName: null };

    // Check if title starts with "Viewing " (case-insensitive)
    const viewingMatch = title.match(/^Viewing\s+(.+)$/i);
    if (viewingMatch) {
      return { prefix: "Viewing", fieldName: viewingMatch[1] };
    }

    // If no "Viewing" prefix, treat entire title as field name
    return { prefix: null, fieldName: title };
  };

  const { prefix, fieldName } = parseTitle(title);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: "var(--color-panel-bg-secondary)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0px 12px",
          borderBottom: "1px solid var(--color-panel-border)",
          backgroundColor: "var(--color-panel-bg-secondary)",
          height: "40px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--color-panel-text)",
          }}
        >
          {prefix && <span>{prefix}</span>}
          {fieldName && (
            <span
              style={{
                fontSize: "12px",
                fontWeight: 500,
                fontFamily: "monospace",
                border: "1px solid var(--color-panel-border)",
                borderRadius: "6px",
                padding: "4px",
                color: "var(--color-panel-text)",
              }}
            >
              {fieldName}
            </span>
          )}
        </div>

        {/* Close Button */}
        {closeSheet && (
          <button
            type="button"
            onClick={closeSheet}
            style={{
              padding: "6px",
              color: "var(--color-panel-text-secondary)",
              backgroundColor: "transparent",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "4px",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--color-panel-text)";
              e.currentTarget.style.backgroundColor =
                "var(--color-panel-border)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--color-panel-text-secondary)";
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
        }}
      >
        {children}
      </div>
    </div>
  );
};

export const ContextMenu: React.FC<ContextMenuProps> = ({
  items,
  position,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const submenuRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const { theme } = useThemeSafe();
  const { openSheet } = useSheetActionsSafe();
  const portalTarget = usePortalTarget();
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [hoveredItemIndex, setHoveredItemIndex] = useState<number | null>(null);
  const [submenuPosition, setSubmenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const closeSubmenuTimeoutRef = useRef<number | null>(null);

  // Get only actionable items (no dividers)
  const actionableItems = items.filter(
    (item): item is ContextMenuItemDescriptor =>
      !("type" in item && (item as { type: string }).type === "divider"),
  );

  // Execute selected item
  const executeSelected = useCallback(() => {
    if (selectedIndex >= 0 && selectedIndex < actionableItems.length) {
      const item = actionableItems[selectedIndex];

      // If this is a viewing action, open the sheet
      if (item.viewing) {
        openSheet({
          title: item.viewing.title,
          content: (
            <ViewingContentWrapper title={item.viewing.title}>
              {item.viewing.content}
            </ViewingContentWrapper>
          ),
          width: item.viewing.width,
        });
        onClose();
        return;
      }

      // Otherwise, execute the onClick handler
      item.onClick();
      onClose();
    }
  }, [selectedIndex, actionableItems, onClose, openSheet]);

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (!menuRef.current) return;
      const target = event.target as Node;
      // Only close if the click is truly outside both menus
      if (
        !menuRef.current.contains(target) &&
        !(submenuRef.current && submenuRef.current.contains(target))
      ) {
        onClose();
      }
    };
    const handleContextMenu = (event: MouseEvent) => {
      if (!menuRef.current) return;
      const target = event.target as Node;
      if (
        !menuRef.current.contains(target) &&
        !(submenuRef.current && submenuRef.current.contains(target))
      ) {
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

      // Enter or Space to activate
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        executeSelected();
        return;
      }

      // Number keys for quick selection (1-9)
      const numKey = parseInt(event.key);
      if (!isNaN(numKey) && numKey >= 1 && numKey <= 9) {
        const index = numKey - 1;
        if (index < actionableItems.length) {
          event.preventDefault();
          const item = actionableItems[index];

          // If this is a viewing action, open the sheet
          if (item.viewing) {
            openSheet({
              title: item.viewing.title,
              content: (
                <ViewingContentWrapper title={item.viewing.title}>
                  {item.viewing.content}
                </ViewingContentWrapper>
              ),
              width: item.viewing.width,
            });
            onClose();
            return;
          }

          item.onClick();
          onClose();
        }
        return;
      }

      // Check for shortcut matches
      for (const item of actionableItems) {
        if (item.shortcut) {
          const shortcut = parseShortcut(item.shortcut);
          if (matchesShortcut(event, shortcut)) {
            event.preventDefault();

            // If this is a viewing action, open the sheet
            if (item.viewing) {
              openSheet({
                title: item.viewing.title,
                content: (
                  <ViewingContentWrapper title={item.viewing.title}>
                    {item.viewing.content}
                  </ViewingContentWrapper>
                ),
                width: item.viewing.width,
              });
              onClose();
              return;
            }

            item.onClick();
            onClose();
            return;
          }
        }
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      // Clear timeout on unmount
      if (closeSubmenuTimeoutRef.current) {
        clearTimeout(closeSubmenuTimeoutRef.current);
      }
    };
  }, [onClose, actionableItems, executeSelected, openSheet, submenuPosition]);

  if (!portalTarget) return null;

  return createPortal(
    <div
      ref={menuRef}
      className={`global-context-menu cp-theme-${theme}`}
      style={{
        position: "fixed",
        top: position.y,
        left: position.x,
        minWidth: 220,
        backgroundColor: "var(--color-panel-bg-secondary)",
        border: "1px solid var(--color-panel-border)",
        borderRadius: 12,
        boxShadow: "0 20px 35px var(--color-panel-shadow)",
        padding: "6px 0",
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
                borderTop: "1px solid var(--color-panel-border)",
                margin: "6px 0",
              }}
            />
          );
        }
        const action = item as ContextMenuItemDescriptor;
        const actionableIndex = actionableItems.findIndex((a) => a === action);
        const isSelected = actionableIndex === selectedIndex;

        const hasSubmenu = Boolean(action.submenu && action.submenu.length > 0);
        const showSubmenu = hoveredItemIndex === actionableIndex && hasSubmenu;

        return (
          <div
            key={action.label}
            style={{ position: "relative" }}
            onMouseEnter={() => {
              setSelectedIndex(actionableIndex);
              // Clear any pending close timeout
              if (closeSubmenuTimeoutRef.current) {
                clearTimeout(closeSubmenuTimeoutRef.current);
                closeSubmenuTimeoutRef.current = null;
              }
              if (hasSubmenu) {
                setHoveredItemIndex(actionableIndex);
                // Calculate submenu position
                const itemElement = itemRefs.current.get(actionableIndex);
                if (itemElement && menuRef.current) {
                  const rect = itemElement.getBoundingClientRect();
                  const menuRect = menuRef.current.getBoundingClientRect();
                  setSubmenuPosition({
                    top: rect.top,
                    left: menuRect.right - 4, // Overlap slightly to bridge gap
                  });
                }
              }
            }}
            onMouseLeave={(e) => {
              // Check if mouse is moving to submenu
              const relatedTarget = e.relatedTarget as HTMLElement;
              if (
                relatedTarget &&
                submenuRef.current?.contains(relatedTarget)
              ) {
                return; // Don't close if moving to submenu
              }
              // Add a small delay before closing to allow mouse to move to submenu
              closeSubmenuTimeoutRef.current = window.setTimeout(() => {
                setHoveredItemIndex(null);
                setSubmenuPosition(null);
              }, 200);
            }}
            ref={(el) => {
              if (el) {
                itemRefs.current.set(actionableIndex, el);
              }
            }}
          >
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                event.preventDefault();

                // Don't close if there's a submenu
                if (hasSubmenu) {
                  return;
                }

                // If this is a viewing action, open the sheet
                if (action.viewing) {
                  openSheet({
                    title: action.viewing.title,
                    content: (
                      <ViewingContentWrapper title={action.viewing.title}>
                        {action.viewing.content}
                      </ViewingContentWrapper>
                    ),
                    width: action.viewing.width,
                  });
                  onClose();
                  return;
                }

                action.onClick();
                onClose();
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              style={{
                width: "100%",
                padding: "6px 14px",
                backgroundColor: isSelected
                  ? action.destructive
                    ? "color-mix(in srgb, var(--color-panel-error) 10%, transparent)"
                    : "var(--color-panel-hover)"
                  : "transparent",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "12px",
                color: action.destructive
                  ? "var(--color-panel-error)"
                  : "var(--color-panel-text)",
                cursor: "pointer",
                transition: "background 0.15s,color 0.15s",
              }}
            >
              <span>{action.label}</span>
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                {action.shortcut && (
                  <span
                    style={{
                      color: "var(--color-panel-text-muted)",
                      fontSize: "11px",
                    }}
                  >
                    {action.shortcut}
                  </span>
                )}
                {hasSubmenu && (
                  <span
                    style={{
                      color: "var(--color-panel-text-muted)",
                      fontSize: "10px",
                    }}
                  >
                    ▶
                  </span>
                )}
              </div>
            </button>

            {showSubmenu && action.submenu && submenuPosition && (
              <div
                ref={submenuRef}
                style={{
                  position: "fixed",
                  top: submenuPosition.top,
                  left: submenuPosition.left,
                  minWidth: 220,
                  backgroundColor: "var(--color-panel-bg-secondary)",
                  border: "1px solid var(--color-panel-border)",
                  borderRadius: 12,
                  boxShadow: "0 20px 35px var(--color-panel-shadow)",
                  padding: "6px 0",
                  zIndex: 100001,
                  maxHeight: "400px",
                  overflowY: "auto",
                  // Overlap with parent menu to bridge gap
                  marginLeft: "0px",
                  pointerEvents: "auto",
                }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onMouseEnter={() => {
                  // Clear any pending close timeout
                  if (closeSubmenuTimeoutRef.current) {
                    clearTimeout(closeSubmenuTimeoutRef.current);
                    closeSubmenuTimeoutRef.current = null;
                  }
                  setHoveredItemIndex(actionableIndex);
                }}
                onMouseLeave={() => {
                  // Close submenu when mouse leaves it
                  setHoveredItemIndex(null);
                  setSubmenuPosition(null);
                }}
              >
                {action.submenu.map((subItem, subIndex) => {
                  if ("type" in subItem && subItem.type === "divider") {
                    return (
                      <div
                        key={`sub-divider-${subIndex}`}
                        style={{
                          borderTop: "1px solid var(--color-panel-border)",
                          margin: "6px 0",
                        }}
                      />
                    );
                  }
                  const subAction = subItem as ContextMenuItemDescriptor;
                  return (
                    <button
                      key={subAction.label}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        event.preventDefault();
                        subAction.onClick();
                        onClose();
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                      }}
                      style={{
                        width: "100%",
                        padding: "6px 14px",
                        backgroundColor: "transparent",
                        border: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: "12px",
                        color: subAction.destructive
                          ? "var(--color-panel-error)"
                          : "var(--color-panel-text)",
                        cursor: "pointer",
                        transition: "background 0.15s,color 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          subAction.destructive
                            ? "color-mix(in srgb, var(--color-panel-error) 10%, transparent)"
                            : "var(--color-panel-hover)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = subAction.destructive
                          ? "var(--color-panel-error)"
                          : "var(--color-panel-text)";
                      }}
                    >
                      <span>{subAction.label}</span>
                      {subAction.shortcut && (
                        <span
                          style={{
                            color: "var(--color-panel-text-muted)",
                            fontSize: "11px",
                          }}
                        >
                          {subAction.shortcut}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>,
    portalTarget,
  );
};
