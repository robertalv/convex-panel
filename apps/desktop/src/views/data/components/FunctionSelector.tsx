/**
 * FunctionSelector Component
 * Searchable dropdown for selecting Convex functions or custom query
 * Supports both single and multi-select modes
 */

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Code,
  ChevronDown,
  Search,
  X,
  CircleCheck,
  Terminal,
  CheckSquare,
  Square,
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

interface FunctionSelectorBaseProps {
  functions: ModuleFunction[];
  componentId?: string | null;
  showCustomQuery?: boolean;
  placeholder?: string;
}

interface FunctionSelectorSingleProps extends FunctionSelectorBaseProps {
  multiSelect?: false;
  selectedFunction: SelectedFunction;
  onSelect: (fn: SelectedFunction) => void;
}

interface FunctionSelectorMultiProps extends FunctionSelectorBaseProps {
  multiSelect: true;
  selectedFunction: SelectedFunction[];
  onSelect: (fns: SelectedFunction[]) => void;
}

type FunctionSelectorProps =
  | FunctionSelectorSingleProps
  | FunctionSelectorMultiProps;

export function FunctionSelector(props: FunctionSelectorProps) {
  const {
    functions,
    componentId,
    showCustomQuery = true,
    placeholder = "Select function...",
  } = props;

  const multiSelect = props.multiSelect || false;

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
  const filteredByComponent = useMemo(() => {
    // If componentId is undefined, show all functions (multi-component scenario)
    if (componentId === undefined) {
      return functions;
    }

    return functions.filter((fn) => {
      if (componentId === null) {
        return fn.componentId === null || fn.componentId === undefined;
      }
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
    for (let i = 0; i < filteredByComponent.length; i++) {
      const fn = filteredByComponent[i];
      let filePath = fn.file?.path || "";
      let functionName = fn.name || fn.identifier || "Unnamed function";

      // Parse identifier
      if (fn.identifier && fn.identifier.includes(":")) {
        const parts = fn.identifier.split(":");
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
          const filePart = parts.slice(0, -1).join(":");
          functionName = parts[parts.length - 1];
          if (filePart) {
            filePath = filePart;
            if (filePath.endsWith(".js")) {
              filePath = filePath.slice(0, -3);
            }
          }
        }
      }

      const fileName = filePath ? filePath.split("/").pop() || filePath : "";

      // Generate unique key - include index to ensure uniqueness even if identifiers collide
      const baseKey = fn.identifier
        ? fn.componentId
          ? `${fn.componentId}:${fn.identifier}`
          : fn.identifier
        : fn.name
          ? fn.componentId
            ? `${fn.componentId}:${fn.name}`
            : fn.name
          : `function-${i}`;

      const uniqueKey = `${baseKey}__${i}`;

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

  // Get selected functions array (for both single and multi)
  const selectedFunctions = useMemo(() => {
    if (multiSelect) {
      return props.selectedFunction as SelectedFunction[];
    }
    return props.selectedFunction ? [props.selectedFunction] : [];
  }, [props.selectedFunction, multiSelect]);

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
      return selectedFunctions.some((sf) => {
        if (optionValue === null) return sf === null;
        if (!sf) return false;

        if (isCustomQuery(optionValue)) {
          return isCustomQuery(sf);
        }

        if (isCustomQuery(sf)) return false;

        return (
          (sf as ModuleFunction).identifier ===
          (optionValue as ModuleFunction).identifier
        );
      });
    },
    [selectedFunctions],
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
    if (multiSelect) {
      const currentFunctions = props.selectedFunction as SelectedFunction[];
      const isAlreadySelected = isSelected(fn);

      const newFunctions = isAlreadySelected
        ? currentFunctions.filter((sf) => {
            if (fn === null) return sf !== null;
            if (!sf) return true;
            if (isCustomQuery(fn)) return !isCustomQuery(sf);
            if (isCustomQuery(sf)) return true;
            return (
              (sf as ModuleFunction).identifier !==
              (fn as ModuleFunction).identifier
            );
          })
        : [...currentFunctions, fn];

      (props.onSelect as (fns: SelectedFunction[]) => void)(newFunctions);
      // Don't close dropdown in multi-select mode
    } else {
      (props.onSelect as (fn: SelectedFunction) => void)(fn);
      setIsOpen(false);
      setSearchQuery("");
      setHighlightedIndex(0);
    }
  };

  // Handle removing a selected function badge
  const handleRemove = (fn: SelectedFunction, e: React.MouseEvent) => {
    e.stopPropagation();
    if (multiSelect) {
      const currentFunctions = props.selectedFunction as SelectedFunction[];
      const newFunctions = currentFunctions.filter((sf) => {
        if (fn === null) return sf !== null;
        if (!sf) return true;
        if (isCustomQuery(fn)) return !isCustomQuery(sf);
        if (isCustomQuery(sf)) return true;
        return (
          (sf as ModuleFunction).identifier !==
          (fn as ModuleFunction).identifier
        );
      });
      (props.onSelect as (fns: SelectedFunction[]) => void)(newFunctions);
    }
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
          "px-2.5 py-1.5 min-h-[30px] rounded-lg",
          "text-sm font-medium",
          "border border-border-base",
          "bg-transparent hover:bg-surface-raised",
          "focus:outline-none focus:ring-0",
          "cursor-pointer transition-colors duration-fast",
          "text-text-base",
        )}
      >
        {multiSelect && selectedFunctions.length > 0 ? (
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {selectedFunctions.length === 1 ? (
              // Show single badge with icon
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-raised text-text-base text-xs">
                {isCustomQuery(selectedFunctions[0]) ? (
                  <Terminal size={10} className="flex-shrink-0" />
                ) : (
                  <Code size={10} className="flex-shrink-0" />
                )}
                <span className="truncate max-w-[140px]">
                  {getDisplayLabel(selectedFunctions[0])}
                </span>
                <button
                  type="button"
                  onClick={(e) => handleRemove(selectedFunctions[0], e)}
                  className="hover:text-error-base"
                >
                  <X size={10} />
                </button>
              </span>
            ) : (
              // Show count with icon when multiple selected
              <>
                <Code size={14} className="text-text-muted flex-shrink-0" />
                <span className="text-text-base text-sm">
                  {selectedFunctions.length} functions
                </span>
              </>
            )}
          </div>
        ) : (
          <>
            {selectedFunctions.length > 0 &&
            isCustomQuery(selectedFunctions[0]) ? (
              <Terminal size={14} className="text-text-muted flex-shrink-0" />
            ) : (
              <Code size={14} className="text-text-muted flex-shrink-0" />
            )}
            <span className="truncate flex-1 text-left">
              {selectedFunctions.length > 0
                ? getDisplayLabel(selectedFunctions[0])
                : placeholder}
            </span>
            {selectedFunctions.length > 0 &&
              getUdfTypeBadge(selectedFunctions[0])}
          </>
        )}
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
                        {multiSelect && (
                          <span className="shrink-0">
                            {selected ? (
                              <CheckSquare className="h-3.5 w-3.5 stroke-brand-base" />
                            ) : (
                              <Square className="h-3.5 w-3.5 stroke-text-muted" />
                            )}
                          </span>
                        )}
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
                      {!multiSelect && selected && (
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
