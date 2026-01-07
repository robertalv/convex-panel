import React, { useEffect, useRef, useState } from "react";
import {
  Code,
  Box,
  Fingerprint,
  BarChart3,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { createPortal } from "react-dom";
import { useThemeSafe } from "../../../hooks/useTheme";
import { usePortalTarget } from "../../../contexts/portal-context";

export interface TableMenuDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  onCustomQuery: () => void;
  onSchema: () => void;
  onIndexes: () => void;
  onMetrics: () => void;
  onClearTable?: () => void;
  onDeleteTable?: () => void;
}

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}

export const TableMenuDropdown: React.FC<TableMenuDropdownProps> = ({
  isOpen,
  onClose,
  position,
  onCustomQuery,
  onSchema,
  onIndexes,
  onMetrics,
  onClearTable,
  onDeleteTable,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const { theme } = useThemeSafe();
  const portalTarget = usePortalTarget();

  const menuItems: MenuItem[] = [
    {
      icon: <Code size={14} />,
      label: "Custom query",
      onClick: () => {
        onCustomQuery();
        onClose();
      },
    },
    {
      icon: <Box size={14} />,
      label: "Schema",
      onClick: () => {
        onSchema();
        onClose();
      },
    },
    {
      icon: <Fingerprint size={14} />,
      label: "Indexes",
      onClick: () => {
        onIndexes();
        onClose();
      },
    },
    {
      icon: <BarChart3 size={14} />,
      label: "Metrics",
      onClick: () => {
        onMetrics();
        onClose();
      },
    },
    ...(onClearTable
      ? [
          {
            icon: <RotateCcw size={14} />,
            label: "Clear Table",
            onClick: () => {
              onClearTable();
              onClose();
            },
            destructive: true,
          },
        ]
      : []),
    ...(onDeleteTable
      ? [
          {
            icon: <Trash2 size={14} />,
            label: "Delete Table",
            onClick: () => {
              onDeleteTable();
              onClose();
            },
            destructive: true,
          },
        ]
      : []),
  ];

  // Update position when it changes and ensure it's visible
  useEffect(() => {
    const menuWidth = 180;
    const viewportWidth = window.innerWidth;

    let x = position.x;
    let y = position.y;

    // Ensure initial position is within viewport bounds
    if (x + menuWidth > viewportWidth) {
      x = Math.max(8, viewportWidth - menuWidth - 8);
    }
    if (x < 8) {
      x = 8;
    }
    if (y < 8) {
      y = 8;
    }

    setAdjustedPosition({ x, y });
  }, [position]);

  // Reset highlighted index when menu opens
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(-1);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        setHighlightedIndex((prev) =>
          prev < menuItems.length - 1 ? prev + 1 : prev,
        );
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (event.key === "Enter" && highlightedIndex >= 0) {
        event.preventDefault();
        menuItems[highlightedIndex].onClick();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    // Adjust position after render
    const adjustPosition = () => {
      if (menuRef.current) {
        const rect = menuRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const menuWidth = 180;

        let x = adjustedPosition.x;
        let y = adjustedPosition.y;

        const actualMenuWidth = rect.width || menuWidth;
        if (x + actualMenuWidth > viewportWidth) {
          x = Math.max(8, viewportWidth - actualMenuWidth - 8);
        }
        if (x < 8) {
          x = 8;
        }

        if (y + rect.height > viewportHeight) {
          y = adjustedPosition.y - rect.height - 8;
        }
        if (y < 8) {
          y = 8;
        }

        if (x !== adjustedPosition.x || y !== adjustedPosition.y) {
          setAdjustedPosition({ x, y });
        }
      }
    };

    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(adjustPosition);
    });

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, adjustedPosition, onClose, menuItems, highlightedIndex]);

  if (!isOpen || !adjustedPosition) return null;

  if (
    !adjustedPosition ||
    adjustedPosition.x < 0 ||
    adjustedPosition.y < 0 ||
    !portalTarget
  ) {
    return null;
  }

  return createPortal(
    <div
      ref={menuRef}
      className={`cp-theme-${theme}`}
      style={{
        position: "fixed",
        left: `${Math.max(0, adjustedPosition.x)}px`,
        top: `${Math.max(0, adjustedPosition.y)}px`,
        backgroundColor: "var(--color-panel-bg)",
        border: "1px solid var(--color-panel-border)",
        borderRadius: "12px",
        boxShadow: "0 4px 16px var(--color-panel-shadow)",
        zIndex: 100000,
        width: "180px",
        padding: "4px",
        display: "flex",
        flexDirection: "column",
        pointerEvents: "auto",
        overflow: "hidden",
        animation: "tableMenuFadeUp 0.15s ease",
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {menuItems.map((item, index) => {
        const isHighlighted = index === highlightedIndex;
        return (
          <button
            key={index}
            data-index={index}
            onClick={item.onClick}
            onMouseEnter={() => setHighlightedIndex(index)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 10px",
              backgroundColor: isHighlighted
                ? "var(--color-panel-bg-tertiary)"
                : "transparent",
              border: "none",
              borderRadius: "10px",
              color: item.destructive
                ? "var(--color-panel-error)"
                : "var(--color-panel-text)",
              fontSize: "13px",
              cursor: "pointer",
              textAlign: "left",
              width: "100%",
              transition: "background-color 0.1s ease",
              marginBottom: index < menuItems.length - 1 ? "2px" : 0,
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                color: item.destructive
                  ? "var(--color-panel-error)"
                  : "var(--color-panel-text-muted)",
              }}
            >
              {item.icon}
            </span>
            <span>{item.label}</span>
          </button>
        );
      })}

      {/* Keyframe animation styles */}
      <style>{`
        @keyframes tableMenuFadeUp {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>,
    portalTarget,
  );
};
