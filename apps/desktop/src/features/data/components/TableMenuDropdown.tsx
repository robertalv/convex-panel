/**
 * TableMenuDropdown Component
 * Dropdown menu for table-level actions: Custom query, Schema, Indexes, Metrics, Clear Table, Delete Table
 */

import { useState, useRef, useEffect } from "react";
import {
  MoreVertical,
  Code,
  Box,
  Fingerprint,
  BarChart3,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { IconButton } from "@/components/ui/button";

export interface TableMenuDropdownProps {
  onCustomQuery: () => void;
  onSchema: () => void;
  onIndexes: () => void;
  onMetrics: () => void;
  onClearTable?: () => void;
  onDeleteTable?: () => void;
  disabled?: boolean;
}

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}

export function TableMenuDropdown({
  onCustomQuery,
  onSchema,
  onIndexes,
  onMetrics,
  onClearTable,
  onDeleteTable,
  disabled = false,
}: TableMenuDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const menuItems: MenuItem[] = [
    {
      icon: <Code size={14} />,
      label: "Custom query",
      onClick: () => {
        onCustomQuery();
        setIsOpen(false);
      },
    },
    {
      icon: <Box size={14} />,
      label: "Schema",
      onClick: () => {
        onSchema();
        setIsOpen(false);
      },
    },
    {
      icon: <Fingerprint size={14} />,
      label: "Indexes",
      onClick: () => {
        onIndexes();
        setIsOpen(false);
      },
    },
    {
      icon: <BarChart3 size={14} />,
      label: "Metrics",
      onClick: () => {
        onMetrics();
        setIsOpen(false);
      },
    },
    ...(onClearTable
      ? [
          {
            icon: <RotateCcw size={14} />,
            label: "Clear Table",
            onClick: () => {
              onClearTable();
              setIsOpen(false);
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
              setIsOpen(false);
            },
            destructive: true,
          },
        ]
      : []),
  ];

  // Reset highlighted index when menu opens
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(-1);
    }
  }, [isOpen]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      if (event.key === "Escape") {
        setIsOpen(false);
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

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, highlightedIndex, menuItems]);

  return (
    <div className="relative">
      <IconButton
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        variant="ghost"
        size="sm"
        tooltip="More actions"
        style={{
          backgroundColor: isOpen ? "var(--color-surface-raised)" : undefined,
        }}
      >
        <MoreVertical size={16} />
      </IconButton>

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 top-full mt-1 min-w-[180px] rounded-xl shadow-lg z-50 overflow-hidden p-1"
          style={{
            backgroundColor: "var(--color-surface-base)",
            border: "1px solid var(--color-border-muted)",
            animation: "tableMenuFadeUp 0.15s ease",
          }}
        >
          {menuItems.map((item, index) => {
            const isHighlighted = index === highlightedIndex;
            return (
              <button
                key={index}
                type="button"
                onClick={item.onClick}
                onMouseEnter={() => setHighlightedIndex(index)}
                className="w-full flex items-center gap-2 px-2.5 py-2 text-sm text-left rounded-lg transition-colors"
                style={{
                  backgroundColor: isHighlighted
                    ? "var(--color-surface-raised)"
                    : "transparent",
                  color: item.destructive
                    ? "var(--color-error-base)"
                    : "var(--color-text-base)",
                  marginBottom: index < menuItems.length - 1 ? "2px" : 0,
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    color: item.destructive
                      ? "var(--color-error-base)"
                      : "var(--color-text-muted)",
                  }}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

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
    </div>
  );
}

export default TableMenuDropdown;
