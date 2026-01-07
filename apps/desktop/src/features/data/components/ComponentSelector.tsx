/**
 * ComponentSelector Component
 * Searchable dropdown for selecting a Convex component
 */

import { useState, useRef, useEffect, useMemo } from "react";
import { Code, ChevronDown, Search, X, CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConvexComponent } from "../types";

interface ComponentSelectorProps {
  /** Currently selected component ID (null = root app) */
  selectedComponentId: string | null;
  /** Called when a component is selected */
  onSelect: (componentId: string | null) => void;
  /** List of available components */
  components: ConvexComponent[];
  /** Stretch the trigger button to full width */
  fullWidth?: boolean;
  /** Visual style variant */
  variant?: "inline" | "input";
}

export function ComponentSelector({
  selectedComponentId,
  onSelect,
  components,
  fullWidth = false,
  variant = "inline",
}: ComponentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  // Filter components by search query
  const filteredComponents = useMemo(() => {
    if (!searchQuery.trim()) return components;

    const query = searchQuery.toLowerCase();
    return components.filter(
      (c) =>
        c.path.toLowerCase().includes(query) ||
        (c.name && c.name.toLowerCase().includes(query)),
    );
  }, [components, searchQuery]);

  // Get display label for a component
  const getDisplayLabel = (component: ConvexComponent) => {
    if (component.id === null) {
      return "Root (app)";
    }
    return component.path || component.name || component.id;
  };

  // Get selected component display
  const selectedComponent = useMemo(() => {
    return (
      components.find((c) => c.id === selectedComponentId) ||
      components.find((c) => c.id === null)
    );
  }, [components, selectedComponentId]);

  const selectedLabel = selectedComponent
    ? getDisplayLabel(selectedComponent)
    : "Root (app)";

  // Reset highlight when filtered options change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredComponents.length, searchQuery]);

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
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
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

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      setSearchQuery("");
      setHighlightedIndex(0);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredComponents.length - 1 ? prev + 1 : prev,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter" && filteredComponents.length > 0) {
      e.preventDefault();
      handleSelect(filteredComponents[highlightedIndex]);
    }
  };

  // Handle selection - pass the component ID (null for root app)
  const handleSelect = (component: ConvexComponent) => {
    onSelect(component.id);
    setIsOpen(false);
    setSearchQuery("");
    setHighlightedIndex(0);
  };

  const isInputVariant = variant === "input";

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative",
        fullWidth && "w-full",
        isInputVariant && "flex-1 min-w-0",
      )}
    >
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1",
          fullWidth && "w-full justify-between",
          isInputVariant
            ? "px-2.5 py-1.5 h-[30px] rounded-lg text-sm font-medium border border-border-base bg-transparent hover:bg-surface-raised"
            : "pl-2 pr-1 py-0.5 rounded-lg text-sm font-medium border border-transparent hover:bg-surface-raised",
          "focus:outline-none focus:ring-0",
          "cursor-pointer transition-colors duration-fast",
          "text-text-base",
        )}
      >
        <Code size={14} className="text-text-muted" />
        <span className="truncate flex-1 min-w-0 text-left">{selectedLabel}</span>
        <ChevronDown
          className={cn(
            "h-3 w-3 text-text-subtle transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={cn(
            "absolute top-full left-0 right-0 mt-1 z-50",
            "bg-surface-base border border-border-muted rounded-xl shadow-lg",
            "overflow-hidden",
            "animate-fade-up",
          )}
          style={{ animationDuration: "150ms" }}
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
                placeholder="Search components..."
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
            className="max-h-[200px] overflow-y-auto p-1 space-y-0.5"
          >
            {filteredComponents.length === 0 ? (
              <div className="px-3 py-2 text-xs text-center text-text-muted">
                No components found
              </div>
            ) : (
              filteredComponents.map((component, index) => {
                const isSelected = component.id === selectedComponentId;
                const isHighlighted = index === highlightedIndex;

                return (
                  <button
                    key={component.id ?? "root"}
                    type="button"
                    data-index={index}
                    onClick={() => handleSelect(component)}
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
                      <Code
                        size={12}
                        className="text-text-muted shrink-0"
                      />
                      <span className="truncate">
                        {getDisplayLabel(component)}
                      </span>
                    </div>
                    {isSelected && (
                      <CircleCheck className="h-4 w-4 shrink-0 stroke-brand-base" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ComponentSelector;
