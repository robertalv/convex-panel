/**
 * SchemaSheet Component
 * Displays table schema information in the side sheet
 * Includes code snippets in both Convex schema and TypeScript interface formats
 */

import { useState, useMemo, useCallback } from "react";
import {
  ChevronRight,
  Link,
  Hash,
  Type,
  ToggleLeft,
  Braces,
  List,
  Copy,
  Check,
} from "lucide-react";
import Editor, { type BeforeMount } from "@monaco-editor/react";
import { useTheme } from "@/contexts/ThemeContext";
import type { TableSchema, TableField } from "../types";
import { ResizableSheet } from "./ResizableSheet";

interface SchemaSheetProps {
  tableName: string;
  schema: TableSchema | null;
  onClose: () => void;
}

type CodeFormat = "convex" | "typescript";

function getTypeIcon(type: string): typeof Type {
  switch (type) {
    case "String":
      return Type;
    case "Number":
    case "Float64":
    case "Int64":
      return Hash;
    case "Boolean":
      return ToggleLeft;
    case "Id":
      return Link;
    case "Object":
      return Braces;
    case "Array":
      return List;
    default:
      return Type;
  }
}

function getTypeColor(type: string): string {
  switch (type) {
    case "String":
      return "var(--color-success-base)";
    case "Number":
    case "Float64":
    case "Int64":
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

function formatTypeName(field: TableField): string {
  const shape = field.shape;

  if (!shape) return "unknown";

  let typeName = shape.type;

  // Handle Id type with table reference
  if (shape.type === "Id" && shape.tableName) {
    typeName = `Id<${shape.tableName}>`;
  }

  // Handle Array type
  if (shape.type === "Array" && shape.shape) {
    if (shape.shape.type === "Id" && shape.shape.tableName) {
      typeName = `Array<Id<${shape.shape.tableName}>>`;
    } else {
      typeName = `Array<${shape.shape.type}>`;
    }
  }

  // Handle Union type
  if (shape.type === "Union" && shape.value) {
    typeName = `Union`;
  }

  // Handle Literal type
  if (shape.type === "Literal" && shape.value !== undefined) {
    typeName = `Literal<${JSON.stringify(shape.value)}>`;
  }

  return typeName;
}

// Generate Convex schema code from fields
function generateConvexSchema(tableName: string, fields: TableField[]): string {
  const lines: string[] = [
    'import { defineTable } from "convex/server";',
    'import { v } from "convex/values";',
    "",
    `export const ${tableName} = defineTable({`,
  ];

  const userFields = fields.filter(
    (f) => f.fieldName !== "_id" && f.fieldName !== "_creationTime",
  );

  for (const field of userFields) {
    const validator = getConvexValidator(field);
    lines.push(`  ${field.fieldName}: ${validator},`);
  }

  lines.push("});");

  return lines.join("\n");
}

// Get Convex validator for a field
function getConvexValidator(field: TableField): string {
  const shape = field.shape;
  let validator = "v.any()";

  if (shape) {
    switch (shape.type) {
      case "String":
        validator = "v.string()";
        break;
      case "Number":
      case "Float64":
        validator = "v.number()";
        break;
      case "Int64":
        validator = "v.int64()";
        break;
      case "Boolean":
        validator = "v.boolean()";
        break;
      case "Id":
        validator = shape.tableName
          ? `v.id("${shape.tableName}")`
          : "v.string()";
        break;
      case "Array":
        if (shape.shape) {
          const innerValidator = getConvexValidatorForShape(shape.shape);
          validator = `v.array(${innerValidator})`;
        } else {
          validator = "v.array(v.any())";
        }
        break;
      case "Object":
        if (shape.fields && shape.fields.length > 0) {
          const objectFields = shape.fields
            .map((f: TableField) => `${f.fieldName}: ${getConvexValidator(f)}`)
            .join(", ");
          validator = `v.object({ ${objectFields} })`;
        } else {
          validator = "v.object({})";
        }
        break;
      case "Null":
        validator = "v.null()";
        break;
      case "Literal":
        validator = `v.literal(${JSON.stringify(shape.value)})`;
        break;
      case "Union":
        validator = "v.union(v.string(), v.number())"; // Simplified
        break;
      default:
        validator = "v.any()";
    }
  }

  if (field.optional) {
    validator = `v.optional(${validator})`;
  }

  return validator;
}

// Get Convex validator for a shape (without optional handling)
function getConvexValidatorForShape(shape: any): string {
  if (!shape) return "v.any()";

  switch (shape.type) {
    case "String":
      return "v.string()";
    case "Number":
    case "Float64":
      return "v.number()";
    case "Int64":
      return "v.int64()";
    case "Boolean":
      return "v.boolean()";
    case "Id":
      return shape.tableName ? `v.id("${shape.tableName}")` : "v.string()";
    case "Array":
      if (shape.shape) {
        return `v.array(${getConvexValidatorForShape(shape.shape)})`;
      }
      return "v.array(v.any())";
    case "Object":
      return "v.object({})";
    case "Null":
      return "v.null()";
    default:
      return "v.any()";
  }
}

// Generate TypeScript interface from fields
function generateTypeScriptInterface(
  tableName: string,
  fields: TableField[],
): string {
  const interfaceName = tableName.charAt(0).toUpperCase() + tableName.slice(1);
  const lines: string[] = [
    `interface ${interfaceName} {`,
    "  _id: string;",
    "  _creationTime: number;",
  ];

  const userFields = fields.filter(
    (f) => f.fieldName !== "_id" && f.fieldName !== "_creationTime",
  );

  for (const field of userFields) {
    const tsType = getTypeScriptType(field);
    const optional = field.optional ? "?" : "";
    lines.push(`  ${field.fieldName}${optional}: ${tsType};`);
  }

  lines.push("}");

  return lines.join("\n");
}

// Get TypeScript type for a field
function getTypeScriptType(field: TableField): string {
  const shape = field.shape;
  if (!shape) return "unknown";

  return getTypeScriptTypeForShape(shape);
}

// Get TypeScript type for a shape
function getTypeScriptTypeForShape(shape: any): string {
  if (!shape) return "unknown";

  switch (shape.type) {
    case "String":
      return "string";
    case "Number":
    case "Float64":
    case "Int64":
      return "number";
    case "Boolean":
      return "boolean";
    case "Id":
      return "string"; // IDs are strings in TypeScript
    case "Array":
      if (shape.shape) {
        return `${getTypeScriptTypeForShape(shape.shape)}[]`;
      }
      return "unknown[]";
    case "Object":
      if (shape.fields && shape.fields.length > 0) {
        const objectFields = shape.fields
          .map((f: TableField) => {
            const opt = f.optional ? "?" : "";
            return `${f.fieldName}${opt}: ${getTypeScriptType(f)}`;
          })
          .join("; ");
        return `{ ${objectFields} }`;
      }
      return "Record<string, unknown>";
    case "Null":
      return "null";
    case "Literal":
      return typeof shape.value === "string"
        ? `"${shape.value}"`
        : String(shape.value);
    case "Union":
      return "string | number"; // Simplified
    default:
      return "unknown";
  }
}

interface FieldRowProps {
  field: TableField;
  depth?: number;
}

function FieldRow({ field, depth = 0 }: FieldRowProps) {
  const Icon = getTypeIcon(field.shape?.type || "unknown");
  const typeColor = getTypeColor(field.shape?.type || "unknown");
  const typeName = formatTypeName(field);
  const hasNestedFields = field.shape?.fields && field.shape.fields.length > 0;

  return (
    <>
      <div
        className="flex items-center gap-2 px-3 py-2 transition-colors hover:bg-[var(--color-surface-raised)]"
        style={{
          paddingLeft: `${12 + depth * 16}px`,
          borderBottom: "1px solid var(--color-border-weak)",
        }}
      >
        {/* Expand indicator for nested fields */}
        {hasNestedFields && (
          <ChevronRight
            size={12}
            style={{ color: "var(--color-text-subtle)" }}
          />
        )}

        {/* Type icon */}
        <Icon size={14} style={{ color: typeColor, flexShrink: 0 }} />

        {/* Field name */}
        <span
          className="font-mono text-xs flex-1 truncate"
          style={{ color: "var(--color-text-base)" }}
        >
          {field.fieldName}
          {field.optional && (
            <span style={{ color: "var(--color-text-subtle)" }}>?</span>
          )}
        </span>

        {/* Type label */}
        <span
          className="text-xs font-mono px-1.5 py-0.5 rounded"
          style={{
            backgroundColor: `${typeColor}20`,
            color: typeColor,
          }}
        >
          {typeName}
        </span>
      </div>

      {/* Render nested fields */}
      {hasNestedFields &&
        field.shape?.fields?.map((nestedField: TableField) => (
          <FieldRow
            key={`${field.fieldName}.${nestedField.fieldName}`}
            field={nestedField}
            depth={depth + 1}
          />
        ))}
    </>
  );
}

// Monaco editor options for code display (read-only)
const editorOptions = {
  readOnly: true,
  automaticLayout: true,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  lineNumbers: "on" as const,
  lineNumbersMinChars: 3,
  lineDecorationsWidth: 0,
  overviewRulerBorder: false,
  renderLineHighlight: "none" as const,
  fontSize: 12,
  fontFamily:
    'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  tabSize: 2,
  wordWrap: "on" as const,
  folding: false,
  scrollbar: {
    vertical: "auto" as const,
    horizontal: "auto" as const,
    verticalScrollbarSize: 8,
    horizontalScrollbarSize: 8,
  },
  padding: { top: 8, bottom: 8 },
};

export function SchemaSheet({ tableName, schema, onClose }: SchemaSheetProps) {
  const [codeFormat, setCodeFormat] = useState<CodeFormat>("convex");
  const [copied, setCopied] = useState(false);
  const { resolvedTheme } = useTheme();

  // System fields that are always present
  const systemFields: TableField[] = [
    {
      fieldName: "_id",
      optional: false,
      shape: { type: "Id", tableName: tableName },
    },
    {
      fieldName: "_creationTime",
      optional: false,
      shape: { type: "Number" },
    },
  ];

  const userFields = useMemo(
    () =>
      schema?.fields?.filter(
        (f) => f.fieldName !== "_id" && f.fieldName !== "_creationTime",
      ) || [],
    [schema],
  );

  // Generate code snippets
  const convexCode = useMemo(
    () => generateConvexSchema(tableName, schema?.fields || []),
    [tableName, schema],
  );

  const typescriptCode = useMemo(
    () => generateTypeScriptInterface(tableName, schema?.fields || []),
    [tableName, schema],
  );

  const currentCode = codeFormat === "convex" ? convexCode : typescriptCode;

  // Configure Monaco before mount
  const handleEditorWillMount: BeforeMount = useCallback((monaco: any) => {
    monaco.editor.defineTheme("convex-light", {
      base: "vs",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#00000000",
      },
    });

    monaco.editor.defineTheme("convex-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#00000000",
      },
    });
  }, []);

  // Handle copy to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [currentCode]);

  return (
    <ResizableSheet
      id="schema-sheet"
      title="Schema"
      subtitle={tableName}
      onClose={onClose}
      defaultWidth={400}
      minWidth={350}
      maxWidth={600}
    >
      {/* Content */}
      <div className="flex-1 overflow-auto">
        {/* System fields section */}
        <div
          className="px-3 py-2 h-[37px] flex items-center text-[10px] font-medium uppercase tracking-wider"
          style={{
            color: "var(--color-text-subtle)",
            backgroundColor: "var(--color-surface-raised)",
            borderBottom: "1px solid var(--color-border-base)",
          }}
        >
          System Fields ({systemFields.length})
        </div>
        {systemFields.map((field) => (
          <FieldRow key={field.fieldName} field={field} />
        ))}

        {/* User fields section */}
        {userFields.length > 0 && (
          <>
            <div
              className="px-4 h-[37px] flex items-center text-[10px] font-medium uppercase tracking-wider"
              style={{
                color: "var(--color-text-subtle)",
                backgroundColor: "var(--color-surface-raised)",
                borderBottom: "1px solid var(--color-border-base)",
                borderTop: "1px solid var(--color-border-base)",
              }}
            >
              Document Fields ({userFields.length})
            </div>
            {userFields.map((field) => (
              <FieldRow key={field.fieldName} field={field} />
            ))}
          </>
        )}

        {/* No schema message */}
        {userFields.length === 0 && (
          <div
            className="px-4 py-8 text-center text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            <p>No schema defined for this table.</p>
            <p className="mt-1" style={{ color: "var(--color-text-subtle)" }}>
              Add documents to see inferred fields.
            </p>
          </div>
        )}

        {/* Code snippet section */}
        <div
          className=""
          style={{ borderTop: "1px solid var(--color-border-base)" }}
        >
          {/* Code header with format toggle */}
          <div
            className="flex items-center justify-between px-4 h-[37px] flex-shrink-0"
            style={{
              backgroundColor: "var(--color-surface-raised)",
              borderBottom: "1px solid var(--color-border-base)",
            }}
          >
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCodeFormat("convex")}
                className="px-2 py-1 text-[10px] font-medium rounded transition-colors"
                style={{
                  backgroundColor:
                    codeFormat === "convex"
                      ? "var(--color-brand-base)"
                      : "transparent",
                  color:
                    codeFormat === "convex"
                      ? "white"
                      : "var(--color-text-muted)",
                }}
              >
                Convex Schema
              </button>
              <button
                onClick={() => setCodeFormat("typescript")}
                className="px-2 py-1 text-[10px] font-medium rounded transition-colors"
                style={{
                  backgroundColor:
                    codeFormat === "typescript"
                      ? "var(--color-brand-base)"
                      : "transparent",
                  color:
                    codeFormat === "typescript"
                      ? "white"
                      : "var(--color-text-muted)",
                }}
              >
                TypeScript
              </button>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded transition-colors hover:bg-[var(--color-surface-base)]"
              style={{ color: "var(--color-text-muted)" }}
            >
              {copied ? (
                <>
                  <Check size={12} />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={12} />
                  Copy
                </>
              )}
            </button>
          </div>

          {/* Code editor */}
          <div
            className="h-[200px]"
            style={{ backgroundColor: "var(--color-surface-base)" }}
          >
            <Editor
              height="100%"
              defaultLanguage="typescript"
              value={currentCode}
              theme={resolvedTheme === "dark" ? "convex-dark" : "convex-light"}
              options={editorOptions}
              beforeMount={handleEditorWillMount}
              loading={
                <div
                  className="flex items-center justify-center h-full"
                  style={{
                    backgroundColor: "var(--color-surface-raised)",
                  }}
                >
                  <span
                    className="text-xs"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    Loading...
                  </span>
                </div>
              }
            />
          </div>
        </div>
      </div>

      {/* Footer with stats */}
      <div
        className="px-4 py-3 text-xs flex-shrink-0"
        style={{
          borderTop: "1px solid var(--color-border-base)",
          backgroundColor: "var(--color-surface-raised)",
          color: "var(--color-text-muted)",
        }}
      >
        <div className="flex items-center justify-between">
          <span>Total fields: {systemFields.length + userFields.length}</span>
          <span>Optional: {userFields.filter((f) => f.optional).length}</span>
        </div>
      </div>
    </ResizableSheet>
  );
}

export default SchemaSheet;
