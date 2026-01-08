/**
 * FilterPanel Component
 * Filter clause builder UI with history navigation and sort controls
 * Inspired by the DataFilters reference implementation
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import { Plus, Trash2, ToggleLeft, ToggleRight, Filter } from "lucide-react";
import type {
  FilterClause,
  FilterExpression,
  TableSchema,
  Index,
} from "@convex-panel/shared";
import { FilterNavigationButtons } from "@/components/ui/FilterNavigationButtons";
import { useFilterHistory } from "../hooks/useFilterHistory";
import { generateFilterId } from "../utils/storage";
import { IndexFilters } from "./IndexFilters";
import { ToolbarButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SearchableSelect } from "@/components/ui/SearchableSelect";

// ============================================
// Constants
// ============================================

type FilterOp = FilterClause["op"];

const FILTER_OPERATORS: { value: FilterOp; label: string }[] = [
  { value: "eq", label: "equals" },
  { value: "neq", label: "not equals" },
  { value: "gt", label: "greater than" },
  { value: "gte", label: "greater or equal" },
  { value: "lt", label: "less than" },
  { value: "lte", label: "less or equal" },
  { value: "isType", label: "is type" },
  { value: "isNotType", label: "is not type" },
];

const TYPE_OPTIONS = [
  "string",
  "number",
  "boolean",
  "null",
  "undefined",
  "object",
  "array",
];

// ============================================
// Props Interface
// ============================================

interface FilterPanelProps {
  /** Current filter expression */
  filters: FilterExpression;
  /** Callback when filters change */
  onFiltersChange: (filters: FilterExpression) => void;
  /** Table schema for field suggestions */
  schema?: TableSchema;
  /** Callback when panel is closed */
  onClose: () => void;
  /** Table name for filter history */
  tableName: string;
  /** Component ID for scoped history */
  componentId?: string | null;
  /** Number of documents matching current filters */
  documentCount?: number;
  /** Whether we're actively loading */
  isLoading?: boolean;
  /** Available indexes for the table */
  indexes?: Index[];
  /** Whether indexes are loading */
  indexesLoading?: boolean;
  /** Default document values for initializing index filters */
  defaultDocument?: Record<string, any>;
  /** Callback when schema button is clicked */
  onOpenSchema?: () => void;
  /** Callback when indexes button is clicked */
  onOpenIndexes?: () => void;
}

// ============================================
// Helper Functions
// ============================================

function isTypeOperator(op: FilterOp): boolean {
  return op === "isType" || op === "isNotType";
}

// Check if there are any active index filters
function hasActiveIndexFilters(filters: FilterExpression): boolean {
  if (!filters.index) return false;

  // Check if it's a search index filter
  if ("search" in filters.index) {
    // Search index is active if there's search text or any enabled clauses
    if (filters.index.search && filters.index.search.trim() !== "") return true;
    return filters.index.clauses.some((c) => c.enabled);
  }

  // Database index filter - check if any clauses are enabled
  return filters.index.clauses.some((c) => c.enabled);
}

// Map operator values to their symbol representations
function getOperatorSymbol(op: string): string {
  switch (op) {
    case "eq":
      return "=";
    case "neq":
      return "≠";
    case "gt":
      return ">";
    case "gte":
      return ">=";
    case "lt":
      return "<";
    case "lte":
      return "<=";
    case "isType":
      return "is type";
    case "isNotType":
      return "is not type";
    default:
      return op;
  }
}

// ============================================
// Main Component
// ============================================

export function FilterPanel({
  filters,
  onFiltersChange,
  schema,
  onClose: _onClose,
  tableName,
  componentId = null,
  documentCount: _documentCount,
  isLoading: _isLoading = false,
  indexes,
  indexesLoading = false,
  defaultDocument = {},
  onOpenSchema,
  onOpenIndexes,
}: FilterPanelProps) {
  // Draft filters for editing before applying
  const [draftFilters, setDraftFilters] = useState<FilterExpression>(filters);

  // New clause default values
  const newClauseField = "_id";
  const newClauseOp: FilterOp = "eq";

  // Filter history hook
  const {
    canGoPrevious,
    canGoNext,
    goPrevious,
    goNext,
    addToHistory,
    setCurrentIndex,
  } = useFilterHistory({
    tableName,
    componentId,
    onFiltersChange: (historyFilters) => {
      setDraftFilters(historyFilters);
    },
  });

  // Sync draft with actual filters when filters change externally
  useEffect(() => {
    setDraftFilters(filters);
  }, [filters]);

  // Get available fields from schema
  const availableFields = useMemo(() => {
    const fields = new Set<string>(["_id"]);
    if (schema?.fields) {
      schema.fields.forEach((f) => {
        // Skip _id and _creationTime if they're in the schema to avoid duplicates
        if (f.fieldName !== "_id" && f.fieldName !== "_creationTime") {
          fields.add(f.fieldName);
        }
      });
    }
    fields.add("_creationTime");
    return Array.from(fields);
  }, [schema]);

  // ==========================================
  // Handlers
  // ==========================================

  // Add a new filter clause
  const handleAddClause = useCallback(() => {
    const newClause: FilterClause = {
      id: generateFilterId(),
      field: newClauseField || "_id",
      op: newClauseOp,
      value: "",
      enabled: true,
    };

    setDraftFilters({
      ...draftFilters,
      clauses: [...draftFilters.clauses, newClause],
    });
  }, [newClauseField, newClauseOp, draftFilters]);

  // Remove a filter clause
  const handleRemoveClause = useCallback(
    (id: string) => {
      setDraftFilters({
        ...draftFilters,
        clauses: draftFilters.clauses.filter((c) => c.id !== id),
      });
    },
    [draftFilters],
  );

  // Toggle clause enabled state
  const handleToggleClause = useCallback(
    (id: string) => {
      setDraftFilters({
        ...draftFilters,
        clauses: draftFilters.clauses.map((c) =>
          c.id === id ? { ...c, enabled: !c.enabled } : c,
        ),
      });
    },
    [draftFilters],
  );

  // Update clause field, op, or value
  const handleUpdateClause = useCallback(
    (id: string, updates: Partial<FilterClause>) => {
      setDraftFilters({
        ...draftFilters,
        clauses: draftFilters.clauses.map((c) =>
          c.id === id ? { ...c, ...updates } : c,
        ),
      });
    },
    [draftFilters],
  );

  // Apply filters
  const handleApplyFilters = useCallback(() => {
    onFiltersChange(draftFilters);
    addToHistory(draftFilters);
    setCurrentIndex(0);
  }, [draftFilters, onFiltersChange, addToHistory, setCurrentIndex]);

  // Handle previous navigation
  const handlePrevious = useCallback(() => {
    goPrevious();
  }, [goPrevious]);

  // Handle next navigation
  const handleNext = useCallback(() => {
    goNext();
  }, [goNext]);

  // ==========================================
  // Render
  // ==========================================

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{
        backgroundColor: "var(--color-surface-secondary)",
        borderColor: "var(--color-border-base)",
      }}
    >
      {/* Header with navigation and controls */}
      <div
        className="flex items-center justify-between gap-2 px-3 py-2"
        style={{ borderBottom: "1px solid var(--color-border-base)" }}
      >
        <div className="flex items-center gap-2">
          {/* History navigation */}
          <FilterNavigationButtons
            canGoPrevious={canGoPrevious}
            canGoNext={canGoNext}
            onPrevious={handlePrevious}
            onNext={handleNext}
          />

          {/* Filter count badge */}
          <div className="flex items-center gap-1.5">
            <Filter size={12} className="text-[var(--color-text-muted)]" />
            <span
              className="text-xs font-medium"
              style={{ color: "var(--color-text-base)" }}
            >
              Filter & Sort
            </span>
          </div>
        </div>

        {/* Schema and Indexes buttons */}
        <div className="flex items-center gap-1">
          {onOpenSchema && (
            <ToolbarButton
              onClick={onOpenSchema}
              variant="ghost"
              title="View schema"
            >
              <span>Schema</span>
            </ToolbarButton>
          )}
          {onOpenIndexes && (
            <ToolbarButton
              onClick={onOpenIndexes}
              variant="ghost"
              title="View indexes"
            >
              <span>Indexes</span>
            </ToolbarButton>
          )}
        </div>
      </div>

      {/* Index filters section */}
      {indexes !== undefined && (
        <div
          className="px-3 py-2"
          style={{ borderBottom: "1px solid var(--color-border-base)" }}
        >
          <IndexFilters
            indexes={indexes}
            filters={draftFilters}
            onFiltersChange={(newFilters) => {
              setDraftFilters(newFilters);
            }}
            isLoading={indexesLoading}
            defaultDocument={defaultDocument}
          />
        </div>
      )}

      {/* Filter clauses list */}
      <div
        className={cn(
          "flex flex-col",
          draftFilters.clauses.length > 0
            ? "py-2 border-b border-border-base"
            : "py-0",
        )}
      >
        {draftFilters.clauses.length > 0 &&
          draftFilters.clauses.map((clause) => (
            <div key={clause.id} className="px-3 py-0.75">
              <FilterClauseRow
                clause={clause}
                availableFields={availableFields}
                onToggle={() => handleToggleClause(clause.id)}
                onUpdate={(updates) => handleUpdateClause(clause.id, updates)}
                onRemove={() => handleRemoveClause(clause.id)}
              />
            </div>
          ))}
      </div>

      {/* Footer with Add Filter and Apply Filter buttons */}
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={{
          // borderTop: "1px solid var(--color-border-base)",
          backgroundColor: "var(--color-surface-base)",
        }}
      >
        <ToolbarButton
          onClick={handleAddClause}
          variant="ghost"
          title="Add filter"
        >
          <Plus size={12} />
          <span>Add Filter</span>
        </ToolbarButton>

        {(draftFilters.clauses.length > 0 ||
          hasActiveIndexFilters(draftFilters)) && (
          <ToolbarButton
            onClick={handleApplyFilters}
            variant="primary"
            title="Apply filter"
          >
            Apply Filter
          </ToolbarButton>
        )}
      </div>
    </div>
  );
}

// ============================================
// Filter Clause Row Component
// ============================================

interface FilterClauseRowProps {
  clause: FilterClause;
  availableFields: string[];
  onToggle: () => void;
  onUpdate: (updates: Partial<FilterClause>) => void;
  onRemove: () => void;
}

function FilterClauseRow({
  clause,
  availableFields,
  onToggle,
  onUpdate,
  onRemove,
}: FilterClauseRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-2 py-1 rounded-lg",
        clause.enabled
          ? "bg-[var(--color-surface-raised)]"
          : "bg-transparent opacity-60",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center justify-center w-3.5 h-3.5 rounded cursor-pointer"
        style={{
          color: clause.enabled
            ? "var(--color-success-base)"
            : "var(--color-text-subtle)",
        }}
        title={clause.enabled ? "Disable filter" : "Enable filter"}
      >
        {clause.enabled ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
      </button>

      {/* Field select */}
      <div style={{ minWidth: "80px" }}>
        <SearchableSelect
          value={clause.field}
          onChange={(value) => onUpdate({ field: value })}
          options={availableFields.map((field) => ({
            value: field,
            label: field,
          }))}
          placeholder="field"
          className="text-xs font-mono"
          buttonClassName="!text-xs !px-0 !py-0 !border-0 !bg-transparent hover:!bg-transparent !rounded-none !gap-0 !w-auto !min-w-0"
          buttonStyle={{ color: "var(--color-text-muted)" }}
          disabled={!clause.enabled}
        />
      </div>

      {/* Operator select */}
      <SearchableSelect
        value={clause.op}
        onChange={(value) => onUpdate({ op: value as FilterOp })}
        options={FILTER_OPERATORS.map((op) => ({
          value: op.value,
          label: getOperatorSymbol(op.value),
        }))}
        placeholder="operator"
        className="w-fit !text-xs"
        buttonClassName="!text-xs !px-0 !py-0 !border-0 !bg-transparent hover:!bg-transparent !rounded-none !gap-0 !w-auto !min-w-0"
        buttonStyle={{ color: "var(--color-text-muted)" }}
        disabled={!clause.enabled}
      />

      {isTypeOperator(clause.op) ? (
        <select
          value={String(clause.value)}
          onChange={(e) => onUpdate({ value: e.target.value })}
          disabled={!clause.enabled}
          className="text-xs outline-none ring-0 focus:outline-none focus:ring-0"
        >
          {TYPE_OPTIONS.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          value={
            typeof clause.value === "object"
              ? JSON.stringify(clause.value)
              : String(clause.value ?? "")
          }
          onChange={(e) => {
            let value: any = e.target.value;
            // Try to parse as JSON/number
            try {
              value = JSON.parse(e.target.value);
            } catch {
              // Keep as string
              if (!isNaN(Number(e.target.value)) && e.target.value !== "") {
                value = Number(e.target.value);
              }
            }
            onUpdate({ value });
          }}
          disabled={!clause.enabled}
          placeholder="value"
          className="text-xs outline-none ring-0 focus:outline-none focus:ring-0"
        />
      )}

      {/* Remove button */}
      <button
        type="button"
        onClick={onRemove}
        className="flex items-center justify-center w-5 h-5 rounded transition-colors hover:bg-[var(--color-error-base-alpha)]"
        style={{ color: "var(--color-error-base)" }}
        title="Remove filter"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

export default FilterPanel;
