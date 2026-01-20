/**
 * IndexFilters Component
 * Allows selecting an index and applying index-based filters
 */

import React, { useCallback, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { FILTER_OPERATORS, type FilterOperator } from "@convex-panel/shared";
import type {
  Index,
  FilterExpression,
  IndexFilter,
  SearchIndexFilter,
  IndexFilterClause,
  SearchIndexFilterClause,
} from "../types";
import { getIndexFields } from "../hooks/useIndexes";
import {
  DEFAULT_INDEX,
  BY_ID_INDEX,
  createDefaultFilterExpression,
} from "../types";
import {
  ToggleRight,
  ToggleLeft,
  ArrowUpDown,
  Clock,
  Fingerprint,
  Search,
} from "lucide-react";
import { ToolbarButton } from "@/components/ui/button";

// ============================================
// Props Interface
// ============================================

interface IndexFiltersProps {
  /** Available indexes for the table */
  indexes: Index[] | undefined;
  /** Current filter expression */
  filters: FilterExpression;
  /** Callback when filters change */
  onFiltersChange: (filters: FilterExpression) => void;
  /** Whether indexes are loading */
  isLoading?: boolean;
  /** Default document values for initializing filters */
  defaultDocument?: Record<string, any>;
}

// ============================================
// Helper Functions
// ============================================

function isSearchIndexFilter(
  index: IndexFilter | SearchIndexFilter | undefined,
): index is SearchIndexFilter {
  return index !== undefined && "search" in index;
}

// ============================================
// Main Component
// ============================================

export function IndexFilters({
  indexes,
  filters,
  onFiltersChange,
  isLoading = false,
  defaultDocument = {},
}: IndexFiltersProps) {
  // Ensure filters.index is initialized with default index if missing
  // This runs once when component mounts if filters.index is undefined
  useEffect(() => {
    if (!filters.index) {
      const defaultFilters = createDefaultFilterExpression();
      onFiltersChange({
        ...filters,
        index: defaultFilters.index,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Get the index fields to display
  const currentIndexFields = useMemo(() => {
    if (!filters.index) return [];

    // Handle default indexes
    if (filters.index.name === DEFAULT_INDEX) {
      return ["_creationTime"];
    }
    if (filters.index.name === BY_ID_INDEX) {
      return ["_id"];
    }

    const index = indexes?.find((i) => i.name === filters.index?.name);
    if (index) {
      return getIndexFields(index);
    }

    // For custom index from filters, try to extract fields
    if (isSearchIndexFilter(filters.index)) {
      return filters.index.clauses.map((c) => c.field);
    }
    return [];
  }, [filters.index, indexes]);

  // Handle index filter clause change
  const handleIndexClauseChange = useCallback(
    (
      clauseIndex: number,
      updates: Partial<IndexFilterClause | SearchIndexFilterClause>,
    ) => {
      if (!filters.index) return;

      if (isSearchIndexFilter(filters.index)) {
        const newClauses = [...filters.index.clauses];
        newClauses[clauseIndex] = {
          ...newClauses[clauseIndex],
          ...updates,
        } as SearchIndexFilterClause;
        onFiltersChange({
          ...filters,
          index: {
            ...filters.index,
            clauses: newClauses,
          },
        });
      } else {
        const newClauses = [...filters.index.clauses];
        newClauses[clauseIndex] = {
          ...newClauses[clauseIndex],
          ...updates,
        } as IndexFilterClause;
        onFiltersChange({
          ...filters,
          index: {
            ...filters.index,
            clauses: newClauses,
          },
        });
      }
    },
    [filters, onFiltersChange],
  );

  // Handle search text change
  const handleSearchChange = useCallback(
    (search: string) => {
      if (!filters.index || !isSearchIndexFilter(filters.index)) return;

      onFiltersChange({
        ...filters,
        index: {
          ...filters.index,
          search,
        },
      });
    },
    [filters, onFiltersChange],
  );

  // Build index options for the dropdown
  const indexOptions = useMemo(() => {
    const options: {
      value: string;
      label: string;
      icon?: React.ReactNode;
      type: "default" | "database" | "search";
    }[] = [
      // Default system indexes
      {
        value: DEFAULT_INDEX,
        label: "by _creationTime",
        icon: <Clock size={12} />,
        type: "default",
      },
      {
        value: BY_ID_INDEX,
        label: "by _id",
        icon: <Fingerprint size={12} />,
        type: "default",
      },
    ];

    // Add user-defined indexes from the indexes prop
    if (indexes) {
      for (const index of indexes) {
        // Skip staged/building indexes and vector indexes
        if (index.staged) continue;
        if (!Array.isArray(index.fields) && "vectorField" in index.fields)
          continue;

        const isSearchIndex =
          !Array.isArray(index.fields) && "searchField" in index.fields;

        options.push({
          value: index.name,
          label: index.name,
          icon: isSearchIndex ? (
            <Search size={12} />
          ) : (
            <Fingerprint size={12} />
          ),
          type: isSearchIndex ? "search" : "database",
        });
      }
    }

    return options;
  }, [indexes]);

  // Handle index selection change
  const handleIndexChange = useCallback(
    (indexName: string) => {
      const selectedOption = indexOptions.find((o) => o.value === indexName);
      if (!selectedOption) return;

      // Find the full index definition
      const indexDef = indexes?.find((i) => i.name === indexName);

      if (
        selectedOption.type === "search" &&
        indexDef &&
        !Array.isArray(indexDef.fields) &&
        "searchField" in indexDef.fields
      ) {
        // Search index selected
        const searchIndex: SearchIndexFilter = {
          name: indexName,
          search: "",
          clauses: indexDef.fields.filterFields.map((field) => ({
            field,
            enabled: false,
            value: defaultDocument[field],
          })),
        };
        onFiltersChange({
          ...filters,
          clauses: [], // Clear regular clauses for search index
          order: "asc",
          index: searchIndex,
        });
      } else {
        // Database index selected (including default indexes)
        let fields: string[] = [];

        if (indexName === DEFAULT_INDEX) {
          fields = ["_creationTime"];
        } else if (indexName === BY_ID_INDEX) {
          fields = ["_id"];
        } else if (indexDef && Array.isArray(indexDef.fields)) {
          fields = indexDef.fields;
        }

        const dbIndex: IndexFilter = {
          name: indexName,
          clauses: fields.map((field) => ({
            type: "indexEq" as const,
            enabled: false,
            value:
              field === "_creationTime"
                ? new Date().getTime()
                : field === "_id"
                  ? ""
                  : defaultDocument[field],
          })),
        };
        onFiltersChange({
          ...filters,
          order: isSearchIndexFilter(filters.index) ? undefined : filters.order,
          index: dbIndex,
        });
      }
    },
    [indexOptions, indexes, filters, onFiltersChange, defaultDocument],
  );

  // Handle order change
  const handleOrderChange = useCallback(() => {
    onFiltersChange({
      ...filters,
      order: filters.order === "asc" ? "desc" : "asc",
    });
  }, [filters, onFiltersChange]);

  return (
    <div className="flex flex-col gap-2">
      {/* Index Selector Dropdown */}
      <div className="flex items-center gap-2">
        <SearchableSelect
          value={filters.index?.name || DEFAULT_INDEX}
          onChange={handleIndexChange}
          options={indexOptions.map((opt) => ({
            value: opt.value,
            label: opt.label,
          }))}
          placeholder="Select index..."
          className="text-xs"
          buttonClassName="!text-xs !py-1"
          buttonStyle={{ color: "var(--color-text-base)" }}
          disabled={isLoading}
        />

        {/* Order toggle - only show for non-search indexes */}
        {!isSearchIndexFilter(filters.index) && (
          <ToolbarButton
            onClick={handleOrderChange}
            variant="ghost"
            title="Change sort order"
            className="!text-xs !px-2"
          >
            <ArrowUpDown size={12} />
            <span>{filters.order === "asc" ? "Asc" : "Desc"}</span>
          </ToolbarButton>
        )}
      </div>

      {filters.index && !isSearchIndexFilter(filters.index) && (
        <>
          <div className="flex items-center gap-1 mt-2">
            <hr
              className="w-2"
              style={{ borderColor: "var(--color-border-base)" }}
            />
            <span
              className="flex items-center gap-1 text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              Indexed Filters
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full cursor-help"
                      style={{
                        border: "1px solid var(--color-text-subtle)",
                        color: "var(--color-text-subtle)",
                        fontSize: "10px",
                      }}
                    >
                      i
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    Indexed filters are automatically generated based on the
                    index selected above.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </span>
            <hr
              className="grow"
              style={{ borderColor: "var(--color-border-base)" }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            {filters.index.clauses.map((clause, idx) => (
              <DatabaseIndexClauseRow
                key={idx}
                clause={clause}
                fieldName={currentIndexFields[idx] || `field_${idx}`}
                availableFields={currentIndexFields}
                onChange={(updates) => handleIndexClauseChange(idx, updates)}
                isLastEnabled={
                  idx ===
                  filters.index!.clauses.filter((c) => c.enabled).length - 1
                }
              />
            ))}
          </div>
        </>
      )}

      {/* Search index filters */}
      {filters.index && isSearchIndexFilter(filters.index) && (
        <>
          {/* Indexed Filters header */}
          <div className="flex items-center gap-1 mt-2">
            <hr
              className="w-2"
              style={{ borderColor: "var(--color-border-base)" }}
            />
            <span
              className="flex items-center gap-1 text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              Indexed Filters
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full cursor-help"
                      style={{
                        border: "1px solid var(--color-text-subtle)",
                        color: "var(--color-text-subtle)",
                        fontSize: "10px",
                      }}
                    >
                      i
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    Indexed filters are automatically generated based on the
                    index selected above.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </span>
            <hr
              className="grow"
              style={{ borderColor: "var(--color-border-base)" }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            {/* Search input */}
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-mono"
                style={{ color: "var(--color-text-muted)", minWidth: "80px" }}
              >
                search:
              </span>
              <input
                type="text"
                value={filters.index.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search text..."
                className="flex-1 px-2 py-1 rounded text-xs"
                style={{
                  backgroundColor: "var(--color-surface-raised)",
                  color: "var(--color-text-base)",
                  border: "1px solid var(--color-border-base)",
                }}
              />
            </div>

            {/* Filter clauses */}
            {filters.index.clauses.map((clause, idx) => (
              <SearchIndexClauseRow
                key={idx}
                clause={clause}
                onChange={(updates) => handleIndexClauseChange(idx, updates)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================
// Database Index Clause Row
// ============================================

interface DatabaseIndexClauseRowProps {
  clause: IndexFilterClause;
  fieldName: string;
  availableFields: string[];
  onChange: (updates: Partial<IndexFilterClause>) => void;
  isLastEnabled: boolean;
}

function DatabaseIndexClauseRow({
  clause,
  fieldName,
  availableFields,
  onChange,
  isLastEnabled: _isLastEnabled,
}: DatabaseIndexClauseRowProps) {
  const isRange = clause.type === "indexRange";

  // Get the display value - for range filters use lowerValue, otherwise use value
  const displayValue = isRange ? clause.lowerValue : clause.value;

  // Format the display value - for _creationTime show as date
  const formatDisplayValue = (val: any): string => {
    if (val === undefined || val === null) return "";
    if (fieldName === "_creationTime" && typeof val === "number") {
      return new Date(val).toLocaleString();
    }
    if (typeof val === "object") {
      return JSON.stringify(val);
    }
    return String(val);
  };

  // Map operator values to their symbol representations
  const getOperatorSymbol = (op: string): string => {
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
  };

  // Get current operator value
  const getCurrentOperator = (): string => {
    if (isRange) {
      return clause.lowerOp || "gte";
    }
    return clause.op || "eq";
  };

  // Get available operators based on filter type
  const getAvailableOperators = () => {
    if (isRange) {
      // For range filters, only allow gt/gte for lower bound
      return FILTER_OPERATORS.filter(
        (op) => op.value === "gt" || op.value === "gte",
      );
    }
    // For equality filters, allow all comparison operators (but not isType/isNotType)
    return FILTER_OPERATORS.filter(
      (op) =>
        op.value === "eq" ||
        op.value === "neq" ||
        op.value === "gt" ||
        op.value === "gte" ||
        op.value === "lt" ||
        op.value === "lte",
    );
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-2 py-1 rounded-lg",
        clause.enabled
          ? "bg-[var(--color-surface-raised)]"
          : "bg-transparent opacity-60",
      )}
    >
      {/* Enable checkbox */}
      <button
        type="button"
        onClick={() => onChange({ enabled: !clause.enabled })}
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
          value={fieldName}
          onChange={() => {
            // Field changes are handled at the parent level via index changes
            // This is read-only in practice since fields are determined by index structure
          }}
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

      {/* Operator */}
      <SearchableSelect
        value={getCurrentOperator()}
        onChange={(value) => {
          if (isRange) {
            onChange({ lowerOp: value as "gt" | "gte" });
          } else {
            onChange({
              op: value as "eq" | "neq" | "gt" | "gte" | "lt" | "lte",
            });
          }
        }}
        options={getAvailableOperators().map((op) => ({
          value: op.value,
          label: getOperatorSymbol(op.value),
        }))}
        placeholder="operator"
        className="w-fit !text-xs"
        buttonClassName="py-1 !text-xs !border-0 !bg-transparent hover:!bg-transparent !rounded-none !w-auto !min-w-0"
        buttonStyle={{ color: "var(--color-text-muted)" }}
        disabled={!clause.enabled}
      />

      {/* Value display/input */}
      <input
        type="text"
        value={formatDisplayValue(displayValue)}
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
          // Update the appropriate value field based on filter type
          if (isRange) {
            onChange({ lowerValue: value });
          } else {
            onChange({ value });
          }
        }}
        placeholder={fieldName === "_creationTime" ? "timestamp" : "value"}
        className="text-xs outline-none ring-0 focus:outline-none focus:ring-0"
        disabled={!clause.enabled}
      />
    </div>
  );
}

// ============================================
// Search Index Clause Row
// ============================================

interface SearchIndexClauseRowProps {
  clause: SearchIndexFilterClause;
  onChange: (updates: Partial<SearchIndexFilterClause>) => void;
}

function SearchIndexClauseRow({ clause, onChange }: SearchIndexClauseRowProps) {
  // Map operator values to their symbol representations
  const getOperatorSymbol = (op: string): string => {
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
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-2 py-1 rounded-lg",
        clause.enabled
          ? "bg-[var(--color-surface-raised)]"
          : "bg-transparent opacity-60",
      )}
    >
      {/* Enable checkbox */}
      <input
        type="checkbox"
        checked={clause.enabled}
        onChange={(e) => onChange({ enabled: e.target.checked })}
        className="w-3.5 h-3.5 rounded cursor-pointer"
      />

      {/* Field name */}
      <span
        className="text-xs font-mono"
        style={{ color: "var(--color-text-muted)", minWidth: "80px" }}
      >
        {clause.field}
      </span>

      {/* Operator */}
      <SearchableSelect
        value={clause.op || "eq"}
        onChange={(value) => onChange({ op: value as FilterOperator })}
        options={FILTER_OPERATORS.map((op) => ({
          value: op.value,
          label: getOperatorSymbol(op.value),
        }))}
        placeholder="operator"
        className="w-fit"
        disabled={!clause.enabled}
      />

      {/* Value input */}
      <input
        type="text"
        value={
          clause.value !== undefined
            ? typeof clause.value === "object"
              ? JSON.stringify(clause.value)
              : String(clause.value)
            : ""
        }
        onChange={(e) => {
          let value: any = e.target.value;
          // Try to parse as JSON/number
          try {
            value = JSON.parse(e.target.value);
          } catch {
            if (!isNaN(Number(e.target.value)) && e.target.value !== "") {
              value = Number(e.target.value);
            }
          }
          onChange({ value });
        }}
        placeholder="filter value"
        className="flex-1 text-xs outline-none ring-0 focus:outline-none focus:ring-0"
      />
    </div>
  );
}

export default IndexFilters;
