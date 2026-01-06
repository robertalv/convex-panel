import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Search, CircleCheck } from "lucide-react";
import { Input } from "./input";
import { Team, Deployment } from "convex-panel";
import { TierBadge } from "../TierBadge";
import type { TeamSubscription } from "@/api/bigbrain";
import { EnvironmentBadge } from "../EnvironmentBadge";

interface SearchableSelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  value: string;
  options: SearchableSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  selectedTeam?: Team;
  subscription?: TeamSubscription | null;
  selectedDeployment?: Deployment;
  showEnvironmentBadge?: boolean;
  loading?: boolean;
  /** When true, renders sublabel as plain text instead of EnvironmentBadge */
  sublabelAsText?: boolean;
  /** Callback when search input changes - use for server-side search */
  onSearchChange?: (query: string) => void;
  /** Minimum characters before triggering onSearchChange (default: 0) */
  minSearchLength?: number;
}

export function SearchableSelect({
  selectedTeam,
  subscription,
  value,
  options,
  onChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  selectedDeployment,
  showEnvironmentBadge = false,
  className,
  loading = false,
  sublabelAsText = false,
  onSearchChange,
  minSearchLength = 0,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const optionsRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // If onSearchChange is provided, skip client-side filtering (server does it)
  const filteredOptions = React.useMemo(() => {
    // When using server-side search, don't filter client-side
    if (onSearchChange) return options;
    if (!search) return options;
    const lower = search.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(lower) ||
        opt.sublabel?.toLowerCase().includes(lower),
    );
  }, [options, search, onSearchChange]);

  // Call onSearchChange when search changes (debounced behavior should be handled by caller)
  React.useEffect(() => {
    if (onSearchChange && search.length >= minSearchLength) {
      onSearchChange(search);
    }
  }, [search, onSearchChange, minSearchLength]);

  React.useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredOptions.length, search]);

  React.useEffect(() => {
    if (isOpen && optionsRef.current) {
      const highlighted = optionsRef.current.querySelector(
        `[data-index="${highlightedIndex}"]`,
      );
      if (highlighted) {
        highlighted.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, isOpen]);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setSearch("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      setSearch("");
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
      onChange(filteredOptions[highlightedIndex].value);
      setIsOpen(false);
      setSearch("");
      setHighlightedIndex(0);
    }
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearch("");
    setHighlightedIndex(0);
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1",
          "pl-2 pr-1 py-0.5 rounded-lg",
          "text-sm font-medium",
          "border border-transparent",
          "hover:bg-surface-raised",
          "focus:outline-none focus:ring-0",
          "cursor-pointer transition-colors duration-fast",
          selectedOption ? "text-text-base" : "text-text-muted",
        )}
      >
        <span className="truncate max-w-[140px]">
          {selectedOption?.label || placeholder}
        </span>
        {selectedTeam ? (
          <TierBadge subscription={subscription ?? null} />
        ) : null}
        {selectedDeployment && showEnvironmentBadge && (
          <EnvironmentBadge
            deploymentType={selectedDeployment.deploymentType}
          />
        )}
        <ChevronDown
          className={cn(
            "h-3 w-3 text-text-subtle transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute top-full left-0 mt-1 z-50",
            "min-w-[200px] max-w-[350px]",
            "bg-surface-base border border-border-muted rounded-xl shadow-lg",
            "overflow-hidden",
            "animate-fade-up",
          )}
          style={{ animationDuration: "150ms" }}
        >
          <div className="border-b border-border-muted">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-subtle z-10 pointer-events-none" />
              <Input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                className={cn(
                  "w-full pl-8 pr-3 py-1.5",
                  "border-0 rounded-none",
                  "hover:bg-transparent hover:border-0",
                  "focus:border-0 focus:border-transparent",
                )}
              />
            </div>
          </div>

          <div
            ref={optionsRef}
            className="max-h-[240px] overflow-y-auto p-1 space-y-0.5"
          >
            {loading ? (
              <div className="px-3 py-2 text-sm text-text-muted text-center">
                Loading...
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-text-muted text-center">
                No results found
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <button
                  key={option.value !== "" ? option.value : `option-${index}`}
                  type="button"
                  data-index={index}
                  onClick={() => handleSelect(option.value)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={cn(
                    "w-full flex items-center justify-between gap-2 px-2 py-1 text-left rounded-lg",
                    "text-sm transition-colors text-text-base",
                    option.value === value
                      ? ""
                      : index === highlightedIndex
                        ? "bg-surface-raised"
                        : "hover:bg-surface-raised",
                  )}
                >
                  <div className="flex flex-row items-center gap-1.5 min-w-0 flex-1">
                    <div className="truncate flex-1 min-w-0">
                      {option.label}
                    </div>
                    {option.sublabel &&
                      (sublabelAsText ? (
                        <span className="text-xs text-text-muted truncate">
                          {option.sublabel}
                        </span>
                      ) : (
                        <EnvironmentBadge
                          deploymentType={option.sublabel as "prod" | "dev"}
                        />
                      ))}
                  </div>
                  {option.value === value && (
                    <CircleCheck className="h-4 w-4 flex-shrink-0 stroke-brand-base" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchableSelect;
