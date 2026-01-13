/**
 * SchemaTreeSidebar Component
 * Collapsible tree view showing tables, columns, indexes, and views/presets
 * Uses ResizableSheet for slide-out sheet functionality
 */

import { useState, useMemo } from "react";
import {
  Database,
  Table2,
  Columns3,
  Key,
  Search,
  Box,
  Eye,
  Filter,
  Calculator,
  Plus,
  X,
} from "lucide-react";
import { ComponentSelector } from "@/components/component-selector";
import { TreeItem } from "@/components/ui/tree-item";
import type { ConvexComponent } from "@/types/desktop";
import type { ParsedSchema } from "../types";

interface SchemaTreeSidebarProps {
  schema: ParsedSchema | null;
  selectedTable: string | null;
  onSelectTable: (tableName: string | null) => void;
  onNavigateToData?: (tableName: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterPresets?: FilterPreset[];
  aggregations?: AggregationDef[];
  onAddFilterPreset?: () => void;
  onAddAggregation?: () => void;
  onSelectFilterPreset?: (preset: FilterPreset) => void;
  onSelectAggregation?: (agg: AggregationDef) => void;
  /** Component selection - selected component ID (null = root app) */
  selectedComponentId?: string | null;
  /** Called when component changes - receives component ID (null = root app) */
  onComponentSelect?: (componentId: string | null) => void;
  /** List of available components (ConvexComponent objects) */
  components?: ConvexComponent[];
  /** Whether the sidebar is open */
  isOpen?: boolean;
}

export interface FilterPreset {
  id: string;
  name: string;
  tableName: string;
  filters: any;
}

export interface AggregationDef {
  id: string;
  name: string;
  tableName: string;
  type: "count" | "sum" | "avg" | "min" | "max";
  field?: string;
}

interface TreeNodeState {
  tables: boolean;
  views: boolean;
  [key: string]: boolean;
}

/**
 * Get icon for index type
 */
function IndexIcon({ type }: { type: "db" | "search" | "vector" }) {
  switch (type) {
    case "search":
      return <Search size={12} style={{ color: "var(--color-info-base)" }} />;
    case "vector":
      return <Box size={12} style={{ color: "var(--color-brand-base)" }} />;
    default:
      return <Key size={12} style={{ color: "var(--color-warning-base)" }} />;
  }
}

export function SchemaTreeSidebar({
  schema,
  selectedTable,
  onSelectTable,
  searchQuery,
  onSearchChange,
  filterPresets = [],
  aggregations = [],
  onAddFilterPreset,
  onAddAggregation,
  onSelectFilterPreset,
  onSelectAggregation,
  selectedComponentId,
  onComponentSelect,
  components = [],
  isOpen = true,
}: SchemaTreeSidebarProps) {
  // Track expanded state for each node
  const [expanded, setExpanded] = useState<TreeNodeState>({
    tables: true,
    views: true,
  });

  const toggleExpanded = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Filter tables based on search query
  const filteredTables = useMemo(() => {
    if (!schema) return [];
    const tables = Array.from(schema.tables.values());

    if (!searchQuery.trim()) return tables;

    const query = searchQuery.toLowerCase();
    return tables.filter((table) => {
      // Match table name
      if (table.name.toLowerCase().includes(query)) return true;
      // Match field names
      if (table.fields.some((f) => f.name.toLowerCase().includes(query)))
        return true;
      // Match index names
      if (table.indexes.some((i) => i.name.toLowerCase().includes(query)))
        return true;
      return false;
    });
  }, [schema, searchQuery]);

  // Sort tables: user tables first, then system tables
  const sortedTables = useMemo(() => {
    return [...filteredTables].sort((a, b) => {
      if (a.isSystem && !b.isSystem) return 1;
      if (!a.isSystem && b.isSystem) return -1;
      return a.name.localeCompare(b.name);
    });
  }, [filteredTables]);

  // Filter views/presets based on search
  const filteredPresets = useMemo(() => {
    if (!searchQuery.trim()) return filterPresets;
    const query = searchQuery.toLowerCase();
    return filterPresets.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.tableName.toLowerCase().includes(query),
    );
  }, [filterPresets, searchQuery]);

  const filteredAggregations = useMemo(() => {
    if (!searchQuery.trim()) return aggregations;
    const query = searchQuery.toLowerCase();
    return aggregations.filter(
      (a) =>
        a.name.toLowerCase().includes(query) ||
        a.tableName.toLowerCase().includes(query),
    );
  }, [aggregations, searchQuery]);

  const hasViews =
    filteredPresets.length > 0 ||
    filteredAggregations.length > 0 ||
    onAddFilterPreset ||
    onAddAggregation;

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Component selector - only show when multiple components exist */}
      {components.length > 1 && (
        <div
          className="p-2"
          style={{ borderBottom: "1px solid var(--color-border-base)" }}
        >
          <ComponentSelector
            selectedComponentId={selectedComponentId ?? null}
            onSelect={onComponentSelect || (() => {})}
            components={components}
            fullWidth
            variant="input"
          />
        </div>
      )}

      {/* Search input */}
      <div
        className="p-2"
        style={{ borderBottom: "1px solid var(--color-border-base)" }}
      >
        <div className="relative">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2"
            style={{ color: "var(--color-text-muted)" }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search..."
            className="w-full pl-8 pr-8 py-1.5 text-xs rounded-md focus:outline-none"
            style={{
              backgroundColor: "var(--color-surface-raised)",
              border: "1px solid var(--color-border-base)",
              color: "var(--color-text-base)",
            }}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2"
              style={{ color: "var(--color-text-muted)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--color-text-base)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--color-text-muted)";
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Tree content */}
      <div
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent"
        style={{ scrollbarColor: "var(--color-border-strong) transparent" }}
      >
        {/* Tables section */}
        <TreeItem
          label="Tables"
          icon={
            <Database size={14} style={{ color: "var(--color-text-muted)" }} />
          }
          depth={0}
          isExpandable
          isExpanded={expanded.tables}
          onToggle={() => toggleExpanded("tables")}
          rightContent={
            <span className="text-[10px]">{sortedTables.length}</span>
          }
        />

        {expanded.tables && (
          <>
            {sortedTables.map((table) => {
              const tableKey = `table-${table.name}`;
              const columnsKey = `columns-${table.name}`;
              const indexesKey = `indexes-${table.name}`;
              const isTableSelected = selectedTable === table.name;

              return (
                <div key={table.name}>
                  {/* Table row */}
                  <TreeItem
                    label={table.name}
                    icon={
                      <Table2
                        size={12}
                        style={{
                          color: table.isSystem
                            ? "var(--color-text-subtle)"
                            : "var(--color-info-base)",
                        }}
                      />
                    }
                    depth={1}
                    isExpandable
                    isExpanded={expanded[tableKey]}
                    isSelected={isTableSelected}
                    onClick={() => onSelectTable(table.name)}
                    onToggle={() => toggleExpanded(tableKey)}
                    className={table.isSystem ? "opacity-60" : ""}
                  />

                  {expanded[tableKey] && (
                    <>
                      {/* Columns section */}
                      <TreeItem
                        label="Columns"
                        icon={
                          <Columns3
                            size={11}
                            style={{ color: "var(--color-text-muted)" }}
                          />
                        }
                        depth={2}
                        isExpandable
                        isExpanded={expanded[columnsKey]}
                        onToggle={() => toggleExpanded(columnsKey)}
                        rightContent={
                          <span className="text-[10px]">
                            {table.fields.length}
                          </span>
                        }
                      />

                      {expanded[columnsKey] && (
                        <>
                          {table.fields.map((field) => (
                            <TreeItem
                              key={field.name}
                              label={field.name}
                              icon={
                                field.type === "id" ? (
                                  <Key
                                    size={10}
                                    style={{
                                      color: "var(--color-warning-base)",
                                    }}
                                  />
                                ) : undefined
                              }
                              depth={3}
                              rightContent={
                                <span
                                  className="text-[10px] font-mono"
                                  style={{
                                    color: "var(--color-text-subtle)",
                                  }}
                                >
                                  {field.type}
                                </span>
                              }
                            />
                          ))}
                        </>
                      )}

                      {/* Indexes section */}
                      {table.indexes.length > 0 && (
                        <>
                          <TreeItem
                            label="Indexes"
                            icon={
                              <Key
                                size={11}
                                style={{ color: "var(--color-text-muted)" }}
                              />
                            }
                            depth={2}
                            isExpandable
                            isExpanded={expanded[indexesKey]}
                            onToggle={() => toggleExpanded(indexesKey)}
                            rightContent={
                              <span className="text-[10px]">
                                {table.indexes.length}
                              </span>
                            }
                          />

                          {expanded[indexesKey] && (
                            <>
                              {table.indexes.map((index) => (
                                <TreeItem
                                  key={index.name}
                                  label={index.name}
                                  icon={<IndexIcon type={index.type} />}
                                  depth={3}
                                  rightContent={
                                    index.staged ? (
                                      <span
                                        className="text-[9px] px-1 py-0.5 rounded"
                                        style={{
                                          backgroundColor:
                                            "color-mix(in srgb, var(--color-warning-base) 20%, transparent)",
                                          color: "var(--color-warning-base)",
                                        }}
                                      >
                                        staged
                                      </span>
                                    ) : undefined
                                  }
                                />
                              ))}
                            </>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </>
        )}

        {/* Views section (Filter Presets & Aggregations) */}
        {hasViews && (
          <>
            <div
              className="h-px my-2"
              style={{ backgroundColor: "var(--color-border-base)" }}
            />

            <TreeItem
              label="Views"
              icon={
                <Eye size={14} style={{ color: "var(--color-text-muted)" }} />
              }
              depth={0}
              isExpandable
              isExpanded={expanded.views}
              onToggle={() => toggleExpanded("views")}
            />

            {expanded.views && (
              <>
                {/* Filter Presets */}
                {filteredPresets.map((preset) => (
                  <TreeItem
                    key={preset.id}
                    label={preset.name}
                    icon={
                      <Filter
                        size={12}
                        style={{ color: "var(--color-success-base)" }}
                      />
                    }
                    depth={1}
                    onClick={() => onSelectFilterPreset?.(preset)}
                    rightContent={
                      <span
                        className="text-[10px]"
                        style={{ color: "var(--color-text-subtle)" }}
                      >
                        {preset.tableName}
                      </span>
                    }
                  />
                ))}

                {/* Aggregations */}
                {filteredAggregations.map((agg) => (
                  <TreeItem
                    key={agg.id}
                    label={agg.name}
                    icon={
                      <Calculator
                        size={12}
                        style={{ color: "var(--color-brand-base)" }}
                      />
                    }
                    depth={1}
                    onClick={() => onSelectAggregation?.(agg)}
                    rightContent={
                      <span
                        className="text-[10px]"
                        style={{ color: "var(--color-text-subtle)" }}
                      >
                        {agg.type}
                      </span>
                    }
                  />
                ))}

                {/* Add buttons */}
                {(onAddFilterPreset || onAddAggregation) && (
                  <div className="flex gap-1 px-4 py-2">
                    {onAddFilterPreset && (
                      <button
                        onClick={onAddFilterPreset}
                        className="flex items-center gap-1 px-2 py-1 text-[10px] rounded transition-colors"
                        style={{ color: "var(--color-text-muted)" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color =
                            "var(--color-text-base)";
                          e.currentTarget.style.backgroundColor =
                            "var(--color-surface-raised)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color =
                            "var(--color-text-muted)";
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <Plus size={10} />
                        Filter
                      </button>
                    )}
                    {onAddAggregation && (
                      <button
                        onClick={onAddAggregation}
                        className="flex items-center gap-1 px-2 py-1 text-[10px] rounded transition-colors"
                        style={{ color: "var(--color-text-muted)" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color =
                            "var(--color-text-base)";
                          e.currentTarget.style.backgroundColor =
                            "var(--color-surface-raised)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color =
                            "var(--color-text-muted)";
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <Plus size={10} />
                        Aggregate
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Stats footer */}
      {schema && (
        <div
          className="p-2 text-[10px] flex items-center justify-between"
          style={{
            borderTop: "1px solid var(--color-border-base)",
            color: "var(--color-text-muted)",
          }}
        >
          <span>{schema.tables.size} tables</span>
          <span>{schema.relationships.length} relations</span>
          <span>{schema.health.indexCount} indexes</span>
        </div>
      )}
    </div>
  );
}

export default SchemaTreeSidebar;
