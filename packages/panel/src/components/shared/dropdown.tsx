import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, CircleCheck } from "lucide-react";
import { useThemeSafe } from "../../hooks/useTheme";
import { usePortalTarget } from "../../contexts/portal-context";

export interface DropdownOption<T> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

export interface DropdownProps<T> {
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  disabled?: boolean;
  triggerClassName?: string;
  triggerStyle?: React.CSSProperties;
  dropdownClassName?: string;
  dropdownStyle?: React.CSSProperties;
  optionClassName?: string;
  optionStyle?: React.CSSProperties;
  minWidth?: number;
  maxHeight?: number;
  align?: "left" | "right";
}

export function Dropdown<T = string | number>({
  value,
  options,
  onChange,
  placeholder = "Select...",
  disabled = false,
  triggerClassName,
  triggerStyle,
  dropdownClassName,
  dropdownStyle,
  optionClassName,
  optionStyle,
  minWidth,
  maxHeight = 300,
  align = "left",
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const { theme } = useThemeSafe();
  const portalTarget = usePortalTarget();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      // Use a small delay to avoid immediate closing when opening
      const timeoutId = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 10);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  // Reset highlighted index when dropdown opens/closes
  useEffect(() => {
    if (isOpen) {
      // Find current selected index
      const selectedIndex = options.findIndex((opt) => opt.value === value);
      setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    } else {
      setHighlightedIndex(-1);
    }
  }, [isOpen, options, value]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && optionsRef.current && highlightedIndex >= 0) {
      const highlighted = optionsRef.current.querySelector(
        `[data-index="${highlightedIndex}"]`,
      );
      if (highlighted) {
        highlighted.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < options.length - 1 ? prev + 1 : prev,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      onChange(options[highlightedIndex].value);
      setIsOpen(false);
      triggerRef.current?.focus();
    }
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (optionValue: T) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  // Calculate dropdown position
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const updatePosition = () => {
        if (triggerRef.current) {
          const rect = triggerRef.current.getBoundingClientRect();

          setDropdownPosition({
            top: rect.bottom + 4,
            left: align === "right" ? rect.right : rect.left,
            width: Math.max(minWidth || 0, rect.width),
          });
        }
      };

      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        updatePosition();
      });

      // Update position on scroll/resize
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);

      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    } else {
      setDropdownPosition(null);
    }
  }, [isOpen, minWidth, align]);

  return (
    <div style={{ position: "relative", height: "inherit" }}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={handleTriggerClick}
        onKeyDown={handleKeyDown}
        onMouseDown={(e) => e.stopPropagation()}
        className={triggerClassName}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "4px",
          width: "100%",
          height: "100%",
          minHeight: "100%",
          padding: "0 8px 0 10px",
          backgroundColor: "transparent",
          border: "1px solid var(--color-panel-border)",
          borderRadius: "8px",
          fontSize: "13px",
          fontWeight: 500,
          color: selectedOption
            ? "var(--color-panel-text)"
            : "var(--color-panel-text-muted)",
          cursor: disabled ? "not-allowed" : "pointer",
          outline: "none",
          transition: "background-color 0.15s ease",
          opacity: disabled ? 0.5 : 1,
          boxSizing: "border-box",
          ...triggerStyle,
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.backgroundColor =
              "var(--color-panel-bg-secondary)";
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            e.currentTarget.style.backgroundColor = "transparent";
          }
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            overflow: "hidden",
            flex: 1,
          }}
        >
          {selectedOption?.icon && (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                flexShrink: 0,
                color: "var(--color-panel-text-muted)",
              }}
            >
              {selectedOption.icon}
            </span>
          )}
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          size={12}
          style={{
            color: "var(--color-panel-text-muted)",
            flexShrink: 0,
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.15s ease",
          }}
        />
      </button>

      {isOpen &&
        dropdownPosition &&
        portalTarget &&
        createPortal(
          <div
            ref={dropdownRef}
            className={`${dropdownClassName || ""} cp-theme-${theme}`.trim()}
            style={{
              position: "fixed",
              top: `${dropdownPosition.top}px`,
              left: align === "right" ? "auto" : `${dropdownPosition.left}px`,
              right:
                align === "right"
                  ? `${window.innerWidth - dropdownPosition.left - dropdownPosition.width}px`
                  : "auto",
              minWidth: `${dropdownPosition.width}px`,
              backgroundColor: "var(--color-panel-bg)",
              border: "1px solid var(--color-panel-border)",
              borderRadius: "12px",
              boxShadow: "0 4px 16px var(--color-panel-shadow)",
              zIndex: 100000,
              overflow: "hidden",
              pointerEvents: "auto",
              animation: "dropdownFadeUp 0.15s ease",
              ...dropdownStyle,
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          >
            {/* Options List */}
            <div
              ref={optionsRef}
              style={{
                maxHeight: `${maxHeight}px`,
                overflowY: "auto",
                overflowX: "hidden",
                WebkitOverflowScrolling: "touch",
                padding: "4px",
              }}
            >
              {options.map((option, index) => {
                const isSelected = option.value === value;
                const isHighlighted = index === highlightedIndex;
                return (
                  <button
                    key={String(option.value)}
                    type="button"
                    data-index={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(option.value);
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={optionClassName}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "8px",
                      padding: "6px 8px",
                      border: "none",
                      borderRadius: "10px",
                      backgroundColor: isHighlighted
                        ? "var(--color-panel-bg-tertiary)"
                        : "transparent",
                      cursor: "pointer",
                      transition: "background-color 0.1s ease",
                      textAlign: "left",
                      marginBottom: index < options.length - 1 ? "2px" : 0,
                      ...optionStyle,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        overflow: "hidden",
                        flex: 1,
                      }}
                    >
                      {option.icon && (
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            flexShrink: 0,
                          }}
                        >
                          {option.icon}
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: "13px",
                          color: "var(--color-panel-text)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {option.label}
                      </span>
                    </div>
                    {isSelected && (
                      <CircleCheck
                        size={16}
                        style={{
                          color: "var(--color-panel-accent)",
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Keyframe animation styles */}
            <style>{`
            @keyframes dropdownFadeUp {
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
        )}
    </div>
  );
}
