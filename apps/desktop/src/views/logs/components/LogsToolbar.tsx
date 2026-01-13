/**
 * LogsToolbar Component
 * Toolbar with search, filters, and pause/clear controls
 */

import {
  Search,
  Pause,
  Play,
  Trash2,
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Toolbar } from "@/components/ui/toolbar";
import { ToolbarButton, IconButton } from "@/components/ui/button";
import { ComponentSelector } from "@/components/component-selector";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type { LogFilters, ModuleFunction, LogType } from "../types";
import type { ConvexComponent } from "@/types/desktop";
import { useMemo } from "react";

interface LogsToolbarProps {
  filters: LogFilters;
  onFiltersChange: (filters: LogFilters) => void;
  isPaused: boolean;
  onTogglePause: () => void;
  onClearLogs: () => void;
  onExport?: () => void;
  isExporting?: boolean;
  logCount: number;
  isLoading?: boolean;
  // Components for dropdowns
  components?: ConvexComponent[];
  functions?: ModuleFunction[];
  onSearchChange: (query: string) => void;
  // Pagination props
  currentPage?: number;
  totalPages?: number;
  onPrevPage?: () => void;
  onNextPage?: () => void;
  isViewingHistoricalLogs?: boolean;
}

// Log type display labels
const LOG_TYPE_LABELS: Record<LogType, string> = {
  success: "Success",
  failure: "Failure",
  debug: "Debug",
  "log / info": "Log / Info",
  warn: "Warning",
  error: "Error",
};

// All log types
const ALL_LOG_TYPES: LogType[] = [
  "success",
  "failure",
  "debug",
  "log / info",
  "warn",
  "error",
];

export function LogsToolbar({
  filters,
  onFiltersChange,
  isPaused,
  onTogglePause,
  onClearLogs,
  onExport,
  isExporting = false,
  logCount,
  isLoading = false,
  components = [],
  functions = [],
  onSearchChange,
  currentPage = 1,
  totalPages = 1,
  onPrevPage,
  onNextPage,
  isViewingHistoricalLogs = false,
}: LogsToolbarProps) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    onSearchChange(query);
    onFiltersChange({ ...filters, searchQuery: query });
  };

  // Handle component selection change
  const handleComponentChange = (componentIds: (string | null)[]) => {
    onFiltersChange({ ...filters, selectedComponents: componentIds });
  };

  // Handle log type selection change
  const handleLogTypeChange = (types: string[]) => {
    onFiltersChange({ ...filters, selectedLogTypes: types as LogType[] });
  };

  // Handle function selection change
  const handleFunctionChange = (identifiers: string[]) => {
    // If all functions are selected or none selected, treat as "all"
    if (identifiers.length === 0 || identifiers.length === functions.length) {
      onFiltersChange({ ...filters, selectedFunctions: "all" });
    } else {
      const selectedFns = functions.filter((fn) =>
        identifiers.includes(fn.identifier),
      );
      onFiltersChange({ ...filters, selectedFunctions: selectedFns });
    }
  };

  // Log type options for SearchableSelect
  const logTypeOptions = useMemo(
    () =>
      ALL_LOG_TYPES.map((type) => ({
        value: type,
        label: LOG_TYPE_LABELS[type],
      })),
    [],
  );

  // Function options for SearchableSelect
  const functionOptions = useMemo(
    () =>
      functions.map((fn) => ({
        value: fn.identifier,
        label: fn.name,
        sublabel: fn.udfType,
      })),
    [functions],
  );

  // Get selected component IDs for ComponentSelector
  const selectedComponentIds = useMemo(() => {
    if (filters.selectedComponents === "all") {
      return components.map((c) => c.id);
    }
    return filters.selectedComponents;
  }, [filters.selectedComponents, components]);

  // Get selected function identifiers
  const selectedFunctionIds = useMemo(() => {
    if (filters.selectedFunctions === "all") {
      return functions.map((fn) => fn.identifier);
    }
    return filters.selectedFunctions.map((fn) => fn.identifier);
  }, [filters.selectedFunctions, functions]);

  return (
    <Toolbar
      left={
        <>
          {/* Search input */}
          <div className="relative flex-1 max-w-xs">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--color-text-muted)" }}
            />
            <input
              type="text"
              placeholder="Filter logs..."
              value={filters.searchQuery}
              onChange={handleSearchChange}
              className="w-full h-8 pl-8 pr-3 text-xs rounded-md outline-none transition-colors"
              style={{
                backgroundColor: "var(--color-surface-raised)",
                border: "1px solid var(--color-border-base)",
                color: "var(--color-text-base)",
              }}
            />
          </div>

          {/* Component filter */}
          {components.length > 1 && (
            <ComponentSelector
              components={components}
              multiSelect={true}
              selectedComponentId={selectedComponentIds}
              onSelect={handleComponentChange}
              variant="inline"
            />
          )}

          {/* Log type filter */}
          <SearchableSelect
            multiSelect={true}
            value={filters.selectedLogTypes}
            options={logTypeOptions}
            onChange={handleLogTypeChange}
            placeholder="Log types"
            searchPlaceholder="Search types..."
            variant="ghost"
            buttonClassName="pl-2 pr-1 py-0.5"
            sublabelAsText
          />

          {/* Function filter */}
          {functions.length > 0 && (
            <SearchableSelect
              multiSelect={true}
              value={selectedFunctionIds}
              options={functionOptions}
              onChange={handleFunctionChange}
              placeholder={
                filters.selectedFunctions === "all" ||
                selectedFunctionIds.length === functions.length
                  ? "All Functions"
                  : "Functions"
              }
              searchPlaceholder="Search functions..."
              variant="ghost"
              buttonClassName="pl-2 pr-1 py-0.5"
              sublabelAsText
            />
          )}

          {/* Loading indicator - only show initially, not constantly */}
          {isLoading && functions.length === 0 && (
            <Loader2
              size={14}
              className="animate-spin"
              style={{ color: "var(--color-text-muted)" }}
            />
          )}
        </>
      }
      right={
        <>
          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <IconButton
                onClick={onPrevPage}
                tooltip="Previous page"
                size="sm"
                variant="ghost"
                disabled={currentPage <= 1 || !onPrevPage}
              >
                <ChevronLeft size={14} />
              </IconButton>
              <span
                className="text-xs font-mono px-2"
                style={{ color: "var(--color-text-muted)" }}
              >
                Page {currentPage} of {totalPages}
              </span>
              <IconButton
                onClick={onNextPage}
                tooltip="Next page"
                size="sm"
                variant="ghost"
                disabled={currentPage >= totalPages || !onNextPage}
              >
                <ChevronRight size={14} />
              </IconButton>
            </div>
          )}

          {/* Log count */}
          <span
            className="text-xs font-mono"
            style={{ color: "var(--color-text-muted)" }}
          >
            {logCount} logs
            {isViewingHistoricalLogs && " (stored)"}
          </span>

          {/* Clear logs button */}
          <IconButton
            onClick={onClearLogs}
            tooltip="Clear logs"
            size="sm"
            variant="ghost"
          >
            <Trash2 size={14} />
          </IconButton>

          {/* Export button */}
          {onExport && (
            <IconButton
              onClick={onExport}
              tooltip="Export logs"
              size="sm"
              variant="ghost"
              disabled={isExporting || logCount === 0}
            >
              {isExporting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
            </IconButton>
          )}

          {/* Pause/Resume button */}
          <ToolbarButton
            onClick={onTogglePause}
            active={isPaused}
            className="gap-1.5"
          >
            {isPaused ? (
              <>
                <Play size={14} />
                <span>Resume</span>
              </>
            ) : (
              <>
                <Pause size={14} />
                <span>Pause</span>
              </>
            )}
          </ToolbarButton>
        </>
      }
    />
  );
}

export default LogsToolbar;
