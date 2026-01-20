/**
 * DataToolbar Component
 * Toolbar with view switcher, filter toggle, export button, and add document button
 * Uses the reusable Toolbar component
 */

import { useState, useRef, useEffect } from "react";
import {
  Table2,
  LayoutList,
  Braces,
  Code2,
  Filter,
  Download,
  Plus,
  ChevronDown,
  FileJson,
  FileSpreadsheet,
  X,
  Trash2,
  Edit2,
  PanelLeftClose,
} from "lucide-react";
import type {
  DataViewMode,
  ExportFormat,
  FilterExpression,
  SortConfig,
} from "../types";
import { FieldVisibilityDropdown } from "./FieldVisibilityDropdown";
import { SortPanel } from "./SortPanel";
import { TableMenuDropdown } from "./TableMenuDropdown";
import { ToolbarButton, IconButton } from "@/components/ui/button";
import { Toolbar } from "@/components/ui/toolbar";

interface DataToolbarProps {
  viewMode: DataViewMode;
  onViewModeChange: (mode: DataViewMode) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  filters: FilterExpression;
  onClearFilters: () => void;
  onAddDocument: () => void;
  onExport: (format: ExportFormat) => void;
  isExporting?: boolean;
  documentCount: number;
  selectedTable: string;
  isLoading?: boolean;
  hasActiveFilters?: boolean;
  // Column visibility props
  allFields?: string[];
  visibleFields?: string[];
  onVisibleFieldsChange?: (fields: string[]) => void;
  // Selection props
  selectedCount?: number;
  onDeleteSelected?: () => void;
  onEditSelected?: () => void;
  onClearSelection?: () => void;
  // Sort props
  sortConfig?: SortConfig | null;
  onSortChange?: (field: string, direction: "asc" | "desc") => void;
  onClearSort?: () => void;
  // Column metadata for sort panel
  columnMeta?: Record<string, { typeLabel: string; optional: boolean }>;
  // Sidebar collapse
  onCollapseSidebar?: () => void;
  sidebarCollapsed?: boolean;
  // Table menu actions
  onCustomQuery?: () => void;
  onSchema?: () => void;
  onIndexes?: () => void;
  onMetrics?: () => void;
  onClearTable?: () => void;
  onDeleteTable?: () => void;
}

const viewModes: { mode: DataViewMode; icon: typeof Table2; label: string }[] =
  [
    { mode: "table", icon: Table2, label: "Table" },
    { mode: "list", icon: LayoutList, label: "List" },
    { mode: "json", icon: Braces, label: "JSON" },
    { mode: "raw", icon: Code2, label: "Raw" },
  ];

export function DataToolbar({
  viewMode,
  onViewModeChange,
  showFilters,
  onToggleFilters,
  filters,
  onClearFilters,
  onAddDocument,
  onExport,
  isExporting = false,
  documentCount,
  selectedTable,
  isLoading: _isLoading = false,
  hasActiveFilters = false,
  allFields = [],
  visibleFields = [],
  onVisibleFieldsChange,
  selectedCount = 0,
  onDeleteSelected,
  onEditSelected,
  onClearSelection,
  sortConfig = null,
  onSortChange,
  onClearSort,
  columnMeta = {},
  onCollapseSidebar,
  sidebarCollapsed = false,
  onCustomQuery,
  onSchema,
  onIndexes,
  onMetrics,
  onClearTable,
  onDeleteTable,
}: DataToolbarProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showFieldVisibility, setShowFieldVisibility] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const activeFiltersCount = filters.clauses.filter((c) => c.enabled).length;
  const hasSelection = selectedCount > 0;
  const deleteLabel = selectedCount > 1 ? `Delete ${selectedCount}` : "Delete";

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target as Node)
      ) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <Toolbar
      left={
        <>
          {onCollapseSidebar && !sidebarCollapsed && (
            <IconButton
              onClick={onCollapseSidebar}
              tooltip="Collapse sidebar"
              variant="ghost"
              size="sm"
            >
              <PanelLeftClose size={16} />
            </IconButton>
          )}

          {/* View mode buttons */}
          <div
            className="flex items-center rounded-lg p-0.5"
            style={{ backgroundColor: "var(--color-surface-raised)" }}
          >
            {viewModes.map(({ mode, icon: Icon, label }) => (
              <IconButton
                key={mode}
                onClick={() => onViewModeChange(mode)}
                tooltip={label}
                variant="ghost"
                size="sm"
                style={{
                  backgroundColor:
                    viewMode === mode
                      ? "var(--color-surface-base)"
                      : "transparent",
                  color:
                    viewMode === mode
                      ? "var(--color-text-base)"
                      : "var(--color-text-muted)",
                  boxShadow:
                    viewMode === mode ? "0 1px 2px rgba(0,0,0,0.1)" : "none",
                }}
              >
                <Icon size={14} />
              </IconButton>
            ))}
          </div>

          {/* Filter toggle button */}
          <ToolbarButton onClick={onToggleFilters} active={showFilters}>
            <Filter size={14} />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span
                className="flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-medium"
                style={{
                  backgroundColor: "var(--color-brand-base)",
                  color: "white",
                }}
              >
                {activeFiltersCount}
              </span>
            )}
          </ToolbarButton>

          {/* Sort panel */}
          {onSortChange && onClearSort && (
            <SortPanel
              sortConfig={sortConfig}
              onSortChange={onSortChange}
              onClearSort={onClearSort}
              columns={allFields}
              columnMeta={columnMeta}
            />
          )}

          {/* Clear filters button (only show when filters active) */}
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={onClearFilters}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors hover:bg-[var(--color-surface-raised)]"
              style={{ color: "var(--color-text-muted)" }}
              title="Clear all filters"
            >
              <X size={12} />
              <span>Clear</span>
            </button>
          )}

          {/* Document count */}
          <span
            className="text-xs ml-2"
            style={{ color: "var(--color-text-subtle)" }}
          >
            {documentCount} {documentCount === 1 ? "document" : "documents"}
            {hasActiveFilters && " (filtered)"}
          </span>
        </>
      }
      right={
        <>
          {hasSelection && (
            <>
              {/* Selection count */}
              <span className="text-xs font-medium px-2 py-1 rounded">
                {selectedCount} selected
              </span>

              {onClearSelection && (
                <IconButton
                  onClick={onClearSelection}
                  variant="ghost"
                  size="sm"
                  tooltip="Clear selection"
                >
                  <X size={12} />
                </IconButton>
              )}

              {selectedCount === 1 && onEditSelected && (
                <button
                  type="button"
                  onClick={onEditSelected}
                  className="flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors"
                  style={{
                    backgroundColor: "var(--color-surface-raised)",
                    color: "var(--color-text-base)",
                    border: "1px solid var(--color-border-base)",
                  }}
                >
                  <Edit2 size={12} />
                  <span>Edit</span>
                </button>
              )}

              {/* Delete button */}
              {onDeleteSelected && (
                <ToolbarButton onClick={onDeleteSelected} variant="destructive">
                  <Trash2 size={12} />
                  <span>{deleteLabel}</span>
                </ToolbarButton>
              )}

              {/* Divider */}
              <div
                style={{
                  width: 1,
                  height: 20,
                  backgroundColor: "var(--color-border-base)",
                }}
              />
            </>
          )}

          {/* Column visibility dropdown */}
          {allFields.length > 0 && onVisibleFieldsChange && (
            <FieldVisibilityDropdown
              fields={allFields}
              visibleFields={visibleFields}
              onVisibleFieldsChange={onVisibleFieldsChange}
              isOpen={showFieldVisibility}
              onToggle={() => setShowFieldVisibility(!showFieldVisibility)}
              onClose={() => setShowFieldVisibility(false)}
            />
          )}

          {/* Export dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <ToolbarButton
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExporting || !selectedTable}
            >
              <Download
                size={14}
                className={isExporting ? "animate-pulse" : ""}
              />
              <span>{isExporting ? "Exporting..." : "Export"}</span>
              <ChevronDown size={12} />
            </ToolbarButton>

            {showExportMenu && (
              <div
                className="absolute right-0 top-full mt-1 min-w-[180px] rounded-xl shadow-lg z-20 overflow-hidden p-1 space-y-0.5"
                style={{
                  backgroundColor: "var(--color-surface-base)",
                  border: "1px solid var(--color-border-muted)",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    onExport("json");
                    setShowExportMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-left rounded-lg transition-colors text-text-base hover:bg-surface-raised"
                >
                  <FileJson size={14} />
                  <span>Export as JSON</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onExport("csv");
                    setShowExportMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-left rounded-lg transition-colors text-text-base hover:bg-surface-raised"
                >
                  <FileSpreadsheet size={14} />
                  <span>Export as CSV</span>
                </button>
              </div>
            )}
          </div>

          {/* Add document button */}
          <ToolbarButton
            onClick={onAddDocument}
            disabled={!selectedTable}
            variant="primary"
          >
            <Plus size={14} />
            <span>Add Document</span>
          </ToolbarButton>

          {/* Table menu dropdown */}
          {onCustomQuery && onSchema && onIndexes && onMetrics && (
            <TableMenuDropdown
              onCustomQuery={onCustomQuery}
              onSchema={onSchema}
              onIndexes={onIndexes}
              onMetrics={onMetrics}
              onClearTable={onClearTable}
              onDeleteTable={onDeleteTable}
              disabled={!selectedTable}
            />
          )}
        </>
      }
    />
  );
}

export default DataToolbar;
