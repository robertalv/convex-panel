import React, { useState, useRef, useEffect } from "react";
import { Download, RotateCcw, Trash2, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BackupActionsDropdownProps {
  onDownload: () => void;
  onRestore: () => void;
  onDelete: () => void;
  disabled?: boolean;
}

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}

export const BackupActionsDropdown: React.FC<BackupActionsDropdownProps> = ({
  onDownload,
  onRestore,
  onDelete,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const menuItems: MenuItem[] = [
    {
      icon: <Download size={14} />,
      label: "Download",
      onClick: () => {
        onDownload();
        setIsOpen(false);
      },
    },
    {
      icon: <RotateCcw size={14} />,
      label: "Restore",
      onClick: () => {
        onRestore();
        setIsOpen(false);
      },
    },
    {
      icon: <Trash2 size={14} />,
      label: "Delete",
      onClick: () => {
        onDelete();
        setIsOpen(false);
      },
      destructive: true,
    },
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
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        disabled={disabled}
        style={{
          padding: "4px 8px",
          backgroundColor: isOpen
            ? "var(--color-surface-raised)"
            : "transparent",
          border: "1px solid var(--color-border-base)",
          borderRadius: "6px",
          color: "var(--color-text-base)",
          cursor: disabled ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => {
          if (!disabled && !isOpen) {
            e.currentTarget.style.backgroundColor =
              "var(--color-surface-hover)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = "transparent";
          }
        }}
      >
        <MoreVertical size={16} />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 top-full mt-1 min-w-[150px] rounded-lg shadow-lg z-50 overflow-hidden p-1 space-y-0.5"
          style={{
            backgroundColor: "var(--color-surface-base)",
            border: "1px solid var(--color-border-base)",
            animation: "backupMenuFadeUp 0.15s ease",
          }}
        >
          {menuItems.map((item, index) => {
            const isHighlighted = index === highlightedIndex;
            return (
              <button
                key={index}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  item.onClick();
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-left rounded-md",
                  "text-xs transition-colors",
                  item.destructive ? "text-error-base" : "text-text-base",
                  isHighlighted && "bg-surface-raised",
                  !isHighlighted && "hover:bg-surface-raised",
                )}
              >
                <span
                  className="flex items-center"
                  style={{
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
        @keyframes backupMenuFadeUp {
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
};

export default BackupActionsDropdown;
