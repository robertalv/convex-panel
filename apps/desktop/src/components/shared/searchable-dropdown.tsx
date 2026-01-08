import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search, CircleCheck } from "lucide-react";
import { usePortalTarget } from "../../contexts/portal-context";
import { useThemeSafe } from "../../hooks/useTheme";

export interface SearchableDropdownOption<T> {
  key: string;
  label: string | React.ReactNode;
  value: T;
  icon?: React.ReactNode;
  searchValue?: string;
}

interface SearchableDropdownProps<T> {
  selectedValue: T | null;
  options: SearchableDropdownOption<T>[];
  onSelect: (value: T) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyStateText?: string;
  triggerIcon?: React.ReactNode;
  listMaxHeight?: number;
  getIsSelected?: (
    selectedValue: T | null,
    option: SearchableDropdownOption<T>,
  ) => boolean;
  triggerStyle?: React.CSSProperties;
}

const defaultPlaceholder = "Select...";
const defaultSearchPlaceholder = "Search...";

export function SearchableDropdown<T>({
  selectedValue,
  options,
  onSelect,
  placeholder = defaultPlaceholder,
  searchPlaceholder = defaultSearchPlaceholder,
  emptyStateText = "No results found",
  triggerIcon,
  listMaxHeight = 300,
  getIsSelected,
  triggerStyle,
}: SearchableDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const portalTarget = usePortalTarget();
  const { theme } = useThemeSafe();
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

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

  // Calculate dropdown position for portal
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const updatePosition = () => {
        if (triggerRef.current) {
          const rect = triggerRef.current.getBoundingClientRect();
          setDropdownPosition({
            top: rect.bottom + 4,
            left: rect.left,
            width: Math.max(rect.width, 200),
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
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setHighlightedIndex(0);
    }
  }, [isOpen]);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, dropdownPosition]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery) {
      return options;
    }

    const normalizedQuery = searchQuery.toLowerCase();
    return options.filter((option) => {
      // Use searchValue if provided, otherwise use label as string
      const searchableText =
        option.searchValue ||
        (typeof option.label === "string" ? option.label : "");
      return searchableText.toLowerCase().includes(normalizedQuery);
    });
  }, [options, searchQuery]);

  // Reset highlighted index when search changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredOptions.length, searchQuery]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && optionsRef.current) {
      const highlighted = optionsRef.current.querySelector(
        `[data-index="${highlightedIndex}"]`,
      );
      if (highlighted) {
        highlighted.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, isOpen]);

  const selectedOption = useMemo(() => {
    if (!selectedValue) {
      return null;
    }

    return (
      options.find((option) =>
        getIsSelected
          ? getIsSelected(selectedValue, option)
          : selectedValue === option.value,
      ) || null
    );
  }, [getIsSelected, options, selectedValue]);

  const displayLabel = selectedOption?.label || placeholder;

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : prev,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter" && filteredOptions.length > 0) {
      e.preventDefault();
      onSelect(filteredOptions[highlightedIndex].value);
      setIsOpen(false);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Trigger Button - matches SearchableSelect style */}
      <div
        ref={triggerRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "4px",
          width: "-webkit-fill-available",
          height: "30px",
          padding: "0 8px 0 10px",
          backgroundColor: "transparent",
          border: "1px solid var(--color-panel-border)",
          borderRadius: "8px",
          cursor: "pointer",
          transition: "background-color 0.15s ease",
          color: selectedOption
            ? "var(--color-panel-text)"
            : "var(--color-panel-text-muted)",
          fontSize: "13px",
          fontWeight: 500,
          ...triggerStyle,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor =
            "var(--color-panel-bg-secondary)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
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
          {triggerIcon ? (
            <span
              style={{
                color: "var(--color-panel-text-muted)",
                display: "flex",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              {triggerIcon}
            </span>
          ) : null}
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {typeof displayLabel === "string" ? displayLabel : displayLabel}
          </span>
        </div>
        <ChevronDown
          size={12}
          style={{
            color: "var(--color-panel-text-muted)",
            flexShrink: 0,
            transition: "transform 0.15s ease",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </div>

      {/* Dropdown - matches SearchableSelect style */}
      {isOpen &&
        dropdownPosition &&
        portalTarget &&
        createPortal(
          <div
            ref={dropdownRef}
            className={`cp-theme-${theme}`}
            style={{
              position: "fixed",
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              minWidth: "200px",
              maxWidth: "280px",
              width: `${dropdownPosition.width}px`,
              backgroundColor: "var(--color-panel-bg)",
              border: "1px solid var(--color-panel-border)",
              borderRadius: "12px",
              boxShadow: "0 4px 16px var(--color-panel-shadow)",
              zIndex: 100000,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              pointerEvents: "auto",
              animation: "searchableDropdownFadeUp 0.15s ease",
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Search Input - borderless style like SearchableSelect */}
            <div
              style={{ borderBottom: "1px solid var(--color-panel-border)" }}
            >
              <div style={{ position: "relative" }}>
                <Search
                  size={14}
                  style={{
                    position: "absolute",
                    left: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--color-panel-text-muted)",
                    pointerEvents: "none",
                    zIndex: 10,
                  }}
                />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    backgroundColor: "transparent",
                    border: "none",
                    borderRadius: 0,
                    height: "36px",
                    paddingLeft: "32px",
                    paddingRight: "12px",
                    fontSize: "13px",
                    color: "var(--color-panel-text)",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            {/* Options List - matches SearchableSelect style */}
            <div
              ref={optionsRef}
              style={{
                maxHeight: `${listMaxHeight - 50}px`,
                overflowY: "auto",
                overflowX: "hidden",
                WebkitOverflowScrolling: "touch",
                minHeight: 0,
                padding: "4px",
              }}
            >
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => {
                  const isSelected = selectedOption
                    ? option.key === selectedOption.key
                    : false;
                  const isHighlighted = index === highlightedIndex;

                  return (
                    <button
                      key={option.key}
                      type="button"
                      data-index={index}
                      onClick={() => {
                        onSelect(option.value);
                        setIsOpen(false);
                      }}
                      onMouseEnter={() => setHighlightedIndex(index)}
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
                        marginBottom: "2px",
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
                        {option.icon ? (
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              flexShrink: 0,
                            }}
                          >
                            {option.icon}
                          </span>
                        ) : null}
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
                })
              ) : (
                <div
                  style={{
                    padding: "8px 12px",
                    fontSize: "13px",
                    color: "var(--color-panel-text-muted)",
                    textAlign: "center",
                  }}
                >
                  {emptyStateText}
                </div>
              )}
            </div>

            {/* Keyframe animation styles */}
            <style>{`
            @keyframes searchableDropdownFadeUp {
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
