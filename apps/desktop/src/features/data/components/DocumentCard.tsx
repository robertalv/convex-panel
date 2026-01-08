/**
 * DocumentCard Component
 * Card-style display for a single document in ListView
 * Supports inline editing with type hints
 */

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { TIMESTAMP_COLOR } from "@convex-panel/shared";
import type { TableDocument, TableSchema } from "../types";
import {
  formatValue,
  getValueColor,
  formatTimestamp,
} from "../utils/formatters";
import { DocumentActions } from "./DocumentActions";

interface DocumentCardProps {
  document: TableDocument;
  schema?: TableSchema;
  onEdit?: (documentId: string) => void;
  onClone?: (document: Record<string, any>) => void;
  onDelete?: (documentId: string) => void;
  onPatchDocument?: (
    documentId: string,
    fields: Record<string, any>,
  ) => Promise<void>;
  maxValueLength?: number;
  isSelected?: boolean;
  onSelect?: (docId: string) => void;
}

// Infer type from value for display
function inferType(value: any): string {
  if (value === null) return "Null";
  if (value === undefined) return "Undefined";
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return "Date";
    if (/^[a-f0-9]{24,32}$/i.test(value)) return "ObjectId";
    return "String";
  }
  if (typeof value === "number") {
    if (Number.isInteger(value)) return "Int32";
    return "Double";
  }
  if (typeof value === "boolean") return "Boolean";
  if (Array.isArray(value)) return "Array";
  if (typeof value === "object") return "Object";
  return typeof value;
}

// Get color for type badge
function getTypeColor(type: string): string {
  switch (type) {
    case "String":
      return "var(--color-success-base)";
    case "Int32":
    case "Int64":
    case "Double":
      return "var(--color-info-base)";
    case "Boolean":
      return "var(--color-warning-base)";
    case "Date":
      return "var(--color-brand-base)";
    case "ObjectId":
      return "var(--color-warning-base)";
    case "Array":
      return "var(--color-error-base)";
    case "Object":
      return "var(--color-text-muted)";
    default:
      return "var(--color-text-subtle)";
  }
}

export function DocumentCard({
  document,
  schema,
  onEdit,
  onClone,
  onDelete,
  onPatchDocument,
  maxValueLength = 80,
  isSelected = false,
  onSelect,
}: DocumentCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);

  const handleSelect = useCallback(() => {
    if (onSelect) {
      onSelect(document._id);
    }
  }, [onSelect, document._id]);

  // Get ordered fields: _id first, then schema fields, then other fields, _creationTime last
  const orderedFields = useMemo(() => {
    const schemaFieldNames = schema?.fields?.map((f) => f.fieldName) || [];
    const docFields = Object.keys(document);

    const ordered: string[] = ["_id"];

    // Add schema fields in order (excluding system fields)
    for (const field of schemaFieldNames) {
      if (
        document[field] !== undefined &&
        !ordered.includes(field) &&
        field !== "_creationTime"
      ) {
        ordered.push(field);
      }
    }

    // Add other fields not in schema (excluding system fields)
    for (const field of docFields) {
      if (!ordered.includes(field) && field !== "_creationTime") {
        ordered.push(field);
      }
    }

    // Add _creationTime last if present
    if (document._creationTime !== undefined) {
      ordered.push("_creationTime");
    }

    return ordered;
  }, [document, schema]);

  const toggleExpanded = (field: string) => {
    setExpandedFields((prev) => {
      const next = new Set(prev);
      if (next.has(field)) {
        next.delete(field);
      } else {
        next.add(field);
      }
      return next;
    });
  };

  // Check if field is editable
  const isEditableField = useCallback(
    (field: string) => {
      return (
        onPatchDocument &&
        field !== "_id" &&
        field !== "_creationTime" &&
        (typeof document[field] === "string" ||
          typeof document[field] === "number" ||
          typeof document[field] === "boolean" ||
          document[field] === null)
      );
    },
    [onPatchDocument, document],
  );

  // Start editing a field
  const handleStartEdit = useCallback(
    (field: string, value: any) => {
      if (!isEditableField(field)) return;

      if (typeof value === "string") {
        setEditValue(value); // Just the content, without quotes
      } else if (value === null) {
        setEditValue("null");
      } else {
        setEditValue(String(value));
      }
      setEditingField(field);
    },
    [isEditableField],
  );

  // Cancel editing
  const handleCancelEdit = useCallback(() => {
    setEditingField(null);
    setEditValue("");
  }, []);

  // Save edited value
  const handleSaveEdit = useCallback(async () => {
    if (!onPatchDocument || !editingField) return;

    let parsedValue: any = editValue;
    const originalValue = document[editingField];

    // Parse based on original type
    if (originalValue === null) {
      if (editValue.trim() === "null") {
        parsedValue = null;
      } else {
        // Try to parse as the new type
        if (editValue.trim() === "true") parsedValue = true;
        else if (editValue.trim() === "false") parsedValue = false;
        else if (!isNaN(Number(editValue))) parsedValue = Number(editValue);
        else parsedValue = editValue;
      }
    } else if (typeof originalValue === "string") {
      parsedValue = editValue; // Keep as string
    } else if (typeof originalValue === "number") {
      const num = parseFloat(editValue);
      if (isNaN(num)) return; // Invalid number
      parsedValue = num;
    } else if (typeof originalValue === "boolean") {
      const lower = editValue.toLowerCase();
      if (lower === "true") parsedValue = true;
      else if (lower === "false") parsedValue = false;
      else return; // Invalid boolean
    }

    // Only save if value changed
    if (JSON.stringify(parsedValue) !== JSON.stringify(originalValue)) {
      setIsSaving(true);
      try {
        await onPatchDocument(document._id, {
          [editingField]: parsedValue,
        });
        setEditingField(null);
        setEditValue("");
      } catch (err) {
        console.error("Failed to save:", err);
      } finally {
        setIsSaving(false);
      }
    } else {
      handleCancelEdit();
    }
  }, [onPatchDocument, editingField, editValue, document, handleCancelEdit]);

  // Handle keydown in edit input
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSaveEdit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleCancelEdit();
      }
    },
    [handleSaveEdit, handleCancelEdit],
  );

  // Focus input when editing starts
  useEffect(() => {
    if (editingField && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingField]);

  const renderValue = (field: string, value: any) => {
    const isEditing = editingField === field;
    const isEditable = isEditableField(field);

    // Render editable input
    if (isEditing && isEditable) {
      if (typeof value === "string") {
        return (
          <>
            <span style={{ color: "var(--color-text-muted)" }}>"</span>
            <input
              ref={editInputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={handleKeyDown}
              disabled={isSaving}
              className="bg-transparent border-none outline-none font-mono text-[11px] w-fit focus:ring-0 focus:ring-offset-0 focus:outline-none"
              style={{
                color: getValueColor(value),
                width: `${Math.max(100, editValue.length * 6)}px`,
              }}
              spellCheck={false}
            />
            <span style={{ color: "var(--color-text-muted)" }}>"</span>
          </>
        );
      } else {
        // For numbers, booleans, null
        return (
          <input
            ref={editInputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={handleKeyDown}
            disabled={isSaving}
            className="bg-transparent border-none outline-none font-mono text-[11px] w-fit focus:ring-0 focus:ring-offset-0 focus:outline-none"
            style={{
              color:
                typeof value === "number"
                  ? "rgb(59, 130, 246)"
                  : typeof value === "boolean"
                    ? "rgb(234, 179, 8)"
                    : "var(--color-text-muted)",
              width: `${Math.max(60, editValue.length * 6)}px`,
            }}
          />
        );
      }
    }

    const isExpanded = expandedFields.has(field);
    const valueStr = typeof value === "string" ? value : JSON.stringify(value);
    const needsTruncation = valueStr.length > maxValueLength;

    // Special handling for _creationTime
    if (field === "_creationTime" && typeof value === "number") {
      return (
        <span style={{ color: TIMESTAMP_COLOR }}>
          {formatTimestamp(value)}
        </span>
      );
    }

    // Special handling for _id
    if (field === "_id") {
      return (
        <span
          className="font-mono text-[11px]"
          style={{ color: "var(--color-warning-base)" }}
        >
          {value}
        </span>
      );
    }

    const displayValue =
      isExpanded || !needsTruncation
        ? formatValue(value, 10000)
        : formatValue(value, maxValueLength);

    return (
      <span
        className={
          needsTruncation ? "cursor-pointer" : isEditable ? "cursor-text" : ""
        }
        style={{ color: getValueColor(value) }}
        onClick={() => needsTruncation && toggleExpanded(field)}
        onDoubleClick={() => isEditable && handleStartEdit(field, value)}
        title={
          needsTruncation && !isExpanded
            ? "Click to expand"
            : isEditable
              ? "Double-click to edit"
              : undefined
        }
      >
        {displayValue}
        {needsTruncation && !isExpanded && (
          <span
            className="ml-1 text-[10px]"
            style={{ color: "var(--color-text-muted)" }}
          >
            (click to expand)
          </span>
        )}
      </span>
    );
  };

  return (
    <div
      className="relative rounded-lg transition-all flex items-start gap-2"
      style={{
        backgroundColor: isSelected
          ? "var(--color-brand-base-alpha)"
          : "var(--color-surface-base)",
        border: `1px solid ${isHovered || editingField ? "var(--color-border-strong)" : "var(--color-border-base)"}`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Checkbox */}
      {onSelect && (
        <div className="pt-3 pl-3 flex-shrink-0">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleSelect}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 rounded cursor-pointer"
            style={{ accentColor: "var(--color-brand-base)" }}
          />
        </div>
      )}

      {/* Actions - shown on hover */}
      {isHovered && !editingField && (
        <div
          className="absolute top-2 right-2 z-10"
          style={{
            backgroundColor: isSelected
              ? "var(--color-brand-base-alpha)"
              : "var(--color-surface-base)",
          }}
        >
          <DocumentActions
            documentId={document._id}
            document={document}
            onEdit={onEdit}
            onClone={onClone}
            onDelete={onDelete}
            size="sm"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-3 space-y-1 flex-1">
        {orderedFields.map((field) => {
          const value = document[field];
          if (value === undefined) return null;

          const type = inferType(value);

          return (
            <div key={field} className="flex items-start gap-2 text-xs">
              <span
                className="shrink-0 font-medium"
                style={{ color: "var(--color-text-muted)", minWidth: "100px" }}
              >
                {field}
              </span>
              <span
                className="text-[11px]"
                style={{ color: "var(--color-text-subtle)" }}
              >
                :
              </span>
              <div className="flex-1 break-all font-mono text-[11px]">
                {renderValue(field, value)}
              </div>
              {/* Type hint */}
              <span
                className="shrink-0 text-[10px] ml-2"
                style={{
                  color: getTypeColor(type),
                  minWidth: "50px",
                  textAlign: "right",
                }}
              >
                {type}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default DocumentCard;
