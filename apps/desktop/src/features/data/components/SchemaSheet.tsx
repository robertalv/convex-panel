/**
 * SchemaSheet Component
 * Displays table schema information in the side sheet
 */

import {
  X,
  ChevronRight,
  Link,
  Hash,
  Type,
  ToggleLeft,
  Braces,
  List,
} from "lucide-react";
import type { TableSchema, TableField } from "../types";

interface SchemaSheetProps {
  tableName: string;
  schema: TableSchema | null;
  onClose: () => void;
}

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
        field.shape?.fields?.map((nestedField) => (
          <FieldRow
            key={`${field.fieldName}.${nestedField.fieldName}`}
            field={nestedField}
            depth={depth + 1}
          />
        ))}
    </>
  );
}

export function SchemaSheet({ tableName, schema, onClose }: SchemaSheetProps) {
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

  const userFields =
    schema?.fields?.filter(
      (f) => f.fieldName !== "_id" && f.fieldName !== "_creationTime",
    ) || [];

  return (
    <div
      className="flex flex-col h-full"
      style={{ backgroundColor: "var(--color-surface-base)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{
          borderBottom: "1px solid var(--color-border-base)",
          backgroundColor: "var(--color-surface-raised)",
        }}
      >
        <div>
          <h3
            className="text-sm font-medium"
            style={{ color: "var(--color-text-base)" }}
          >
            Schema
          </h3>
          <p
            className="text-xs mt-0.5 font-mono"
            style={{ color: "var(--color-text-muted)" }}
          >
            {tableName}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex items-center justify-center w-7 h-7 rounded transition-colors hover:bg-[var(--color-surface-base)]"
          style={{ color: "var(--color-text-muted)" }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {/* System fields section */}
        <div
          className="px-3 py-2 text-[10px] font-medium uppercase tracking-wider"
          style={{
            color: "var(--color-text-subtle)",
            backgroundColor: "var(--color-surface-raised)",
            borderBottom: "1px solid var(--color-border-base)",
          }}
        >
          System Fields
        </div>
        {systemFields.map((field) => (
          <FieldRow key={field.fieldName} field={field} />
        ))}

        {/* User fields section */}
        {userFields.length > 0 && (
          <>
            <div
              className="px-3 py-2 text-[10px] font-medium uppercase tracking-wider mt-2"
              style={{
                color: "var(--color-text-subtle)",
                backgroundColor: "var(--color-surface-raised)",
                borderBottom: "1px solid var(--color-border-base)",
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
    </div>
  );
}

export default SchemaSheet;
