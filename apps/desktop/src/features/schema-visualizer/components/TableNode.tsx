/**
 * TableNode Component
 * Custom node for rendering tables in the schema visualization graph
 */

import { memo, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  ChevronDown,
  ChevronRight,
  Key,
  Link,
  Search,
  Database,
  Box,
  AlertTriangle,
  ExternalLink,
  LayoutDashboard,
  MoreVertical,
} from "lucide-react";
import type {
  SchemaTable,
  SchemaField,
  DiffStatus,
  FieldDiff,
  IndexDiff,
} from "../types";
import { formatFieldType, getFieldTypeShort } from "../utils/schema-parser";

interface TableNodeData {
  table: SchemaTable;
  isSelected?: boolean;
  isHighlighted?: boolean;
  showFields?: boolean;
  showIndexes?: boolean;
  moduleColor?: string;
  hasWarnings?: boolean;
  onSelect?: (tableName: string) => void;
  onNavigateToData?: (tableName: string) => void;
  onOpenInCursor?: (tableName: string) => void;
  // Diff mode props
  diffStatus?: DiffStatus;
  fieldDiffs?: FieldDiff[];
  indexDiffs?: IndexDiff[];
}

const typeColors: Record<string, string> = {
  id: "#f59e0b",
  string: "#10b981",
  number: "#3b82f6",
  boolean: "#8b5cf6",
  array: "#06b6d4",
  object: "#ec4899",
  union: "#f97316",
  any: "#6b7280",
  null: "#9ca3af",
  bigint: "#6366f1",
  bytes: "#14b8a6",
  literal: "#d946ef",
  record: "#0ea5e9",
};

// Diff status colors - matching DIFF_COLORS from types
const diffStatusColors: Record<
  DiffStatus,
  { border: string; bg: string; text: string }
> = {
  added: { border: "#22c55e", bg: "#22c55e15", text: "#22c55e" },
  removed: { border: "#ef4444", bg: "#ef444415", text: "#ef4444" },
  modified: { border: "#f59e0b", bg: "#f59e0b15", text: "#f59e0b" },
  unchanged: {
    border: "var(--color-border-base)",
    bg: "transparent",
    text: "var(--color-text-muted)",
  },
};

// Diff status labels
const diffStatusLabels: Record<DiffStatus, string> = {
  added: "+",
  removed: "-",
  modified: "~",
  unchanged: "",
};

function FieldRow({
  field,
  isReference,
  diffStatus,
}: {
  field: SchemaField;
  isReference: boolean;
  diffStatus?: DiffStatus;
}) {
  const typeColor = typeColors[field.type] || typeColors.any;
  const shortType = getFieldTypeShort(field);
  const hasDiff = diffStatus && diffStatus !== "unchanged";
  const diffColor = diffStatus ? diffStatusColors[diffStatus] : null;

  return (
    <div
      className="flex items-center gap-2 px-3 py-1 text-xs transition-colors rounded"
      title={formatFieldType(field)}
      style={{
        color: field.optional
          ? "var(--color-text-muted)"
          : "var(--color-text-base)",
        backgroundColor: hasDiff ? diffColor?.bg : undefined,
        borderLeft: hasDiff ? `2px solid ${diffColor?.border}` : undefined,
      }}
      onMouseEnter={(e) => {
        if (!hasDiff) {
          e.currentTarget.style.backgroundColor = "var(--color-surface-raised)";
        }
      }}
      onMouseLeave={(e) => {
        if (!hasDiff) {
          e.currentTarget.style.backgroundColor = "transparent";
        } else if (diffColor) {
          e.currentTarget.style.backgroundColor = diffColor.bg;
        }
      }}
    >
      {/* Diff status indicator */}
      {hasDiff && diffColor && (
        <span
          className="flex-shrink-0 font-mono font-bold text-[10px]"
          style={{ color: diffColor.text, width: "10px" }}
        >
          {diffStatusLabels[diffStatus!]}
        </span>
      )}
      {isReference ? (
        <Link
          size={10}
          className="flex-shrink-0"
          style={{ color: "var(--color-warning-base)" }}
        />
      ) : (
        !hasDiff && <div className="w-2.5" />
      )}
      <span className="flex-1 truncate">
        {field.name}
        {field.optional && "?"}
      </span>
      <span
        className="px-1.5 py-0.5 rounded text-[10px] font-mono"
        style={{
          backgroundColor: `${typeColor}20`,
          color: typeColor,
        }}
      >
        {shortType}
      </span>
    </div>
  );
}

function IndexRow({
  name,
  type,
  staged,
  diffStatus,
}: {
  name: string;
  type: "db" | "search" | "vector";
  staged?: boolean;
  diffStatus?: DiffStatus;
}) {
  const Icon = type === "search" ? Search : type === "vector" ? Box : Key;
  // Use theme-aware colors with fallback to specific colors for index types
  const color =
    type === "search"
      ? "var(--color-info-base)"
      : type === "vector"
        ? "#8b5cf6"
        : "var(--color-warning-base)";

  const hasDiff = diffStatus && diffStatus !== "unchanged";
  const diffColor = diffStatus ? diffStatusColors[diffStatus] : null;

  return (
    <div
      className="flex items-center gap-2 px-3 py-1 text-xs transition-colors rounded"
      style={{
        backgroundColor: hasDiff ? diffColor?.bg : undefined,
        borderLeft: hasDiff ? `2px solid ${diffColor?.border}` : undefined,
      }}
      onMouseEnter={(e) => {
        if (!hasDiff) {
          e.currentTarget.style.backgroundColor = "var(--color-surface-raised)";
        }
      }}
      onMouseLeave={(e) => {
        if (!hasDiff) {
          e.currentTarget.style.backgroundColor = "transparent";
        } else if (diffColor) {
          e.currentTarget.style.backgroundColor = diffColor.bg;
        }
      }}
    >
      {/* Diff status indicator */}
      {hasDiff && diffColor && (
        <span
          className="flex-shrink-0 font-mono font-bold text-[10px]"
          style={{ color: diffColor.text, width: "10px" }}
        >
          {diffStatusLabels[diffStatus!]}
        </span>
      )}
      <Icon size={10} style={{ color }} className="flex-shrink-0" />
      <span
        className="flex-1 truncate"
        style={{
          color: staged
            ? "var(--color-text-subtle)"
            : "var(--color-text-muted)",
        }}
      >
        {name}
        {staged && " (staged)"}
      </span>
      <span
        className="px-1.5 py-0.5 rounded text-[10px]"
        style={{
          backgroundColor: `${color}20`,
          color,
        }}
      >
        {type}
      </span>
    </div>
  );
}

/**
 * Context menu for table actions - rendered via portal to avoid React Flow transform issues
 */
function TableContextMenu({
  tableName,
  position,
  onClose,
  onNavigateToData,
  onOpenInCursor,
}: {
  tableName: string;
  position: { x: number; y: number };
  onClose: () => void;
  onNavigateToData?: (tableName: string) => void;
  onOpenInCursor?: (tableName: string) => void;
}) {
  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50" onClick={onClose} />
      {/* Menu */}
      <div
        className="fixed z-50 min-w-[160px] rounded-lg shadow-xl py-1 overflow-hidden animate-scale-in"
        style={{
          left: position.x,
          top: position.y,
          backgroundColor: "var(--color-surface-overlay)",
          border: "1px solid var(--color-border-base)",
        }}
      >
        {onNavigateToData && (
          <button
            onClick={() => {
              onNavigateToData(tableName);
              onClose();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors"
            style={{
              color: "var(--color-text-base)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                "var(--color-surface-raised)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <LayoutDashboard size={12} />
            Open in Data View
          </button>
        )}
        {onOpenInCursor && (
          <button
            onClick={() => {
              onOpenInCursor(tableName);
              onClose();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors"
            style={{
              color: "var(--color-text-base)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                "var(--color-surface-raised)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <ExternalLink size={12} />
            Open in Cursor
          </button>
        )}
        {!onNavigateToData && !onOpenInCursor && (
          <div
            className="px-3 py-2 text-xs italic"
            style={{ color: "var(--color-text-subtle)" }}
          >
            No actions available
          </div>
        )}
      </div>
    </>,
    document.body,
  );
}

function TableNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as unknown as TableNodeData;
  const {
    table,
    isHighlighted,
    showFields = true,
    showIndexes = true,
    moduleColor,
    hasWarnings,
    onSelect,
    onNavigateToData,
    onOpenInCursor,
    diffStatus,
    fieldDiffs,
    indexDiffs,
  } = nodeData;
  const [isExpanded, setIsExpanded] = useState(true);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Create a map of field diffs for quick lookup
  const fieldDiffMap = new Map(
    fieldDiffs?.map((fd) => [fd.fieldName, fd]) ?? [],
  );
  const indexDiffMap = new Map(
    indexDiffs?.map((id) => [id.indexName, id]) ?? [],
  );

  // Check if we're in diff mode (table has a diff status)
  const hasDiffStatus = diffStatus && diffStatus !== "unchanged";
  const diffColor = diffStatus ? diffStatusColors[diffStatus] : null;

  const referenceFields = table.fields.filter(
    (f) =>
      f.type === "id" ||
      (f.type === "array" && f.arrayElementType?.type === "id"),
  );
  const regularFields = table.fields.filter(
    (f) =>
      f.type !== "id" &&
      !(f.type === "array" && f.arrayElementType?.type === "id"),
  );

  const displayFields = [...referenceFields, ...regularFields].slice(0, 8);
  const hiddenFieldCount = table.fields.length - displayFields.length;

  const displayIndexes = table.indexes.slice(0, 3);
  const hiddenIndexCount = table.indexes.length - displayIndexes.length;

  // Determine border color - diff status takes priority if in diff mode
  const borderColor = hasDiffStatus
    ? diffColor?.border
    : selected
      ? "var(--color-brand-base)"
      : isHighlighted
        ? "var(--color-warning-base)"
        : moduleColor || "var(--color-border-base)";

  const handleClick = () => {
    onSelect?.(table.name);
  };

  const handleDoubleClick = () => {
    onNavigateToData?.(table.name);
  };

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMoreClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenu({ x: rect.right, y: rect.bottom });
  }, []);

  return (
    <>
      <div
        className="relative overflow-hidden transition-all duration-20"
        style={{
          backgroundColor: hasDiffStatus
            ? diffColor?.bg
            : "var(--color-surface-raised)",
          borderWidth: hasDiffStatus ? 3 : 2,
          borderStyle: "solid",
          borderColor,
          borderRadius: "var(--radius)",
          minWidth: 240,
          maxWidth: 300,
          opacity: isHighlighted === false ? 0.4 : 1,
          boxShadow: hasDiffStatus
            ? `0 0 12px ${diffColor?.border}40`
            : "var(--shadow-lg)",
        }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
      >
        {/* Diff status badge */}
        {hasDiffStatus && diffColor && (
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              padding: "2px 8px",
              fontSize: "10px",
              fontWeight: 600,
              textTransform: "uppercase",
              backgroundColor: diffColor.border,
              color: "white",
              borderBottomLeftRadius: "8px",
              zIndex: 10,
            }}
          >
            {diffStatus}
          </div>
        )}

        {/* Connection handles for React Flow edges */}
        <Handle
          type="target"
          position={Position.Left}
          id="target"
          style={{
            width: 12,
            height: 12,
            backgroundColor: hasDiffStatus
              ? diffColor?.border
              : "var(--color-border-strong)",
            border: "2px solid var(--color-surface-raised)",
          }}
        />
        <Handle
          type="source"
          position={Position.Right}
          id="source"
          style={{
            width: 12,
            height: 12,
            backgroundColor: hasDiffStatus
              ? diffColor?.border
              : "var(--color-border-strong)",
            border: "2px solid var(--color-surface-raised)",
          }}
        />

        {/* Header */}
        <div
          className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none"
          style={{
            backgroundColor: hasDiffStatus
              ? diffColor?.bg
              : moduleColor
                ? `${moduleColor}15`
                : undefined,
          }}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          <button
            className="transition-colors"
            style={{ color: "var(--color-text-muted)" }}
          >
            {isExpanded ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
          </button>
          <Database
            size={14}
            style={{ color: moduleColor || "var(--color-text-subtle)" }}
            className="flex-shrink-0"
          />
          <span
            className="flex-1 font-medium text-sm truncate font-mono"
            style={{ color: "var(--color-text-base)" }}
          >
            {table.name}
          </span>
          {hasWarnings && (
            <AlertTriangle
              size={12}
              className="flex-shrink-0"
              style={{ color: "var(--color-warning-base)" }}
            />
          )}
          {table.isSystem && (
            <span
              className="px-1.5 py-0.5 rounded text-[10px]"
              style={{
                backgroundColor: "var(--color-surface-raised)",
                color: "var(--color-text-subtle)",
              }}
            >
              system
            </span>
          )}
          {/* More actions button */}
          <button
            onClick={handleMoreClick}
            className="p-0.5 rounded transition-colors"
            style={{ color: "var(--color-text-subtle)" }}
            title="More actions"
          >
            <MoreVertical size={12} />
          </button>
        </div>

        {/* Content */}
        {isExpanded && (
          <div style={{ borderTop: "1px solid var(--color-border-base)" }}>
            {/* Fields */}
            {showFields && displayFields.length > 0 && (
              <div className="py-1 px-1 space-y-1">
                {displayFields.map((field) => (
                  <FieldRow
                    key={field.name}
                    field={field}
                    isReference={
                      field.type === "id" ||
                      (field.type === "array" &&
                        field.arrayElementType?.type === "id")
                    }
                    diffStatus={fieldDiffMap.get(field.name)?.status}
                  />
                ))}
                {hiddenFieldCount > 0 && (
                  <div
                    className="px-3 py-1 text-[10px] italic"
                    style={{ color: "var(--color-text-subtle)" }}
                  >
                    +{hiddenFieldCount} more field
                    {hiddenFieldCount > 1 ? "s" : ""}
                  </div>
                )}
              </div>
            )}

            {/* Indexes */}
            {showIndexes && displayIndexes.length > 0 && (
              <div
                className="py-1"
                style={{ borderTop: "1px solid var(--color-border-base)" }}
              >
                <div
                  className="px-3 py-1 text-[10px] uppercase tracking-wide"
                  style={{ color: "var(--color-text-subtle)" }}
                >
                  Indexes
                </div>
                <div className="px-1 space-y-1">
                {displayIndexes.map((index) => (
                  <IndexRow
                    key={index.name}
                    name={index.name}
                    type={index.type}
                    staged={index.staged}
                    diffStatus={indexDiffMap.get(index.name)?.status}
                  />
                ))}
                </div>
                {hiddenIndexCount > 0 && (
                  <div
                    className="px-3 py-1 text-[10px] italic"
                    style={{ color: "var(--color-text-subtle)" }}
                  >
                    +{hiddenIndexCount} more index
                    {hiddenIndexCount > 1 ? "es" : ""}
                  </div>
                )}
              </div>
            )}

            {/* Empty state */}
            {table.fields.length === 0 && table.indexes.length === 0 && (
              <div
                className="px-3 py-3 text-xs italic text-center"
                style={{ color: "var(--color-text-subtle)" }}
              >
                No schema defined
              </div>
            )}
          </div>
        )}

        {/* Stats footer when collapsed */}
        {!isExpanded && (
          <div
            className="px-3 py-1.5 text-[10px] flex items-center gap-3"
            style={{
              color: "var(--color-text-subtle)",
              borderTop: "1px solid var(--color-border-base)",
            }}
          >
            <span>{table.fields.length} fields</span>
            {table.indexes.length > 0 && (
              <span>{table.indexes.length} indexes</span>
            )}
            {referenceFields.length > 0 && (
              <span style={{ color: "var(--color-warning-base)" }}>
                {referenceFields.length} refs
              </span>
            )}
          </div>
        )}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <TableContextMenu
          tableName={table.name}
          position={contextMenu}
          onClose={() => setContextMenu(null)}
          onNavigateToData={onNavigateToData}
          onOpenInCursor={onOpenInCursor}
        />
      )}
    </>
  );
}

export const TableNode = memo(TableNodeComponent);
