import * as React from "react";
import { cn } from "@/lib/utils";
import { Command, Search } from "lucide-react";
import type { NavItem } from "./AppShell";

interface CommandPaletteProps {
  open: boolean;
  navItems: NavItem[];
  onSelect: (path: string) => void;
  onClose: () => void;
}

/**
 * Command palette for quick navigation using keyboard shortcuts.
 * Opens with ⌘K and allows searching/selecting nav items.
 */
export function CommandPalette({
  open,
  navItems,
  onSelect,
  onClose,
}: CommandPaletteProps) {
  const [query, setQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Reset state when opening
  React.useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      // Focus input after animation
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [open]);

  // Filter items based on query
  const filteredItems = React.useMemo(() => {
    const lowerQuery = query.toLowerCase();
    return navItems.filter(
      (item) =>
        item.label.toLowerCase().includes(lowerQuery) ||
        item.id.toLowerCase().includes(lowerQuery),
    );
  }, [navItems, query]);

  // Keep selected index in bounds
  React.useEffect(() => {
    if (selectedIndex >= filteredItems.length) {
      setSelectedIndex(Math.max(0, filteredItems.length - 1));
    }
  }, [filteredItems.length, selectedIndex]);

  // Keyboard navigation
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredItems.length - 1 ? prev + 1 : 0,
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredItems.length - 1,
          );
          break;
        case "Enter":
          e.preventDefault();
          if (filteredItems[selectedIndex]) {
            onSelect(filteredItems[selectedIndex].path);
            onClose();
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    },
    [filteredItems, selectedIndex, onSelect, onClose],
  );

  // Close on escape key (global)
  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background-base/80 backdrop-blur-sm animate-fade-in" />

      {/* Palette container */}
      <div
        className={cn(
          "relative w-full max-w-md mx-4",
          "bg-surface-base border border-border-base rounded-xl shadow-xl",
          "animate-scale-in overflow-hidden",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-muted">
          <Search className="h-4 w-4 text-text-subtle flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Jump to section..."
            className={cn(
              "flex-1 bg-transparent text-sm text-text-base",
              "placeholder:text-text-disabled",
              "focus:outline-none",
            )}
          />
          <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-surface-raised text-xs text-text-subtle border border-border-muted">
            esc
          </kbd>
        </div>

        {/* Results list */}
        <div className="max-h-[300px] overflow-y-auto py-2">
          {filteredItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-text-muted">
              No results found
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelect(item.path);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    "flex items-center gap-3 w-full px-4 py-2.5",
                    "text-left transition-colors duration-fast",
                    isSelected
                      ? "bg-interactive-muted text-text-base"
                      : "text-text-muted hover:bg-surface-raised",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 flex-shrink-0",
                      isSelected ? "text-brand-base" : "text-text-subtle",
                    )}
                  />
                  <span className="flex-1 text-sm font-medium truncate">
                    {item.label}
                  </span>
                  {item.shortcut && (
                    <kbd className="px-1.5 py-0.5 rounded bg-surface-base text-xs text-text-subtle border border-border-muted">
                      {item.shortcut}
                    </kbd>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border-muted text-xs text-text-subtle">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1 rounded bg-surface-raised border border-border-muted">
                ↑
              </kbd>
              <kbd className="px-1 rounded bg-surface-raised border border-border-muted">
                ↓
              </kbd>
              <span className="ml-1">navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 rounded bg-surface-raised border border-border-muted">
                ↵
              </kbd>
              <span className="ml-1">select</span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Command className="h-3 w-3" />
            <span>K to open</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
