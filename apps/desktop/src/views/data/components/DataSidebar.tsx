/**
 * DataSidebar Component
 * Tree-style sidebar for table selection, matching SchemaTreeSidebar style
 */

import { useState, useMemo, useEffect } from "react";
import {
  Database,
  Table2,
  Search,
  Plus,
  X,
  Clock,
  FileText,
} from "lucide-react";
import type {
  TableDefinition,
  RecentlyViewedTable,
  ConvexComponent,
} from "../types";
import { getRecentlyViewedTables } from "../utils/storage";
import { ComponentSelector } from "@/components/component-selector";
import { Skeleton } from "@/components/ui/skeleton";
import { TreeItem } from "@/components/ui/tree-item";

interface DataSidebarProps {
  tables: TableDefinition;
  selectedTable: string;
  onSelectTable: (tableName: string) => void;
  isLoading: boolean;
  selectedComponent?: string | null;
  onComponentSelect?: (componentId: string | null) => void;
  components?: ConvexComponent[];
  onCreateTable?: (tableName: string) => Promise<void>;
  onOpenSchemaSheet?: () => void;
}

export function DataSidebar({
  tables,
  selectedTable,
  onSelectTable,
  isLoading,
  selectedComponent,
  onComponentSelect,
  components = [],
  onCreateTable,
  onOpenSchemaSheet,
}: DataSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expanded, setExpanded] = useState({
    recentlyViewed: true,
    tables: true,
  });
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedTable[]>(
    [],
  );
  const [isCreatingTable, setIsCreatingTable] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    const recent = getRecentlyViewedTables();
    const validRecent = recent.filter((rv) => tables[rv.name]);
    setRecentlyViewed(validRecent);
  }, [tables]);

  const toggleExpanded = (key: string) => {
    setExpanded((prev) => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev],
    }));
  };

  const filteredTables = useMemo(() => {
    const tableNames = Object.keys(tables);
    if (!searchQuery.trim()) return tableNames;

    const query = searchQuery.toLowerCase();
    return tableNames.filter((name) => name.toLowerCase().includes(query));
  }, [tables, searchQuery]);

  const sortedTables = useMemo(() => {
    return [...filteredTables].sort((a, b) => {
      const aIsSystem = a.startsWith("_");
      const bIsSystem = b.startsWith("_");
      if (aIsSystem && !bIsSystem) return 1;
      if (!aIsSystem && bIsSystem) return -1;
      return a.localeCompare(b);
    });
  }, [filteredTables]);

  const handleCreateTable = async () => {
    if (!newTableName.trim() || !onCreateTable) return;

    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(newTableName)) {
      setCreateError(
        "Table name must start with a letter and contain only letters, numbers, and underscores",
      );
      return;
    }

    if (tables[newTableName]) {
      setCreateError("Table already exists");
      return;
    }

    try {
      await onCreateTable(newTableName);
      setNewTableName("");
      setIsCreatingTable(false);
      setCreateError(null);
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "Failed to create table",
      );
    }
  };

  return (
    <div
      className="flex flex-col h-full w-full"
      style={{
        backgroundColor: "var(--color-surface-background)",
      }}
    >
      {components.length > 1 && (
        <div
          className="p-2 h-[45px] flex items-center"
          style={{ borderBottom: "1px solid var(--color-border-base)" }}
        >
          <ComponentSelector
            selectedComponentId={selectedComponent ?? null}
            onSelect={onComponentSelect ?? (() => {})}
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
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tables..."
            className="w-full pl-8 pr-8 py-1.5 text-xs rounded-md focus:outline-none"
            style={{
              backgroundColor: "var(--color-surface-raised)",
              border: "1px solid var(--color-border-base)",
              color: "var(--color-text-base)",
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 hover:opacity-80"
              style={{ color: "var(--color-text-muted)" }}
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Tree content */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ scrollbarColor: "var(--color-border-strong) transparent" }}
      >
        {/* Recently Viewed section */}
        {recentlyViewed.length > 0 && !searchQuery && (
          <>
            <TreeItem
              label="Recently Viewed"
              icon={
                <Clock size={14} style={{ color: "var(--color-text-muted)" }} />
              }
              depth={0}
              isExpandable
              isExpanded={expanded.recentlyViewed}
              onToggle={() => toggleExpanded("recentlyViewed")}
              rightContent={
                <span className="text-[10px]">{recentlyViewed.length}</span>
              }
            />

            {expanded.recentlyViewed && (
              <>
                {recentlyViewed.map((rv) => (
                  <TreeItem
                    key={`recent-${rv.name}`}
                    label={rv.name}
                    icon={
                      <Table2
                        size={12}
                        style={{
                          color: rv.name.startsWith("_")
                            ? "var(--color-text-subtle)"
                            : "var(--color-info-base)",
                        }}
                      />
                    }
                    depth={1}
                    isSelected={selectedTable === rv.name}
                    onClick={() => onSelectTable(rv.name)}
                    className={rv.name.startsWith("_") ? "opacity-60" : ""}
                  />
                ))}
              </>
            )}

            <div
              className="h-px my-2 mx-2"
              style={{ backgroundColor: "var(--color-border-base)" }}
            />
          </>
        )}

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
            {isLoading ? (
              // Skeleton loading state
              <div className="py-1">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex items-center h-7 text-xs"
                    style={{ paddingLeft: 12 }}
                  >
                    <span className="w-4 mr-1" />
                    <Skeleton
                      className="w-3 h-3 rounded mr-2 shrink-0"
                      style={{ animationDelay: `${index * 0.04}s` }}
                    />
                    <Skeleton
                      className="h-3 rounded flex-1"
                      style={{
                        width: `${60 + (index % 4) * 15}px`,
                        maxWidth: "70%",
                        animationDelay: `${index * 0.04 + 0.02}s`,
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : sortedTables.length === 0 ? (
              <div
                className="px-4 py-2 text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                {searchQuery ? "No tables match search" : "No tables found"}
              </div>
            ) : (
              sortedTables.map((tableName) => {
                const isSystem = tableName.startsWith("_");
                return (
                  <TreeItem
                    key={tableName}
                    label={tableName}
                    icon={
                      <Table2
                        size={12}
                        style={{
                          color: isSystem
                            ? "var(--color-text-subtle)"
                            : "var(--color-info-base)",
                        }}
                      />
                    }
                    depth={1}
                    isSelected={selectedTable === tableName}
                    onClick={() => onSelectTable(tableName)}
                    className={isSystem ? "opacity-60" : ""}
                  />
                );
              })
            )}

            {/* Create table button/form */}
            {onCreateTable && (
              <div className="px-3 py-2">
                {isCreatingTable ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newTableName}
                      onChange={(e) => {
                        setNewTableName(e.target.value);
                        setCreateError(null);
                      }}
                      placeholder="Table name"
                      className="w-full px-2 py-1 text-xs rounded focus:outline-none"
                      style={{
                        backgroundColor: "var(--color-surface-raised)",
                        border: `1px solid ${createError ? "var(--color-error-base)" : "var(--color-border-base)"}`,
                        color: "var(--color-text-base)",
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreateTable();
                        if (e.key === "Escape") {
                          setIsCreatingTable(false);
                          setNewTableName("");
                          setCreateError(null);
                        }
                      }}
                      autoFocus
                    />
                    {createError && (
                      <div
                        className="text-[10px]"
                        style={{ color: "var(--color-error-base)" }}
                      >
                        {createError}
                      </div>
                    )}
                    <div className="flex gap-1">
                      <button
                        onClick={handleCreateTable}
                        className="flex-1 px-2 py-1 text-[10px] rounded transition-colors"
                        style={{
                          backgroundColor: "var(--color-brand-base)",
                          color: "white",
                        }}
                      >
                        Create
                      </button>
                      <button
                        onClick={() => {
                          setIsCreatingTable(false);
                          setNewTableName("");
                          setCreateError(null);
                        }}
                        className="px-2 py-1 text-[10px] rounded transition-colors"
                        style={{
                          backgroundColor: "var(--color-surface-raised)",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsCreatingTable(true)}
                    className="flex items-center gap-1 text-[10px] transition-colors"
                    style={{ color: "var(--color-text-muted)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "var(--color-text-base)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--color-text-muted)";
                    }}
                  >
                    <Plus size={10} />
                    <span>New table</span>
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Stats footer */}
      <div
        className="flex flex-col"
        style={{
          borderTop: "1px solid var(--color-border-base)",
        }}
      >
        {/* Schema button */}
        {onOpenSchemaSheet && (
          <button
            onClick={onOpenSchemaSheet}
            className="w-full p-2 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
            style={{
              color: "var(--color-text-muted)",
              borderBottom: "1px solid var(--color-border-base)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                "var(--color-surface-raised)";
              e.currentTarget.style.color = "var(--color-text-base)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "var(--color-text-muted)";
            }}
          >
            <FileText size={12} />
            <span>View Full Schema</span>
          </button>
        )}

        {/* Stats row */}
        <div
          className="p-2 text-[10px] flex items-center justify-between"
          style={{
            color: "var(--color-text-muted)",
          }}
        >
          <span>{Object.keys(tables).length} tables</span>
          {selectedTable && (
            <span className="truncate max-w-[100px]" title={selectedTable}>
              {selectedTable}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default DataSidebar;
