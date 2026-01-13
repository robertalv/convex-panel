import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Input } from "./input";
import { Team, Deployment } from "@/types/desktop";
import { TierBadge } from "../tier-badge";
import type { TeamSubscription } from "@/api/bigbrain";
import { EnvironmentBadge } from "../env-badge";
import Icon from "../ui/icon";

interface SearchableSelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface SearchableSelectPropsBase {
  options: SearchableSelectOption[];
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
  /** Icon to display in the trigger button (when provided, uses component-selector style) */
  triggerIcon?: React.ReactNode;
  /** Whether the select is disabled */
  disabled?: boolean;
  /** Custom className for the button element */
  buttonClassName?: string;
  /** Custom style for the button element */
  buttonStyle?: React.CSSProperties;
  /** Visual style variant for the trigger button */
  variant?: "ghost" | "outline" | "primary" | "secondary";
}

interface SearchableSelectSingleProps extends SearchableSelectPropsBase {
  multiSelect?: false;
  value: string;
  onChange: (value: string) => void;
}

interface SearchableSelectMultiProps extends SearchableSelectPropsBase {
  multiSelect: true;
  value: string[];
  onChange: (values: string[]) => void;
}

type SearchableSelectProps =
  | SearchableSelectSingleProps
  | SearchableSelectMultiProps;

export function SearchableSelect(props: SearchableSelectProps) {
  const {
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
    triggerIcon,
    disabled = false,
    buttonClassName,
    buttonStyle,
    variant = "ghost",
  } = props;

  const multiSelect = props.multiSelect || false;

  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);
  const [dropdownPosition, setDropdownPosition] = React.useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const optionsRef = React.useRef<HTMLDivElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Helper to check if a value is selected
  const isSelected = (optionValue: string) => {
    if (multiSelect) {
      return (value as string[]).includes(optionValue);
    }
    return value === optionValue;
  };

  // Get selected options for display
  const selectedOptions = React.useMemo(() => {
    if (multiSelect) {
      return options.filter((opt) => (value as string[]).includes(opt.value));
    }
    return options.filter((opt) => opt.value === value);
  }, [options, value, multiSelect]);

  const selectedOption = !multiSelect ? selectedOptions[0] : null;

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
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
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

  // Calculate dropdown position when opening
  React.useEffect(() => {
    if (isOpen && buttonRef.current) {
      const updatePosition = () => {
        if (buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect();
          setDropdownPosition({
            top: rect.bottom + window.scrollY + 4, // 4px gap (mt-1)
            left: rect.left + window.scrollX,
            width: rect.width,
          });
        }
      };

      updatePosition();

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
      handleSelect(filteredOptions[highlightedIndex].value);
    }
  };

  const handleSelect = (optionValue: string) => {
    if (multiSelect) {
      const currentValues = value as string[];
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter((v) => v !== optionValue)
        : [...currentValues, optionValue];
      (onChange as (values: string[]) => void)(newValues);
      // Don't close dropdown in multi-select mode
    } else {
      (onChange as (value: string) => void)(optionValue);
      setIsOpen(false);
      setSearch("");
      setHighlightedIndex(0);
    }
  };

  const handleRemove = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (multiSelect) {
      const currentValues = value as string[];
      const newValues = currentValues.filter((v) => v !== optionValue);
      (onChange as (values: string[]) => void)(newValues);
    }
  };

  const variantClasses = React.useMemo(() => {
    switch (variant) {
      case "outline":
        return cn(
          "border border-border-base",
          disabled ? "" : "hover:bg-surface-raised",
          "text-text-base",
        );
      case "secondary":
        return cn(
          "border border-border-base",
          "bg-surface-raised text-text-base",
          disabled ? "" : "hover:bg-surface-overlay",
        );
      case "primary":
        return cn(
          "border border-transparent",
          "bg-brand-base text-white",
          disabled ? "" : "hover:bg-brand-hover",
        );
      case "ghost":
      default:
        return cn(
          "border border-transparent",
          disabled ? "" : "hover:bg-surface-raised",
          selectedOptions.length > 0 ? "text-text-base" : "text-text-muted",
        );
    }
  }, [variant, disabled, selectedOptions.length]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        style={buttonStyle}
        className={cn(
          "flex items-center justify-between gap-1.5 min-w-fit",
          "px-2.5 py-1.5 h-[30px] rounded-lg",
          "text-sm font-medium",
          "bg-transparent",
          "focus:outline-none focus:ring-0",
          "transition-colors duration-fast",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
          variantClasses,
          buttonClassName,
        )}
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {triggerIcon && (
            <span className="text-text-muted shrink-0 flex items-center">
              {triggerIcon}
            </span>
          )}
          {multiSelect && selectedOptions.length > 0 ? (
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              {selectedOptions.length === 1 ? (
                // Show single badge
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-raised text-text-base text-xs">
                  <span className="truncate max-w-[140px]">
                    {selectedOptions[0].label}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleRemove(selectedOptions[0].value, e)}
                    className="hover:text-error-base"
                  >
                    <Icon name="close" className="h-4 w-4" />
                  </button>
                </span>
              ) : (
                // Show count when multiple selected
                <span className="text-text-base text-sm">
                  {selectedOptions.length} selected
                </span>
              )}
            </div>
          ) : (
            <span
              className={cn(
                "truncate",
                triggerIcon ? "flex-1" : "max-w-[140px]",
              )}
            >
              {selectedOption?.label || placeholder}
            </span>
          )}
          {selectedTeam ? (
            <TierBadge subscription={subscription ?? null} />
          ) : null}
          {selectedDeployment && showEnvironmentBadge && (
            <EnvironmentBadge
              deploymentType={selectedDeployment.deploymentType}
            />
          )}
        </div>
        <Icon name="chevron-down"
          className={cn(
            "h-3 w-3 text-text-subtle transition-transform shrink-0",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen &&
        dropdownPosition &&
        createPortal(
          <div
            ref={dropdownRef}
            className={cn(
              "fixed z-9999",
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
            <div className="border-b border-border-muted">
              <div className="relative">
                <Icon name="search"
                  size={12}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none z-10"
                />
                <Input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={searchPlaceholder}
                  className={cn(
                    "w-full h-8 pl-7 pr-7 text-xs",
                    "bg-transparent border-0 rounded-none",
                    "text-text-base outline-none focus:outline-none",
                    "hover:bg-transparent hover:border-0",
                    "focus:border-0 focus:border-transparent focus-visible:ring-0",
                  )}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-base"
                  >
                    <Icon name="close" className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div
              ref={optionsRef}
              className="max-h-[300px] overflow-y-auto p-1 space-y-0.5"
            >
              {loading ? (
                <div className="px-3 py-2 text-xs text-text-muted text-center">
                  Loading...
                </div>
              ) : filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-xs text-text-muted text-center">
                  No results found
                </div>
              ) : (
                filteredOptions.map((option, index) => {
                  const selected = isSelected(option.value);
                  return (
                    <button
                      key={
                        option.value !== "" ? option.value : `option-${index}`
                      }
                      type="button"
                      data-index={index}
                      onClick={() => handleSelect(option.value)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={cn(
                        "w-full flex items-center justify-between gap-2 px-2 py-1.5 text-left rounded-lg",
                        "text-xs transition-colors text-text-base",
                        selected
                          ? ""
                          : index === highlightedIndex
                            ? "bg-surface-raised"
                            : "hover:bg-surface-raised",
                      )}
                    >
                      <div className="flex flex-row items-center gap-1.5 min-w-0 flex-1">
                        {multiSelect && (
                          <span className="shrink-0">
                            {selected ? (
                              <Icon name="square-check" className="h-3.5 w-3.5 stroke-brand-base" />
                            ) : (
                              <Icon name="square" className="h-3.5 w-3.5 stroke-text-muted" />
                            )}
                          </span>
                        )}
                        <div className="truncate flex-1 min-w-0">
                          {option.label}
                        </div>
                        {option.sublabel &&
                          (sublabelAsText ? (
                            <span className="text-[11px] text-text-muted truncate">
                              {option.sublabel}
                            </span>
                          ) : (
                            <EnvironmentBadge
                              deploymentType={option.sublabel as "prod" | "dev"}
                            />
                          ))}
                      </div>
                      {!multiSelect && selected && (
                        <Icon name="checkmark-circle" className="h-4 w-4 shrink-0 stroke-brand-base" />
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

export default SearchableSelect;
