/**
 * FunctionSelector Component
 * Searchable dropdown for selecting a Convex function or custom query
 */

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Code,
  ChevronDown,
  Search,
  X,
  CircleCheck,
  Terminal,
} from "lucide-react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

// Types
export interface ModuleFunction {
  name: string;
  identifier: string;
  udfType: "query" | "mutation" | "action" | "httpAction";
  visibility?: {
    kind: "public" | "internal";
  };
  args?: string; // JSON string of args validator
  returns?: string; // JSON string of return validator
  componentId?: string | null;
  componentPath?: string;
  file?: {
    path: string;
  };
}

export interface CustomQuery {
  type: "customQuery";
  table: string | null;
  componentId?: string | null;
}

export type SelectedFunction = ModuleFunction | CustomQuery | null;

export function isCustomQuery(value: SelectedFunction): value is CustomQuery {
  return value !== null && "type" in value && value.type === "customQuery";
}

interface FunctionSelectorProps {
  selectedFunction: SelectedFunction;
  onSelect: (fn: SelectedFunction) => void;
  functions: ModuleFunction[];
  componentId?: string | null;
  showCustomQuery?: boolean;
  placeholder?: string;
}

export function FunctionSelector({
  selectedFunction,
  onSelect,
  functions,
  componentId,
  showCustomQuery = true,
  placeholder = "Select function...",
}: FunctionSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter functions by component ID
  // componentId is the actual component ID (hash) or null for root app
  const filteredByComponent = useMemo(() => {
    return functions.filter((fn) => {
      // Both null means root app functions
      if (componentId === null) {
        return fn.componentId === null || fn.componentId === undefined;
      }
      // Match by actual component ID
      return fn.componentId === componentId;
    });
  }, [functions, componentId]);

  // Build options list
  const options = useMemo(() => {
    const result: Array<{
      key: string;
      label: string;
      sublabel?: string;
      value: SelectedFunction;
      isCustomQuery?: boolean;
    }> = [];

    // Add custom query option at the top
    if (showCustomQuery) {
      result.push({
        key: "custom-query",
        label: "Custom test query",
        value: { type: "customQuery", table: null, componentId },
        isCustomQuery: true,
      });
    }

    // Add function options
    for (const fn of filteredByComponent) {
      // Extract file path and function name from identifier
      let filePath = fn.file?.path || "";
      let functionName = fn.name || fn.identifier || "Unnamed function";

      // Parse identifier to extract file path and function name
      if (fn.identifier && fn.identifier.includes(":")) {
        const parts = fn.identifier.split(":");
        // If it's HTTP action, use full identifier as name
        if (
          fn.identifier.startsWith("GET ") ||
          fn.identifier.startsWith("POST ") ||
          fn.identifier.startsWith("PUT ") ||
          fn.identifier.startsWith("DELETE ") ||
          fn.identifier.startsWith("PATCH ") ||
          fn.identifier.startsWith("OPTIONS ")
        ) {
          functionName = fn.identifier;
          filePath = "";
        } else {
          // Regular function: extract file path and function name
          const filePart = parts.slice(0, -1).join(":");
          functionName = parts[parts.length - 1];
          if (filePart) {
            filePath = filePart;
            // Remove .js extension if present
            if (filePath.endsWith(".js")) {
              filePath = filePath.slice(0, -3);
            }
          }
        }
      }

      // Format file name for display
      const fileName = filePath ? filePath.split("/").pop() || filePath : "";

      // Ensure unique key
      const uniqueKey = fn.identifier
        ? fn.componentId
          ? `${fn.componentId}:${fn.identifier}`
          : fn.identifier
        : fn.name
          ? fn.componentId
            ? `${fn.componentId}:${fn.name}`
            : fn.name
          : `function-${Math.random()}`;

      result.push({
        key: uniqueKey,
        label: functionName,
        sublabel: fileName || undefined,
        value: fn,
      });
    }

    return result;
  }, [filteredByComponent, componentId, showCustomQuery]);

  // Filter options by search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;

    const query = searchQuery.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(query) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(query)),
    );
  }, [options, searchQuery]);

  // Get display label for selected function
  const getDisplayLabel = useCallback(
    (fn: SelectedFunction): string => {
      if (!fn) return placeholder;
      if (isCustomQuery(fn)) return "Custom test query";

      const parts = fn.identifier?.split(":") || [];
      return parts[parts.length - 1] || fn.name || fn.identifier || "Unknown";
    },
    [placeholder],
  );

  // Check if an option is selected
  const isSelected = useCallback(
    (optionValue: SelectedFunction): boolean => {
      if (optionValue === null) return selectedFunction === null;
      if (!selectedFunction) return false;

      if (isCustomQuery(optionValue)) {
        return isCustomQuery(selectedFunction);
      }

      if (isCustomQuery(selectedFunction)) return false;

      return (
        (selectedFunction as ModuleFunction).identifier ===
        (optionValue as ModuleFunction).identifier
      );
    },
    [selectedFunction],
  );

  // Reset highlight when filtered options change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredOptions.length, searchQuery]);

  // Scroll highlighted option into view
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
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const updatePosition = () => {
        if (buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect();
          setDropdownPosition({
            top: rect.bottom + window.scrollY + 4,
            left: rect.left + window.scrollX,
            width: Math.max(rect.width, 280),
          });
        }
      };

      updatePosition();

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

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      setSearchQuery("");
      setHighlightedIndex(0);
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
      handleSelect(filteredOptions[highlightedIndex].value);
    }
  };

  // Handle selection
  const handleSelect = (fn: SelectedFunction) => {
    onSelect(fn);
    setIsOpen(false);
    setSearchQuery("");
    setHighlightedIndex(0);
  };

  // Get UDF type badge color
  const getUdfTypeBadge = (fn: SelectedFunction) => {
    if (!fn || isCustomQuery(fn)) return null;
    const type = (fn as ModuleFunction).udfType;
    const colors: Record<string, string> = {
      query: "text-blue-500",
      mutation: "text-orange-500",
      action: "text-purple-500",
      httpAction: "text-green-500",
    };
    return (
      <span
        className={cn(
          "text-[10px] font-medium uppercase",
          colors[type] || "text-text-muted",
        )}
      >
        {type === "httpAction" ? "HTTP" : type?.charAt(0).toUpperCase()}
      </span>
    );
  };

  return (
    <div ref={containerRef} className="relative flex-1 min-w-0">
      {/* Trigger button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center gap-1.5",
          "px-2.5 py-1.5 h-[30px] rounded-lg",
          "text-sm font-medium",
          "border border-border-base",
          "bg-transparent hover:bg-surface-raised",
          "focus:outline-none focus:ring-0",
          "cursor-pointer transition-colors duration-fast",
          "text-text-base",
        )}
      >
        {isCustomQuery(selectedFunction) ? (
          <Terminal size={14} className="text-text-muted flex-shrink-0" />
        ) : (
          <Code size={14} className="text-text-muted flex-shrink-0" />
        )}
        <span className="truncate flex-1 text-left">
          {getDisplayLabel(selectedFunction)}
        </span>
        {getUdfTypeBadge(selectedFunction)}
        <ChevronDown
          className={cn(
            "h-3 w-3 text-text-subtle transition-transform flex-shrink-0",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {/* Dropdown (rendered in portal) */}
      {isOpen &&
        dropdownPosition &&
        createPortal(
          <div
            ref={dropdownRef}
            className={cn(
              "fixed z-[9999]",
              "min-w-[280px] max-w-[400px]",
              "bg-surface-base border border-border-muted rounded-xl shadow-lg",
              "overflow-hidden",
              "animate-fade-up",
            )}
            style={{
              animationDuration: "150ms",
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
            }}
          >
            {/* Search input */}
            <div className="border-b border-border-muted">
              <div className="relative">
                <Search
                  size={12}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none z-10"
                />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search functions..."
                  className="w-full h-8 pl-7 pr-7 text-xs bg-transparent border-0 rounded-none text-text-base outline-none focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-base"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            </div>

            {/* Options list */}
            <div
              ref={optionsRef}
              className="max-h-[300px] overflow-y-auto p-1 space-y-0.5"
            >
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-xs text-center text-text-muted">
                  No functions found
                </div>
              ) : (
                filteredOptions.map((option, index) => {
                  const selected = isSelected(option.value);
                  const isHighlighted = index === highlightedIndex;

                  return (
                    <button
                      key={option.key}
                      type="button"
                      data-index={index}
                      onClick={() => handleSelect(option.value)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={cn(
                        "w-full flex items-center justify-between gap-2 px-2 py-1.5 text-left rounded-lg",
                        "text-xs transition-colors text-text-base",
                        isHighlighted
                          ? "bg-surface-raised"
                          : "hover:bg-surface-raised",
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {option.isCustomQuery ? (
                          <Terminal
                            size={12}
                            className="text-text-muted flex-shrink-0"
                          />
                        ) : (
                          <Code
                            size={12}
                            className="text-text-muted flex-shrink-0"
                          />
                        )}
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          {option.sublabel && (
                            <span className="text-text-muted font-mono text-[11px] flex-shrink-0">
                              {option.sublabel}:
                            </span>
                          )}
                          <span className="truncate">{option.label}</span>
                        </div>
                        {!option.isCustomQuery && getUdfTypeBadge(option.value)}
                      </div>
                      {selected && (
                        <CircleCheck className="h-4 w-4 flex-shrink-0 stroke-brand-base" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

export default FunctionSelector;
