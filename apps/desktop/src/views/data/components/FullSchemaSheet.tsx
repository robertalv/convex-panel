/**
 * FullSchemaSheet Component
 * Displays the full schema tree view in a resizable sheet
 * Similar to SchemaTreeSidebar from schema-visualizer but adapted for Data view
 */

import { useState, useMemo, useCallback } from "react";
import {
  Database,
  Table2,
  Search,
  X,
  Code2,
  List,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { TreeItem } from "@/components/ui/tree-item";
import { ResizableSheet } from "./ResizableSheet";
import { SchemaCodeViewer } from "./SchemaCodeViewer";
import { openSchemaInEditor } from "@/utils/editor";
import type { TableDefinition } from "../types";

interface FullSchemaSheetProps {
  tables: TableDefinition;
  selectedTable: string;
  onSelectTable: (tableName: string) => void;
  onClose: () => void;
  projectPath?: string | null;
}

interface TreeNodeState {
  [key: string]: boolean;
}

/**
 * Get icon for field type
 */
function getFieldTypeIcon(type: string) {
  switch (type) {
    case "String":
      return "abc";
    case "Float64":
    case "Int64":
    case "Number":
      return "123";
    case "Boolean":
      return "T/F";
    case "Id":
      return "🔗";
    case "Object":
      return "{}";
    case "Array":
      return "[]";
    case "Null":
      return "∅";
    default:
      return "?";
  }
}

function getFieldTypeColor(type: string): string {
  switch (type) {
    case "String":
      return "var(--color-success-base)";
    case "Float64":
    case "Int64":
    case "Number":
      return "var(--color-info-base)";
    case "Boolean":
      return "var(--color-warning-base)";
    case "Id":
      return "var(--color-brand-base)";
    case "Object":
      return "var(--color-text-muted)";
    case "Array":
      return "var(--color-info-base)";
    case "Null":
      return "var(--color-text-subtle)";
    default:
      return "var(--color-text-muted)";
  }
}

export function FullSchemaSheet({
  tables,
  selectedTable,
  onSelectTable,
  onClose,
  projectPath,
}: FullSchemaSheetProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"tree" | "code">("tree");
  const [expanded, setExpanded] = useState<TreeNodeState>({
    tables: true,
  });

  // Handle opening schema.ts in external editor
  const handleOpenInEditor = useCallback(async () => {
    if (!projectPath) {
      toast.error("No project path available", {
        description:
          "Select a project folder in Settings to enable this feature.",
      });
      return;
    }

    try {
      await openSchemaInEditor(projectPath);
    } catch (error) {
      console.error("Failed to open in editor:", error);
      toast.error("Could not open editor", {
        description:
          "Make sure your preferred editor is installed and available in PATH. Check Settings to configure.",
      });
    }
  }, [projectPath]);

  console.log("[FullSchemaSheet] Rendering with:", {
    viewMode,
    tableCount: Object.keys(tables).length,
    selectedTable,
  });

  // Filter tables by search
  const filteredTables = useMemo(() => {
    const tableNames = Object.keys(tables);
    if (!searchQuery.trim()) return tableNames;

    const query = searchQuery.toLowerCase();
    return tableNames.filter((name) => name.toLowerCase().includes(query));
  }, [tables, searchQuery]);

  // Sort tables (user tables first, then system tables)
  const sortedTables = useMemo(() => {
    const sorted = [...filteredTables].sort((a, b) => {
      const aIsSystem = a.startsWith("_");
      const bIsSystem = b.startsWith("_");
      if (aIsSystem && !bIsSystem) return 1;
      if (!aIsSystem && bIsSystem) return -1;
      return a.localeCompare(b);
    });
    console.log("[FullSchemaSheet] Sorted tables:", sorted);
    return sorted;
  }, [filteredTables]);

  const toggleExpanded = (key: string) => {
    setExpanded((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Generate schema code from tables
  const schemaCode = useMemo(() => {
    const lines: string[] = [];
    lines.push('import { defineSchema, defineTable } from "convex/server";');
    lines.push('import { v } from "convex/values";');
    lines.push("");
    lines.push("export default defineSchema({");

    sortedTables.forEach((tableName) => {
      const tableSchema = tables[tableName];
      if (!tableSchema || tableName.startsWith("_")) return; // Skip system tables

      lines.push(`  ${tableName}: defineTable({`);

      // Add fields
      if (tableSchema.fields && tableSchema.fields.length > 0) {
        tableSchema.fields.forEach((field) => {
          if (field.fieldName.startsWith("_")) return; // Skip system fields

          const fieldType = mapShapeToValidator(field.shape);
          const optional = field.optional ? ".optional()" : "";
          lines.push(`    ${field.fieldName}: ${fieldType}${optional},`);
        });
      }

      lines.push(`  }),`);
    });

    lines.push("});");
    const code = lines.join("\n");
    console.log("[FullSchemaSheet] Generated schema code:");
    console.log(code);
    return code;
  }, [sortedTables, tables]);

  // Helper to map shape types to Convex validators
  function mapShapeToValidator(shape: any): string {
    if (!shape) return "v.any()";

    switch (shape.type) {
      case "String":
        return "v.string()";
      case "Float64":
      case "Number":
        return "v.number()";
      case "Int64":
        return "v.int64()";
      case "Boolean":
        return "v.boolean()";
      case "Null":
        return "v.null()";
      case "Id":
        return shape.tableName ? `v.id("${shape.tableName}")` : "v.id()";
      case "Array":
        if (shape.shape) {
          return `v.array(${mapShapeToValidator(shape.shape)})`;
        }
        return "v.array(v.any())";
      case "Object":
        if (shape.fields && shape.fields.length > 0) {
          const fieldStrs = shape.fields
            .filter((f: any) => !f.fieldName.startsWith("_"))
            .map((f: any) => {
              const optional = f.optional ? ".optional()" : "";
              return `${f.fieldName}: ${mapShapeToValidator(f.shape)}${optional}`;
            })
            .join(", ");
          return `v.object({ ${fieldStrs} })`;
        }
        return "v.object({})";
      case "Union":
        if (shape.shapes && shape.shapes.length > 0) {
          const unionTypes = shape.shapes
            .map((s: any) => mapShapeToValidator(s))
            .join(", ");
          return `v.union(${unionTypes})`;
        }
        return "v.any()";
      default:
        return "v.any()";
    }
  }

  return (
    <ResizableSheet
      id="full-schema-sheet"
      side="right"
      defaultWidth={400}
      minWidth={300}
      maxWidth={800}
      title="Schema Explorer"
      subtitle={`${Object.keys(tables).length} tables`}
      onClose={onClose}
      headerActions={
        <div className="flex items-center gap-1">
          {projectPath && (
            <button
              onClick={handleOpenInEditor}
              className="p-1.5 rounded transition-colors"
              style={{
                backgroundColor: "transparent",
                color: "var(--color-text-subtle)",
              }}
              title="Open schema.ts in editor"
            >
              <ExternalLink size={14} />
            </button>
          )}
          <button
            onClick={() => setViewMode("tree")}
            className="p-1.5 rounded transition-colors"
            style={{
              backgroundColor:
                viewMode === "tree"
                  ? "var(--color-surface-raised)"
                  : "transparent",
              color:
                viewMode === "tree"
                  ? "var(--color-text-base)"
                  : "var(--color-text-subtle)",
            }}
            title="Tree view"
          >
            <List size={14} />
          </button>
          <button
            onClick={() => setViewMode("code")}
            className="p-1.5 rounded transition-colors"
            style={{
              backgroundColor:
                viewMode === "code"
                  ? "var(--color-surface-raised)"
                  : "transparent",
              color:
                viewMode === "code"
                  ? "var(--color-text-base)"
                  : "var(--color-text-subtle)",
            }}
            title="Code view"
          >
            <Code2 size={14} />
          </button>
        </div>
      }
    >
      {viewMode === "code" ? (
        /* Code view */
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "var(--color-background-base)",
          }}
        >
          <SchemaCodeViewer
            content={schemaCode}
            language="typescript"
            showLineNumbers={true}
          />
        </div>
      ) : (
        /* Tree view */
        <div
          className="flex flex-col h-full"
          style={{
            backgroundColor: "var(--color-surface-background)",
          }}
        >
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
            {/* Tables section */}
            <TreeItem
              label="Tables"
              icon={
                <Database
                  size={14}
                  style={{ color: "var(--color-text-muted)" }}
                />
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
                {sortedTables.length === 0 ? (
                  <div
                    className="px-4 py-2 text-xs"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {searchQuery ? "No tables match search" : "No tables found"}
                  </div>
                ) : (
                  sortedTables.map((tableName) => {
                    const isSystem = tableName.startsWith("_");
                    const tableSchema = tables[tableName];
                    const isTableExpanded = expanded[`table-${tableName}`];

                    return (
                      <div key={tableName}>
                        {/* Table row */}
                        <TreeItem
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
                          isExpandable={
                            tableSchema?.fields && tableSchema.fields.length > 0
                          }
                          isExpanded={isTableExpanded}
                          onClick={() => onSelectTable(tableName)}
                          onToggle={() => toggleExpanded(`table-${tableName}`)}
                          rightContent={
                            tableSchema?.fields ? (
                              <span className="text-[10px]">
                                {tableSchema.fields.length}
                              </span>
                            ) : null
                          }
                          className={isSystem ? "opacity-60" : ""}
                        />

                        {/* Fields (when expanded) */}
                        {isTableExpanded &&
                          tableSchema?.fields &&
                          tableSchema.fields.length > 0 && (
                            <>
                              {tableSchema.fields.map((field) => {
                                const fieldType =
                                  field.shape?.type || "unknown";
                                const isFieldExpanded =
                                  expanded[
                                    `field-${tableName}-${field.fieldName}`
                                  ];

                                // Check if field has nested fields (Object type)
                                const hasNestedFields =
                                  field.shape?.type === "Object" &&
                                  field.shape?.fields &&
                                  field.shape.fields.length > 0;

                                return (
                                  <div key={field.fieldName}>
                                    {/* Field row */}
                                    <TreeItem
                                      label={field.fieldName}
                                      icon={
                                        <span
                                          className="text-[8px] font-mono font-semibold"
                                          style={{
                                            color: getFieldTypeColor(fieldType),
                                          }}
                                        >
                                          {getFieldTypeIcon(fieldType)}
                                        </span>
                                      }
                                      depth={2}
                                      isExpandable={hasNestedFields}
                                      isExpanded={isFieldExpanded}
                                      onToggle={
                                        hasNestedFields
                                          ? () =>
                                              toggleExpanded(
                                                `field-${tableName}-${field.fieldName}`,
                                              )
                                          : undefined
                                      }
                                      rightContent={
                                        <span
                                          className="text-[9px] font-mono"
                                          style={{
                                            color: getFieldTypeColor(fieldType),
                                          }}
                                        >
                                          {fieldType}
                                          {field.optional && "?"}
                                        </span>
                                      }
                                    />

                                    {/* Nested fields (for Object type) */}
                                    {isFieldExpanded &&
                                      hasNestedFields &&
                                      field.shape?.fields?.map(
                                        (nestedField) => (
                                          <TreeItem
                                            key={nestedField.fieldName}
                                            label={nestedField.fieldName}
                                            icon={
                                              <span
                                                className="text-[8px] font-mono font-semibold"
                                                style={{
                                                  color: getFieldTypeColor(
                                                    nestedField.shape?.type ||
                                                      "unknown",
                                                  ),
                                                }}
                                              >
                                                {getFieldTypeIcon(
                                                  nestedField.shape?.type ||
                                                    "unknown",
                                                )}
                                              </span>
                                            }
                                            depth={3}
                                            rightContent={
                                              <span
                                                className="text-[9px] font-mono"
                                                style={{
                                                  color: getFieldTypeColor(
                                                    nestedField.shape?.type ||
                                                      "unknown",
                                                  ),
                                                }}
                                              >
                                                {nestedField.shape?.type ||
                                                  "unknown"}
                                                {nestedField.optional && "?"}
                                              </span>
                                            }
                                          />
                                        ),
                                      )}
                                  </div>
                                );
                              })}
                            </>
                          )}
                      </div>
                    );
                  })
                )}
              </>
            )}
          </div>

          {/* Stats footer */}
          <div
            className="p-2 text-[10px] flex items-center justify-between"
            style={{
              borderTop: "1px solid var(--color-border-base)",
              color: "var(--color-text-muted)",
            }}
          >
            <span>{Object.keys(tables).length} tables total</span>
            {selectedTable && (
              <span className="truncate max-w-[150px]" title={selectedTable}>
                {selectedTable}
              </span>
            )}
          </div>
        </div>
      )}
    </ResizableSheet>
  );
}

export default FullSchemaSheet;
