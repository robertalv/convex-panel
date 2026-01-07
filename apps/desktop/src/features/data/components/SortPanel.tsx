/**
 * SortPanel Component
 * Dropdown panel for managing sort rules on table columns
 * Styled to match SearchableSelect
 */

import { useState, useRef, useEffect, useMemo } from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Plus,
  ChevronDown,
  CircleCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SortConfig } from "../types";
import { ToolbarButton } from "@/components/ui/button";

interface SortPanelProps {
  sortConfig: SortConfig | null;
  onSortChange: (field: string, direction: "asc" | "desc") => void;
  onClearSort: () => void;
  columns: string[];
  columnMeta?: Record<string, { typeLabel: string; optional: boolean }>;
}

export function SortPanel({
  sortConfig,
  onSortChange,
  onClearSort,
  columns,
  columnMeta = {},
}: SortPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [_selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [isSelectingColumn, setIsSelectingColumn] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sortable columns (exclude system fields from default selection)
  const sortableColumns = useMemo(() => {
    return columns.filter((c) => c !== "_id");
  }, [columns]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setIsSelectingColumn(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setIsSelectingColumn(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen]);

  const handleSelectColumn = (column: string) => {
    setSelectedColumn(column);
    setIsSelectingColumn(false);
    // Default to ascending
    onSortChange(column, "asc");
  };

  const handleToggleDirection = () => {
    if (sortConfig) {
      onSortChange(
        sortConfig.field,
        sortConfig.direction === "asc" ? "desc" : "asc",
      );
    }
  };

  const handleRemoveSort = () => {
    onClearSort();
    setSelectedColumn(null);
  };

  const hasSortApplied = sortConfig !== null;

  return (
    <div ref={containerRef} className="relative">
      <ToolbarButton onClick={() => setIsOpen(!isOpen)} active={hasSortApplied}>
        <ArrowUpDown size={14} />
        <span>Sort</span>
        {hasSortApplied && (
          <span
            className="px-1.5 py-0.5 text-[10px] rounded-full"
            style={{
              backgroundColor: "var(--color-brand-base)",
              color: "white",
            }}
          >
            1
          </span>
        )}
      </ToolbarButton>

      {isOpen && (
        <div
          className={cn(
            "absolute top-full left-0 mt-1 z-50",
            "min-w-[280px]",
            "bg-surface-base border border-border-muted rounded-xl shadow-lg",
            "overflow-hidden",
            "animate-fade-up",
          )}
          style={{ animationDuration: "150ms" }}
        >
          {!hasSortApplied && !isSelectingColumn ? (
            // No sort applied - show prompt
            <div className="p-1 space-y-0.5">
              <div className="px-3 py-2 text-sm text-text-muted text-center">
                No sorts applied to this view
              </div>
              <button
                onClick={() => setIsSelectingColumn(true)}
                className="w-full flex items-center gap-1.5 px-2 py-1 text-sm rounded-lg transition-colors text-brand-base hover:bg-surface-raised text-left"
              >
                <Plus size={12} />
                <span>Pick a column to sort by</span>
              </button>
            </div>
          ) : isSelectingColumn ? (
            // Column selection dropdown
            <>
              <div className="border-b border-border-muted px-3 py-2">
                <p className="text-xs text-text-muted">Select a column</p>
              </div>
              <div className="max-h-[240px] overflow-y-auto p-1 space-y-0.5">
                {sortableColumns.map((column) => {
                  const meta = columnMeta[column];
                  const isCurrentSort = sortConfig?.field === column;
                  return (
                    <button
                      key={column}
                      onClick={() => handleSelectColumn(column)}
                      className={cn(
                        "w-full flex items-center justify-between gap-2 px-2 py-1 text-left rounded-lg",
                        "text-sm transition-colors text-text-base",
                        isCurrentSort
                          ? ""
                          : "hover:bg-surface-raised",
                      )}
                    >
                      <div className="flex flex-row items-center gap-1.5 min-w-0 flex-1">
                        <div className="truncate flex-1 min-w-0">
                          {column}
                        </div>
                        {meta && (
                          <span className="text-xs text-text-muted truncate">
                            {meta.typeLabel}
                          </span>
                        )}
                      </div>
                      {isCurrentSort && (
                        <CircleCheck className="h-4 w-4 flex-shrink-0 stroke-brand-base" />
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            // Sort rule applied - show current sort
            <>
              <div className="border-b border-border-muted px-3 py-2 flex items-center justify-between">
                <span className="text-xs text-text-muted">Sort by</span>
                {hasSortApplied && (
                  <button
                    onClick={handleRemoveSort}
                    className="text-xs px-1.5 py-0.5 rounded-md transition-colors text-text-muted hover:bg-surface-raised"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="p-1 space-y-0.5">
                <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-surface-raised border border-border-muted">
                  {/* Column name */}
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => setIsSelectingColumn(true)}
                      className="flex items-center gap-1 text-sm w-full text-text-base"
                    >
                      <span className="truncate">{sortConfig?.field}</span>
                      <ChevronDown size={12} className="text-text-muted" />
                    </button>
                  </div>

                  {/* Direction toggle */}
                  <button
                    onClick={handleToggleDirection}
                    className="flex items-center gap-1 px-2 py-1 text-sm rounded-md transition-colors bg-surface-overlay text-text-base hover:bg-border-muted"
                  >
                    {sortConfig?.direction === "asc" ? (
                      <>
                        <ArrowUp size={12} />
                        <span>Ascending</span>
                      </>
                    ) : (
                      <>
                        <ArrowDown size={12} />
                        <span>Descending</span>
                      </>
                    )}
                  </button>

                  {/* Remove button */}
                  <button
                    onClick={handleRemoveSort}
                    className="p-1 rounded-md transition-colors text-text-muted hover:bg-surface-overlay hover:text-error-base"
                  >
                    <X size={12} />
                  </button>
                </div>

                {/* Add another sort (future feature - disabled for now) */}
                <button
                  disabled
                  className="w-full flex items-center gap-1.5 px-2 py-1 text-sm transition-colors opacity-50 cursor-not-allowed text-text-muted rounded-lg text-left"
                >
                  <Plus size={12} />
                  <span>Add another sort</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default SortPanel;
