/**
 * FieldVisibilityDropdown Component
 * Dropdown for toggling column/field visibility in the data table
 */

import { useState, useEffect, useRef, useMemo } from "react";
import { Search, Eye, EyeOff, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ToolbarButton } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

export function FieldVisibilityDropdown({
  fields,
  visibleFields,
  onVisibleFieldsChange,
  isOpen,
  onToggle,
  onClose,
}: FieldVisibilityDropdownProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  const hiddenFieldsCount = fields.length - visibleFields.length;

  // Filter fields based on search and deduplicate
  const filteredFields = useMemo(() => {
    // Deduplicate fields first
    const uniqueFields = Array.from(new Set(fields));
    
    if (!searchQuery) return uniqueFields;
    const lower = searchQuery.toLowerCase();
    return uniqueFields.filter((field) => field.toLowerCase().includes(lower));
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

    // Use click instead of mousedown so button onClick fires first
    document.addEventListener("click", handleClickOutside, true);
    return () => document.removeEventListener("click", handleClickOutside, true);
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
    // Deduplicate fields before setting
    onVisibleFieldsChange(Array.from(new Set(fields)));
  };

  const hideAllFields = () => {
    // Keep _id and _creationTime visible at minimum
    onVisibleFieldsChange(["_id", "_creationTime"]);
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
    <div ref={containerRef} className="relative" data-field-visibility>
      {/* Trigger Button */}
      <ToolbarButton onClick={() => onToggle()} active={hiddenFieldsCount > 0}>
        <EyeOff size={14} />
        <span>
          {hiddenFieldsCount > 0 ? `${hiddenFieldsCount} hidden` : "Fields"}
        </span>
        <ChevronDown
          size={12}
          className={cn(
            "transition-transform duration-150",
            isOpen && "rotate-180",
          )}
        />
      </ToolbarButton>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={cn(
            "absolute top-full right-0 mt-1 z-50",
            "min-w-[200px] max-w-[350px]",
            "bg-surface-base border border-border-muted rounded-xl shadow-lg",
            "overflow-hidden",
            "animate-fade-up",
          )}
          style={{ animationDuration: "150ms" }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="border-b border-border-muted">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-subtle z-10 pointer-events-none" />
              <Input
                ref={inputRef}
                type="text"
                placeholder="Search fields..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className={cn(
                  "w-full pl-8 pr-3 py-1.5",
                  "border-0 rounded-none",
                  "hover:bg-transparent hover:border-0",
                  "focus:border-0 focus:border-transparent",
                )}
              />
            </div>
          </div>

          {/* Field List */}
          <div
            ref={optionsRef}
            className="max-h-[240px] overflow-y-auto p-1 space-y-0.5"
          >
            {filteredFields.length === 0 ? (
              <div className="px-3 py-2 text-sm text-text-muted text-center">
                No fields found
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
                      e.preventDefault();
                      e.stopPropagation();
                      toggleField(field);
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    className={cn(
                      "w-full flex items-center justify-between gap-2 px-2 py-1 text-left rounded-lg",
                      "text-sm transition-colors text-text-base",
                      isHighlighted
                        ? "bg-surface-raised"
                        : "hover:bg-surface-raised",
                    )}
                  >
                    <span className="truncate flex-1 min-w-0">
                      {field}
                    </span>

                    {/* Toggle Switch */}
                    <div
                      className={cn(
                        "w-5 h-3 rounded-full relative transition-colors flex-shrink-0 pointer-events-none",
                        isVisible ? "bg-brand-base" : "bg-border-muted",
                      )}
                    >
                      <div
                        className={cn(
                          "w-2.5 h-2.5 bg-surface-base rounded-full absolute top-[1px] transition-all shadow-sm",
                          isVisible ? "left-[9px]" : "left-[1px]",
                        )}
                      />
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Action Buttons */}
          <div className="p-1 border-t border-border-muted flex gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                hideAllFields();
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium rounded-lg transition-colors text-text-muted hover:bg-surface-raised hover:text-text-base"
            >
              <EyeOff size={12} />
              Hide All
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                showAllFields();
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium rounded-lg transition-colors text-text-muted hover:bg-surface-raised hover:text-text-base"
            >
              <Eye size={12} />
              Show All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default FieldVisibilityDropdown;
