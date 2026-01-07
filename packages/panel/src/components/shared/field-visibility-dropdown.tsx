import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, Eye, EyeOff, ChevronDown } from "lucide-react";

export interface FieldVisibilityDropdownProps {
  /** All available fields */
  fields: string[];
  /** Currently visible fields */
  visibleFields: string[];
  /** Callback when field visibility changes */
  onVisibleFieldsChange: (fields: string[]) => void;
  /** Whether the dropdown is open */
  isOpen: boolean;
  /** Callback to toggle dropdown open state */
  onToggle: () => void;
  /** Callback to close the dropdown */
  onClose: () => void;
}

export const FieldVisibilityDropdown: React.FC<
  FieldVisibilityDropdownProps
> = ({
  fields,
  visibleFields,
  onVisibleFieldsChange,
  isOpen,
  onToggle,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  const hiddenFieldsCount = fields.length - visibleFields.length;

  // Filter fields based on search
  const filteredFields = useMemo(() => {
    if (!searchQuery) return fields;
    const lower = searchQuery.toLowerCase();
    return fields.filter((field) => field.toLowerCase().includes(lower));
  }, [fields, searchQuery]);

  // Reset highlighted index when search changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredFields.length, searchQuery]);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    if (!isOpen) {
      setSearchQuery("");
      setHighlightedIndex(0);
    }
  }, [isOpen]);

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

  // Handle click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // Toggle field visibility
  const toggleField = (field: string) => {
    const newVisibleFields = visibleFields.includes(field)
      ? visibleFields.filter((f) => f !== field)
      : [...visibleFields, field];
    onVisibleFieldsChange(newVisibleFields);
  };

  // Show/hide all
  const showAllFields = () => {
    onVisibleFieldsChange([...fields]);
  };

  const hideAllFields = () => {
    onVisibleFieldsChange([]);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredFields.length - 1 ? prev + 1 : prev,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter" && filteredFields.length > 0) {
      e.preventDefault();
      toggleField(filteredFields[highlightedIndex]);
    }
  };

  return (
    <div
      ref={containerRef}
      style={{ position: "relative" }}
      data-field-visibility
    >
      {/* Trigger Button - matches SearchableSelect trigger style */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          padding: "2px 4px 2px 8px",
          color:
            hiddenFieldsCount > 0
              ? "var(--color-panel-text)"
              : "var(--color-panel-text-muted)",
          backgroundColor: "transparent",
          border: "1px solid transparent",
          borderRadius: "8px",
          fontSize: "13px",
          fontWeight: 500,
          cursor: "pointer",
          transition: "background-color 0.15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor =
            "var(--color-panel-bg-tertiary)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "140px",
          }}
        >
          {hiddenFieldsCount > 0 ? `${hiddenFieldsCount} hidden` : "Fields"}
        </span>
        <ChevronDown
          size={12}
          style={{
            color: "var(--color-panel-text-muted)",
            transition: "transform 0.15s ease",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {/* Dropdown - matches SearchableSelect dropdown style */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: "4px",
            minWidth: "200px",
            maxWidth: "280px",
            width: "260px",
            backgroundColor: "var(--color-panel-bg)",
            border: "1px solid var(--color-panel-border)",
            borderRadius: "12px",
            boxShadow: "0 4px 16px var(--color-panel-shadow)",
            zIndex: 50,
            overflow: "hidden",
            animation: "fieldDropdownFadeUp 0.15s ease",
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Search Input - matches SearchableSelect search style */}
          <div style={{ borderBottom: "1px solid var(--color-panel-border)" }}>
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
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
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

          {/* Field List - matches SearchableSelect options style */}
          <div
            ref={optionsRef}
            style={{
              maxHeight: "240px",
              overflowY: "auto",
              padding: "4px",
            }}
          >
            {filteredFields.length === 0 ? (
              <div
                style={{
                  padding: "8px 12px",
                  textAlign: "center",
                  color: "var(--color-panel-text-muted)",
                  fontSize: "13px",
                }}
              >
                No results found
              </div>
            ) : (
              filteredFields.map((field, index) => {
                const isVisible = visibleFields.includes(field);
                const isHighlighted = index === highlightedIndex;

                return (
                  <button
                    key={field}
                    type="button"
                    data-index={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleField(field);
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "8px",
                      padding: "6px 8px",
                      border: "none",
                      borderRadius: "8px",
                      backgroundColor: isHighlighted
                        ? "var(--color-panel-bg-tertiary)"
                        : "transparent",
                      cursor: "pointer",
                      transition: "background-color 0.1s ease",
                      textAlign: "left",
                      marginBottom: "2px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "13px",
                        fontFamily: "monospace",
                        color: "var(--color-panel-text)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {field}
                    </span>

                    {/* Toggle Switch */}
                    <div
                      style={{
                        width: "20px",
                        height: "12px",
                        backgroundColor: isVisible
                          ? "var(--color-panel-accent)"
                          : "var(--color-panel-border)",
                        borderRadius: "6px",
                        position: "relative",
                        transition: "background-color 0.15s ease",
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          width: "10px",
                          height: "10px",
                          backgroundColor: "var(--color-panel-bg)",
                          borderRadius: "50%",
                          position: "absolute",
                          top: "1px",
                          left: isVisible ? "9px" : "2px",
                          transition: "left 0.15s ease",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
                        }}
                      />
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Action Buttons */}
          <div
            style={{
              padding: "4px",
              borderTop: "1px solid var(--color-panel-border)",
              display: "flex",
              gap: "4px",
            }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                hideAllFields();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "6px 10px",
                backgroundColor: "transparent",
                border: "none",
                borderRadius: "8px",
                color: "var(--color-panel-text-secondary)",
                fontSize: "12px",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "var(--color-panel-bg-tertiary)";
                e.currentTarget.style.color = "var(--color-panel-text)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color =
                  "var(--color-panel-text-secondary)";
              }}
            >
              <EyeOff size={14} />
              Hide All
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                showAllFields();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "6px 10px",
                backgroundColor: "transparent",
                border: "none",
                borderRadius: "8px",
                color: "var(--color-panel-text-secondary)",
                fontSize: "12px",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "var(--color-panel-bg-tertiary)";
                e.currentTarget.style.color = "var(--color-panel-text)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color =
                  "var(--color-panel-text-secondary)";
              }}
            >
              <Eye size={14} />
              Show All
            </button>
          </div>
        </div>
      )}

      {/* Keyframe animation styles */}
      <style>{`
        @keyframes fieldDropdownFadeUp {
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

export default FieldVisibilityDropdown;
