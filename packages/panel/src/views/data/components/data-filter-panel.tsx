import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Fingerprint,
  ArrowDownAZ,
  ArrowUpAZ,
  Plus,
  X,
  Clock,
  FileText,
} from "lucide-react";
import type {
  FilterExpression,
  FilterClause,
  TableDefinition,
} from "../../../types";
import type { SortConfig } from "../../../types/common";
import { operatorOptions, typeOptions } from "../../../utils/constants";
import {
  FieldVisibilityDropdown,
  SheetLayout,
} from "../../../components/shared";
import { SearchableDropdown } from "../../../components/shared/searchable-dropdown";
import type { SearchableDropdownOption } from "../../../components/shared/searchable-dropdown";

export interface DataFilterPanelProps {
  filters: FilterExpression;
  setFilters: (filters: FilterExpression) => void;
  sortConfig: SortConfig | null;
  setSortConfig: (sortConfig: SortConfig | null) => void;
  selectedTable: string;
  tables: TableDefinition;
  visibleFields?: string[];
  onVisibleFieldsChange?: (fields: string[]) => void;
  onClose?: () => void;
  openColumnVisibility?: boolean;
  filterHistoryApi: {
    push: (
      scope: string,
      state: { filters: FilterExpression; sortConfig: SortConfig | null },
    ) => Promise<void>;
    undo: (
      scope: string,
      count?: number,
    ) => Promise<{
      filters: FilterExpression;
      sortConfig: SortConfig | null;
    } | null>;
    redo: (
      scope: string,
      count?: number,
    ) => Promise<{
      filters: FilterExpression;
      sortConfig: SortConfig | null;
    } | null>;
    getStatus: (scope: string) => Promise<{
      canUndo: boolean;
      canRedo: boolean;
      position: number | null;
      length: number;
    }>;
  };
  /** Optional user ID for scoping filter history. Defaults to 'default' */
  userId?: string;
}

// Filter Row Component
interface FilterRowProps {
  filter: FilterClause;
  index: number;
  allFields: string[];
  onUpdate: (index: number, updates: Partial<FilterClause>) => void;
  onRemove: (index: number) => void;
  getTypeIndicator: (
    fieldName: string,
    value: any,
  ) => { prefix: string; color: string } | null;
}

const FilterRow: React.FC<FilterRowProps> = ({
  filter,
  index,
  allFields,
  onUpdate,
  onRemove,
  getTypeIndicator,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Prepare field options for SearchableDropdown
  const fieldOptions: SearchableDropdownOption<string>[] = allFields.map(
    (field) => ({
      key: field,
      label: field,
      value: field,
      searchValue: field.toLowerCase(),
    }),
  );

  // Prepare operator options for SearchableDropdown
  const opOptions: SearchableDropdownOption<FilterClause["op"]>[] =
    operatorOptions.map((op) => ({
      key: op.value,
      label: op.label,
      value: op.value as FilterClause["op"],
      searchValue: `${op.label} ${op.value}`.toLowerCase(),
    }));

  // Prepare type options for SearchableDropdown (when using isType/isNotType operators)
  const typeSelectOptions: SearchableDropdownOption<string>[] = typeOptions.map(
    (type) => ({
      key: type.value,
      label: type.label,
      value: type.value,
      searchValue: `${type.label} ${type.value}`.toLowerCase(),
    }),
  );

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "10px 12px",
        backgroundColor: isHovered
          ? "var(--color-panel-bg-tertiary)"
          : "var(--color-panel-bg-secondary)",
        border: "1px solid var(--color-panel-border)",
        borderRadius: "10px",
        transition: "all 0.15s ease",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Toggle Switch */}
      <button
        type="button"
        onClick={() => onUpdate(index, { enabled: !filter.enabled })}
        style={{
          width: "28px",
          height: "16px",
          backgroundColor: filter.enabled
            ? "var(--color-panel-accent)"
            : "var(--color-panel-border)",
          borderRadius: "8px",
          position: "relative",
          border: "none",
          cursor: "pointer",
          transition: "background-color 0.15s ease",
          flexShrink: 0,
          padding: 0,
        }}
      >
        <div
          style={{
            width: "12px",
            height: "12px",
            backgroundColor: "var(--color-panel-bg)",
            borderRadius: "50%",
            position: "absolute",
            top: "2px",
            left: filter.enabled ? "14px" : "2px",
            transition: "left 0.15s ease",
            boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
          }}
        />
      </button>

      {/* Field Selector */}
      <div style={{ minWidth: "100px", flex: "0 0 auto" }}>
        <SearchableDropdown
          selectedValue={filter.field}
          options={fieldOptions}
          onSelect={(field) => onUpdate(index, { field, value: "" })}
          placeholder="Field..."
          searchPlaceholder="Search..."
          emptyStateText="No fields"
          listMaxHeight={240}
          triggerStyle={{
            fontSize: "12px",
            fontFamily: "monospace",
            height: "28px",
            padding: "0 8px",
            backgroundColor: "transparent",
            border: "none",
          }}
        />
      </div>

      {/* Operator Selector */}
      <div style={{ minWidth: "80px", flex: "0 0 auto" }}>
        <SearchableDropdown
          selectedValue={filter.op}
          options={opOptions}
          onSelect={(op) => {
            onUpdate(index, {
              op,
              value:
                (op === "isType" || op === "isNotType") &&
                filter.op !== "isType" &&
                filter.op !== "isNotType"
                  ? ""
                  : filter.value,
            });
          }}
          placeholder="Op..."
          searchPlaceholder="Search..."
          emptyStateText="No operators"
          listMaxHeight={240}
          triggerStyle={{
            fontSize: "12px",
            height: "28px",
            padding: "0 8px",
            backgroundColor: "transparent",
            border: "none",
          }}
        />
      </div>

      {/* Value Input */}
      {filter.op === "isType" || filter.op === "isNotType" ? (
        <div style={{ flex: 1, minWidth: "80px" }}>
          <SearchableDropdown
            selectedValue={filter.value || null}
            options={typeSelectOptions}
            onSelect={(value) => onUpdate(index, { value })}
            placeholder="Select type..."
            searchPlaceholder="Search..."
            emptyStateText="No types"
            listMaxHeight={200}
            triggerStyle={{
              fontSize: "12px",
              height: "28px",
              padding: "0 8px",
              backgroundColor: "transparent",
              border: "none",
            }}
          />
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            height: "28px",
            backgroundColor: "var(--color-panel-bg)",
            border: "1px solid var(--color-panel-border)",
            borderRadius: "6px",
            padding: "0 8px",
            gap: "6px",
            minWidth: 0,
            transition: "border-color 0.15s ease",
          }}
        >
          {(() => {
            const typeIndicator = getTypeIndicator(filter.field, filter.value);
            return typeIndicator ? (
              <span
                style={{
                  color: typeIndicator.color,
                  fontSize: "9px",
                  fontFamily: "monospace",
                  fontWeight: 600,
                  padding: "2px 4px",
                  borderRadius: "4px",
                  backgroundColor: "var(--color-panel-bg-tertiary)",
                  flexShrink: 0,
                  lineHeight: "1",
                }}
              >
                {typeIndicator.prefix}
              </span>
            ) : null;
          })()}
          <input
            type="text"
            value={
              typeof filter.value === "string"
                ? filter.value
                : filter.value !== undefined
                  ? JSON.stringify(filter.value)
                  : ""
            }
            onChange={(e) => {
              let parsedValue: any = e.target.value;
              if (e.target.value.trim() !== "") {
                try {
                  parsedValue = JSON.parse(e.target.value);
                } catch {
                  parsedValue = e.target.value;
                }
              }
              onUpdate(index, { value: parsedValue });
            }}
            placeholder="Value..."
            style={{
              flex: 1,
              backgroundColor: "transparent",
              fontSize: "12px",
              color: "var(--color-panel-text)",
              border: "none",
              outline: "none",
              fontFamily: "monospace",
              height: "100%",
              minWidth: 0,
            }}
            onFocus={(e) => {
              const parent = e.currentTarget.parentElement;
              if (parent) {
                parent.style.borderColor = "var(--color-panel-accent)";
              }
            }}
            onBlur={(e) => {
              const parent = e.currentTarget.parentElement;
              if (parent) {
                parent.style.borderColor = "var(--color-panel-border)";
              }
            }}
          />
        </div>
      )}

      {/* Remove Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(index);
        }}
        style={{
          padding: "6px",
          color: "var(--color-panel-text-muted)",
          backgroundColor: "transparent",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.15s ease",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "var(--color-panel-error)";
          e.currentTarget.style.backgroundColor =
            "var(--color-panel-bg-tertiary)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "var(--color-panel-text-muted)";
          e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
};

export const DataFilterPanel: React.FC<DataFilterPanelProps> = ({
  filters,
  setFilters,
  sortConfig,
  setSortConfig,
  selectedTable,
  tables,
  visibleFields: propVisibleFields,
  onVisibleFieldsChange,
  onClose,
  openColumnVisibility = false,
  filterHistoryApi,
  userId = "default",
}) => {
  // Draft filters - local state that can be applied or cancelled
  const [draftFilters, setDraftFilters] = useState<FilterClause[]>(
    filters.clauses || [],
  );
  const [draftSortConfig, setDraftSortConfig] = useState<SortConfig | null>(
    sortConfig,
  );

  // Scope for filter history: user:userId:table:tableName
  const filterHistoryScope = `user:${userId}:table:${selectedTable}`;
  const [historyStatus, setHistoryStatus] = useState<{
    canUndo: boolean;
    canRedo: boolean;
    position: number | null;
    length: number;
  } | null>(null);

  useEffect(() => {
    filterHistoryApi
      .getStatus(filterHistoryScope)
      .then(setHistoryStatus)
      .catch(() => {});
  }, [filterHistoryScope, filterHistoryApi]);

  // Field visibility state
  const [visibleFields, setVisibleFields] = useState<string[]>(
    propVisibleFields || [],
  );

  // Sync draft with props when they change externally
  useEffect(() => {
    setDraftFilters(filters.clauses || []);
  }, [filters.clauses]);

  useEffect(() => {
    setDraftSortConfig(sortConfig);
  }, [sortConfig]);

  const tableSchema = tables[selectedTable];
  const availableFields =
    tableSchema?.fields?.map((field) => field.fieldName) || [];
  const allFields = ["_id", ...availableFields, "_creationTime"].filter(
    (col, index, self) => self.indexOf(col) === index,
  );

  // Extract indexes from table schema
  const getAvailableIndexes = () => {
    const indexes: Array<{ name: string; fields: string[]; label: string }> =
      [];

    const indexFields = availableFields.filter((field) =>
      field.startsWith("by_"),
    );

    indexFields.forEach((field) => {
      const baseField = field.replace("by_", "");
      indexes.push({
        name: field,
        fields: [baseField, "_creationTime"],
        label: `by_${baseField}`,
      });
    });

    indexes.unshift({
      name: "_creationTime",
      fields: ["_creationTime"],
      label: "By creation time",
    });
    indexes.unshift({
      name: "_id",
      fields: ["_id"],
      label: "By ID",
    });

    return indexes;
  };

  const availableIndexes = getAvailableIndexes();

  // Prepare sort options for SearchableDropdown
  const sortOptions = React.useMemo<SearchableDropdownOption<string>[]>(() => {
    return availableIndexes.map((index) => {
      let icon: React.ReactNode;
      if (index.name === "_creationTime") {
        icon = (
          <Clock size={14} style={{ color: "var(--color-panel-text-muted)" }} />
        );
      } else if (index.name === "_id") {
        icon = (
          <FileText
            size={14}
            style={{ color: "var(--color-panel-text-muted)" }}
          />
        );
      } else {
        icon = (
          <Fingerprint
            size={14}
            style={{ color: "var(--color-panel-text-muted)" }}
          />
        );
      }

      return {
        key: index.name,
        label: (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontWeight: 500 }}>{index.label}</span>
            <span
              style={{
                fontSize: "10px",
                color: "var(--color-panel-text-muted)",
                fontFamily: "monospace",
              }}
            >
              ({index.fields.join(", ")})
            </span>
          </div>
        ),
        value: index.fields[0],
        icon,
        searchValue:
          `${index.label} ${index.name} ${index.fields.join(" ")}`.toLowerCase(),
      };
    });
  }, [availableIndexes]);

  // Initialize visible fields when table changes
  useEffect(() => {
    if (allFields.length > 0 && selectedTable) {
      if (propVisibleFields === undefined || propVisibleFields.length === 0) {
        const defaultVisible = [...allFields];
        setVisibleFields(defaultVisible);
        onVisibleFieldsChange?.(defaultVisible);
      }
    }
  }, [selectedTable, allFields.length]);

  // Sync visible fields with prop
  useEffect(() => {
    if (propVisibleFields !== undefined && selectedTable) {
      if (JSON.stringify(propVisibleFields) !== JSON.stringify(visibleFields)) {
        setVisibleFields(propVisibleFields);
      }
    }
  }, [propVisibleFields, selectedTable]);

  // Field visibility state
  const [isFieldVisibilityOpen, setIsFieldVisibilityOpen] =
    useState(openColumnVisibility);

  useEffect(() => {
    if (openColumnVisibility) {
      setIsFieldVisibilityOpen(true);
    }
  }, [openColumnVisibility]);

  // Apply filters
  const handleApplyFilters = useCallback(async () => {
    const newFilters: FilterExpression = {
      clauses: draftFilters.filter((f) => f.enabled),
    };
    setFilters(newFilters);
    if (draftSortConfig) {
      setSortConfig(draftSortConfig);
    } else {
      setSortConfig(null);
    }
    try {
      await filterHistoryApi.push(filterHistoryScope, {
        filters: newFilters,
        sortConfig: draftSortConfig,
      });
      filterHistoryApi
        .getStatus(filterHistoryScope)
        .then(setHistoryStatus)
        .catch(() => {});
    } catch {}

    onClose?.();
  }, [
    draftFilters,
    draftSortConfig,
    setFilters,
    setSortConfig,
    onClose,
    filterHistoryApi,
    filterHistoryScope,
  ]);

  const canGoBack = historyStatus?.canUndo ?? false;
  const canGoForward = historyStatus?.canRedo ?? false;

  const handleGoBack = useCallback(async () => {
    if (!canGoBack) return;

    try {
      const prevState = await filterHistoryApi.undo(filterHistoryScope, 1);
      await new Promise((resolve) => setTimeout(resolve, 50));
      const newStatus = await filterHistoryApi.getStatus(filterHistoryScope);
      setHistoryStatus(newStatus);

      if (prevState) {
        setDraftFilters(prevState.filters.clauses || []);
        setDraftSortConfig(prevState.sortConfig);
        setFilters(prevState.filters);
        setSortConfig(prevState.sortConfig || null);
      } else {
        setDraftFilters([]);
        setDraftSortConfig(null);
        setFilters({ clauses: [] });
        setSortConfig(null);
      }
    } catch {}
  }, [
    canGoBack,
    setFilters,
    setSortConfig,
    filterHistoryApi,
    filterHistoryScope,
  ]);

  const handleGoForward = useCallback(async () => {
    if (!canGoForward) return;

    try {
      const nextState = await filterHistoryApi.redo(filterHistoryScope, 1);
      await new Promise((resolve) => setTimeout(resolve, 50));
      const newStatus = await filterHistoryApi.getStatus(filterHistoryScope);
      setHistoryStatus(newStatus);

      if (nextState) {
        setDraftFilters(nextState.filters.clauses || []);
        setDraftSortConfig(nextState.sortConfig);
        setFilters(nextState.filters);
        setSortConfig(nextState.sortConfig || null);
      }
    } catch {}
  }, [
    canGoForward,
    setFilters,
    setSortConfig,
    filterHistoryApi,
    filterHistoryScope,
  ]);

  const handleRemoveFilter = (index: number) => {
    setDraftFilters(draftFilters.filter((_, i) => i !== index));
  };

  const handleUpdateFilter = (
    index: number,
    updates: Partial<FilterClause>,
  ) => {
    const updated = draftFilters.map((filter, i) => {
      if (i === index) {
        if (updates.field && updates.field !== filter.field) {
          return { ...filter, ...updates, value: "" };
        }
        return { ...filter, ...updates };
      }
      return filter;
    });
    setDraftFilters(updated);
  };

  // Helper to get field type from schema
  const getFieldType = (fieldName: string): string | null => {
    const field = tableSchema?.fields?.find((f) => f.fieldName === fieldName);
    if (!field) {
      if (fieldName === "_id") return "id";
      if (fieldName === "_creationTime") return "number";
      return null;
    }
    return field.shape?.type || null;
  };

  // Helper to get type indicator
  const getTypeIndicator = (
    fieldName: string,
    value: any,
  ): { prefix: string; color: string } | null => {
    const fieldType = getFieldType(fieldName);

    const getTypeInfo = (
      type: string,
    ): { prefix: string; color: string } | null => {
      const prefixMap: Record<string, string> = {
        string: "str",
        boolean: "bool",
        number: "num",
        bigint: "big",
        null: "null",
        object: "obj",
        array: "arr",
        id: "id",
        bytes: "bytes",
        unset: "?",
      };

      if (type === "float64" || type === "int64") {
        return {
          prefix: type === "float64" ? "num" : "int",
          color: "var(--color-panel-accent)",
        };
      }

      const typeOption = typeOptions.find((opt) => opt.value === type);
      if (typeOption) {
        const prefix = prefixMap[type] || type.slice(0, 3);
        let color = "var(--color-panel-text-muted)";
        if (type === "boolean" || type === "number" || type === "bigint") {
          color = "var(--color-panel-accent)";
        } else if (type === "string") {
          color = "var(--color-panel-error)";
        }
        return { prefix, color };
      }

      return null;
    };

    const isEmptyValue = value === null || value === undefined || value === "";

    if (fieldType) {
      const typeInfo = getTypeInfo(fieldType);
      if (typeInfo) return typeInfo;
    }

    if (isEmptyValue) {
      if (fieldType) {
        const typeInfo = getTypeInfo(fieldType);
        if (typeInfo) return typeInfo;
        return {
          prefix: fieldType.slice(0, 3) || "?",
          color: "var(--color-panel-text-muted)",
        };
      }
      return null;
    }

    const valueType = typeof value;

    if (valueType === "boolean") {
      return { prefix: "bool", color: "var(--color-panel-accent)" };
    } else if (valueType === "number") {
      return { prefix: "num", color: "var(--color-panel-accent)" };
    } else if (valueType === "string") {
      if (fieldType && fieldType !== "string") {
        const typeInfo = getTypeInfo(fieldType);
        if (typeInfo) return typeInfo;
      }
      return { prefix: "str", color: "var(--color-panel-error)" };
    } else if (Array.isArray(value)) {
      return { prefix: "arr", color: "var(--color-panel-text-muted)" };
    } else if (valueType === "object") {
      return { prefix: "obj", color: "var(--color-panel-text-muted)" };
    }

    return null;
  };

  const handleRemoveSort = () => {
    setDraftSortConfig(null);
  };

  const handleSetSort = (field: string, direction: "asc" | "desc") => {
    setDraftSortConfig({ field, direction });
  };

  const handleToggleSortDirection = () => {
    if (draftSortConfig) {
      setDraftSortConfig({
        ...draftSortConfig,
        direction: draftSortConfig.direction === "asc" ? "desc" : "asc",
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleApplyFilters();
  };

  const handleAddFilter = () => {
    const newFilter: FilterClause = {
      field: allFields[0] || "_id",
      op: "eq",
      value: "",
      enabled: true,
    };
    setDraftFilters([...draftFilters, newFilter]);
  };

  const headerLeftContent = (
    <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
      <button
        type="button"
        onClick={handleGoBack}
        disabled={!canGoBack}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "26px",
          height: "26px",
          padding: 0,
          backgroundColor: "transparent",
          border: "none",
          borderRadius: "6px",
          cursor: canGoBack ? "pointer" : "not-allowed",
          color: "var(--color-panel-text-muted)",
          opacity: canGoBack ? 1 : 0.4,
          transition: "all 0.15s ease",
        }}
        onMouseEnter={(e) => {
          if (canGoBack) {
            e.currentTarget.style.backgroundColor =
              "var(--color-panel-bg-tertiary)";
            e.currentTarget.style.color = "var(--color-panel-text)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.color = "var(--color-panel-text-muted)";
        }}
      >
        <ArrowLeft size={14} />
      </button>
      <button
        type="button"
        onClick={handleGoForward}
        disabled={!canGoForward}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "26px",
          height: "26px",
          padding: 0,
          backgroundColor: "transparent",
          border: "none",
          borderRadius: "6px",
          cursor: canGoForward ? "pointer" : "not-allowed",
          color: "var(--color-panel-text-muted)",
          opacity: canGoForward ? 1 : 0.4,
          transition: "all 0.15s ease",
        }}
        onMouseEnter={(e) => {
          if (canGoForward) {
            e.currentTarget.style.backgroundColor =
              "var(--color-panel-bg-tertiary)";
            e.currentTarget.style.color = "var(--color-panel-text)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.color = "var(--color-panel-text-muted)";
        }}
      >
        <ArrowRight size={14} />
      </button>
    </div>
  );

  const footerContent = (
    <button
      type="submit"
      style={{
        width: "100%",
        padding: "8px 10px",
        fontSize: "11px",
        fontWeight: 600,
        color: "var(--color-panel-bg)",
        backgroundColor: "var(--color-panel-accent)",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        transition: "all 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = "0.9";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = "1";
      }}
    >
      Apply Filters
    </button>
  );

  return (
    <SheetLayout
      title="Filter & Sort"
      onClose={onClose}
      asForm
      onSubmit={handleSubmit}
      headerLeft={headerLeftContent}
      contentDataAttribute="data-filter-panel"
      footer={footerContent}
    >
      {/* Field Visibility */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <FieldVisibilityDropdown
          fields={allFields}
          visibleFields={visibleFields}
          onVisibleFieldsChange={(fields) => {
            setVisibleFields(fields);
            onVisibleFieldsChange?.(fields);
          }}
          isOpen={isFieldVisibilityOpen}
          onToggle={() => setIsFieldVisibilityOpen(!isFieldVisibilityOpen)}
          onClose={() => setIsFieldVisibilityOpen(false)}
        />
      </div>

      {/* Sort Section */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <span
          style={{
            fontSize: "11px",
            color: "var(--color-panel-text-muted)",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Sort
        </span>
        {draftSortConfig ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ flex: 1 }}>
              <SearchableDropdown
                selectedValue={draftSortConfig.field}
                options={sortOptions}
                onSelect={(field) =>
                  handleSetSort(field, draftSortConfig.direction)
                }
                placeholder="Select field..."
                searchPlaceholder="Search..."
                emptyStateText="No fields"
                listMaxHeight={280}
              />
            </div>

            <button
              type="button"
              onClick={handleToggleSortDirection}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "0 12px",
                height: "32px",
                backgroundColor: "var(--color-panel-bg-secondary)",
                border: "1px solid var(--color-panel-border)",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 500,
                color: "var(--color-panel-text)",
                cursor: "pointer",
                transition: "all 0.15s ease",
                minWidth: "110px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "var(--color-panel-bg-tertiary)";
                e.currentTarget.style.borderColor =
                  "var(--color-panel-text-muted)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  "var(--color-panel-bg-secondary)";
                e.currentTarget.style.borderColor = "var(--color-panel-border)";
              }}
            >
              {draftSortConfig.direction === "asc" ? (
                <ArrowUpAZ
                  size={14}
                  style={{ color: "var(--color-panel-text-muted)" }}
                />
              ) : (
                <ArrowDownAZ
                  size={14}
                  style={{ color: "var(--color-panel-text-muted)" }}
                />
              )}
              <span>
                {draftSortConfig.direction === "asc" ? "Asc" : "Desc"}
              </span>
            </button>

            <button
              type="button"
              onClick={handleRemoveSort}
              style={{
                padding: "8px",
                color: "var(--color-panel-text-muted)",
                backgroundColor: "transparent",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--color-panel-text)";
                e.currentTarget.style.backgroundColor =
                  "var(--color-panel-bg-tertiary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--color-panel-text-muted)";
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              title="Remove sort"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <SearchableDropdown
            selectedValue={null}
            options={sortOptions}
            onSelect={(field) => handleSetSort(field, "desc")}
            placeholder="Add sort..."
            searchPlaceholder="Search..."
            emptyStateText="No fields"
            listMaxHeight={280}
          />
        )}
      </div>

      {/* Filters Section */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <span
          style={{
            fontSize: "11px",
            color: "var(--color-panel-text-muted)",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Filters
        </span>

        {draftFilters.length === 0 ? (
          <div
            style={{
              padding: "20px",
              color: "var(--color-panel-text-muted)",
              fontSize: "13px",
              textAlign: "center",
              backgroundColor: "var(--color-panel-bg-secondary)",
              border: "1px dashed var(--color-panel-border)",
              borderRadius: "10px",
            }}
          >
            No filters added
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {draftFilters.map((filter, index) => (
              <FilterRow
                key={index}
                filter={filter}
                index={index}
                allFields={allFields}
                onUpdate={handleUpdateFilter}
                onRemove={handleRemoveFilter}
                getTypeIndicator={getTypeIndicator}
              />
            ))}
          </div>
        )}

        {/* Add Filter Button */}
        <button
          type="button"
          onClick={handleAddFilter}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            padding: "10px 16px",
            fontSize: "13px",
            fontWeight: 500,
            color: "var(--color-panel-text-secondary)",
            backgroundColor: "transparent",
            border: "1px dashed var(--color-panel-border)",
            borderRadius: "10px",
            cursor: "pointer",
            transition: "all 0.15s ease",
            marginTop: "4px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--color-panel-accent)";
            e.currentTarget.style.color = "var(--color-panel-text)";
            e.currentTarget.style.backgroundColor =
              "var(--color-panel-bg-secondary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--color-panel-border)";
            e.currentTarget.style.color = "var(--color-panel-text-secondary)";
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <Plus size={16} />
          Add filter
        </button>
      </div>
    </SheetLayout>
  );
};
