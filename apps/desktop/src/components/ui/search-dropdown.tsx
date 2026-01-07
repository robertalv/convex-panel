import * as React from "react";
import { Search, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export interface SearchDropdownOption {
  value: string;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
}

interface SearchDropdownProps {
  value: string;
  options: SearchDropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  enableSearch?: boolean;
  className?: string;
  triggerClassName?: string;
}

export function SearchDropdown({
  value,
  options,
  onChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  enableSearch = false,
  className,
  triggerClassName,
}: SearchDropdownProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = React.useMemo(() => {
    if (!query) return options;
    const lowerQuery = query.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(lowerQuery) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(lowerQuery)),
    );
  }, [options, query]);

  // Reset query when opening/closing
  React.useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 px-2 w-fit rounded-full border-transparent hover:bg-surface-raised hover:border-border-muted transition-all duration-fast",
            "group flex items-center gap-1.5 font-medium",
            !selectedOption && "text-text-muted",
            triggerClassName,
          )}
        >
          <span className="truncate max-w-[150px]">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-text-subtle transition-transform duration-fast",
              open && "rotate-180",
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn("overflow-hidden flex flex-col", className)}
        align="start"
      >
        {enableSearch && (
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border-muted">
            <Search className="h-3.5 w-3.5 text-text-subtle" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="flex-1 bg-transparent text-sm text-text-base placeholder:text-text-disabled focus:outline-none"
              autoFocus
            />
          </div>
        )}
        <div className="max-h-[300px] overflow-y-auto py-1">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-4 text-center text-sm text-text-muted">
              No results found
            </div>
          ) : (
            filteredOptions.map((option, index) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value || `option-${index}`}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-2 w-full px-3 py-1.5 text-left text-sm transition-colors duration-fast",
                    isSelected
                      ? "bg-brand-muted/20 text-brand-base font-semibold"
                      : "text-text-muted hover:bg-surface-raised hover:text-text-base",
                  )}
                >
                  {option.icon && (
                    <div className="flex-shrink-0">{option.icon}</div>
                  )}
                  <div className="flex-1 truncate">
                    <div>{option.label}</div>
                    {option.sublabel && (
                      <div className="text-[10px] text-text-disabled font-normal">
                        {option.sublabel}
                      </div>
                    )}
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5" />}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
