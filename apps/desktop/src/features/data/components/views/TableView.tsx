/**
 * TableView Component
 * Table grid view for documents with column resizing, selection, and inline editing
 * Styled to match @packages/panel data table
 */

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Loader2, MoreVertical, ArrowUp, ArrowDown } from "lucide-react";
import { TIMESTAMP_COLOR } from "@convex-panel/shared";
import type { TableDocument, TableSchema, SortConfig } from "../../types";
import {
  formatValue,
  getValueColor,
  formatTimestamp,
  isConvexId,
} from "../../utils/formatters";
import {
  getColumnWidths,
  saveColumnWidths,
  getColumnOrder,
  saveColumnOrder,
} from "../../utils/storage";
import { InlineCellEditor } from "../InlineCellEditor";
import { ContextMenu, type ContextMenuEntry } from "../ContextMenu";
import { ColumnHeaderMenu } from "../ColumnHeaderMenu";
import { TableViewSkeleton } from "../skeletons";
import { EmptyTableState } from "./EmptyTableState";

interface TableViewProps {
  documents: TableDocument[];
  schema?: TableSchema;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  observerTarget: (node: HTMLDivElement | null) => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  sortConfig: SortConfig | null;
  onSort: (field: string) => void;
  onSortDirection?: (field: string, direction: "asc" | "desc") => void;
  onEdit?: (documentId: string) => void;
  onClone?: (document: Record<string, any>) => void;
  onDelete?: (documentId: string) => void;
  onPatchDocument?: (
    documentId: string,
    fields: Record<string, any>,
  ) => Promise<void>;
  visibleFields?: string[];
  tableName?: string;
  frozenColumns?: string[];
  onFreezeColumn?: (column: string) => void;
  onUnfreezeColumn?: (column: string) => void;
  onAddDocument?: () => void;
}

interface EditingCell {
  rowId: string;
  column: string;
  value: any;
}

interface HoveredCell {
  rowId: string;
  column: string;
}

interface ContextMenuState {
  position: { x: number; y: number };
  rowId: string;
  column: string;
  value: any;
  document: TableDocument;
}

interface DragState {
  dragging?: string;
  over?: string;
  position?: "left" | "right";
}

// Constants matching panel
const DEFAULT_COLUMN_WIDTH = 160;
const MIN_COLUMN_WIDTH = 96;
const ROW_HEIGHT = 32;
const HEADER_HEIGHT = 36;
const CHECKBOX_COLUMN_WIDTH = 40;
const CELL_PADDING = "6px 12px";

// Helper to build column metadata from schema
function buildColumnMeta(
  schema?: TableSchema,
): Record<
  string,
  { typeLabel: string; optional: boolean; linkTable?: string }
> {
  const meta: Record<
    string,
    { typeLabel: string; optional: boolean; linkTable?: string }
  > = {
    _id: { typeLabel: "id", optional: false },
    _creationTime: { typeLabel: "timestamp", optional: false },
  };

  schema?.fields?.forEach((field) => {
    let typeLabel = field.shape?.type ?? "string";
    let linkTable: string | undefined;

    if (field.shape?.type === "Id" && field.shape.tableName) {
      typeLabel = `id<${field.shape.tableName}>`;
      linkTable = field.shape.tableName;
    }

    meta[field.fieldName] = {
      typeLabel,
      optional: field.optional ?? false,
      linkTable,
    };
  });

  return meta;
}

export function TableView({
  documents,
  schema,
  isLoading,
  isLoadingMore,
  hasMore,
  observerTarget,
  selectedIds,
  onSelectionChange,
  sortConfig,
  onSort,
  onSortDirection,
  onEdit: _onEdit,
  onClone: _onClone,
  onDelete: _onDelete,
  onPatchDocument,
  visibleFields,
  tableName,
  frozenColumns = [],
  onFreezeColumn,
  onUnfreezeColumn,
  onAddDocument,
}: TableViewProps) {
  // Initialize column widths from localStorage
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(
    () => {
      if (tableName) {
        return getColumnWidths(tableName);
      }
      return {};
    },
  );
  const [hoveredCell, setHoveredCell] = useState<HoveredCell | null>(null);
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [menuOpenCell, setMenuOpenCell] = useState<HoveredCell | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [resizingHover, setResizingHover] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  // Initialize column order from localStorage
  const [columnOrder, setColumnOrder] = useState<string[] | null>(() => {
    if (tableName) {
      return getColumnOrder(tableName);
    }
    return null;
  });
  const tableRef = useRef<HTMLTableElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Persist column widths to localStorage when they change
  useEffect(() => {
    if (tableName && Object.keys(columnWidths).length > 0) {
      saveColumnWidths(tableName, columnWidths);
    }
  }, [tableName, columnWidths]);

  // Persist column order to localStorage when it changes
  useEffect(() => {
    if (tableName && columnOrder && columnOrder.length > 0) {
      saveColumnOrder(tableName, columnOrder);
    }
  }, [tableName, columnOrder]);

  // Reset column widths and order when table changes
  const prevTableName = useRef(tableName);
  useEffect(() => {
    if (prevTableName.current !== tableName) {
      // Load new table's column widths and order
      if (tableName) {
        setColumnWidths(getColumnWidths(tableName));
        setColumnOrder(getColumnOrder(tableName));
      } else {
        setColumnWidths({});
        setColumnOrder(null);
      }
      prevTableName.current = tableName;
    }
  }, [tableName]);

  // Inline editing state
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");
  const [editingError, setEditingError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation state
  const [focusedCell, setFocusedCell] = useState<{
    rowIndex: number;
    colIndex: number;
  } | null>(null);

  // Column metadata from schema
  const columnMeta = useMemo(() => buildColumnMeta(schema), [schema]);

  // Get column width
  const getColumnWidth = useCallback(
    (column: string) => columnWidths[column] || DEFAULT_COLUMN_WIDTH,
    [columnWidths],
  );

  // Get all unique fields from documents and schema
  const allFields = useMemo(() => {
    const schemaFields = schema?.fields?.map((f) => f.fieldName) || [];
    const docFields = new Set<string>();

    documents.forEach((doc) => {
      Object.keys(doc).forEach((key) => {
        // Skip system fields - we add them explicitly
        if (key !== "_id" && key !== "_creationTime") {
          docFields.add(key);
        }
      });
    });

    // Build ordered list: _id, schema fields (except system fields), doc fields, _creationTime
    const ordered = ["_id"];
    schemaFields.forEach((f) => {
      // Skip system fields to avoid duplicates
      if (f !== "_id" && f !== "_creationTime" && !ordered.includes(f)) {
        ordered.push(f);
      }
    });
    docFields.forEach((f) => {
      if (!ordered.includes(f)) ordered.push(f);
    });
    // Add _creationTime at the end (only once)
    ordered.push("_creationTime");

    return ordered;
  }, [documents, schema]);

  // Filter to visible fields if specified, then apply column order
  const columns = useMemo(() => {
    let cols = allFields;
    if (visibleFields && visibleFields.length > 0) {
      cols = allFields.filter((f) => visibleFields.includes(f));
    }
    // Apply custom column order if set
    if (columnOrder) {
      const orderedCols = columnOrder.filter((c) => cols.includes(c));
      const newCols = cols.filter((c) => !columnOrder.includes(c));
      return [...orderedCols, ...newCols];
    }
    return cols;
  }, [allFields, visibleFields, columnOrder]);

  // Check if column is editable
  const isEditableColumn = useCallback((column: string) => {
    return column !== "_id" && column !== "_creationTime";
  }, []);

  // Start editing a cell
  const startEditing = useCallback(
    (rowId: string, column: string, value: any) => {
      if (!isEditableColumn(column)) return;
      // For editing, use raw value without formatValue's quote wrapping for strings
      let stringValue: string;
      if (value === null) {
        stringValue = "null";
      } else if (value === undefined) {
        stringValue = "";
      } else if (typeof value === "string") {
        // Don't wrap strings in quotes - use raw value
        stringValue = value;
      } else if (typeof value === "object") {
        stringValue = JSON.stringify(value, null, 2);
      } else {
        stringValue = String(value);
      }
      setEditingCell({ rowId, column, value });
      setEditingValue(stringValue);
      setEditingError(null);
    },
    [isEditableColumn],
  );

  // Cancel editing
  const cancelEditing = useCallback(() => {
    setEditingCell(null);
    setEditingValue("");
    setEditingError(null);
    // Refocus container for keyboard navigation
    setTimeout(() => containerRef.current?.focus(), 0);
  }, []);

  // Validate the editing value
  const validateValue = useCallback(
    (value: string, column: string, originalValue: any): string | null => {
      const meta = columnMeta[column];
      if (!meta) return null;

      // Check if it's an ID field that references another table
      if (meta.linkTable) {
        if (value && !isConvexId(value)) {
          return `Type 'string' is not assignable to: v.id("${meta.linkTable}")`;
        }
      }

      // Check number types
      if (typeof originalValue === "number") {
        const numValue = parseFloat(value);
        if (value !== "" && isNaN(numValue)) {
          return "Expected a number";
        }
      }

      // Check boolean types
      if (typeof originalValue === "boolean") {
        const lower = value.toLowerCase();
        if (lower !== "true" && lower !== "false") {
          return "Expected true or false";
        }
      }

      return null;
    },
    [columnMeta],
  );

  // Validate on value change
  useEffect(() => {
    if (editingCell) {
      const error = validateValue(
        editingValue,
        editingCell.column,
        editingCell.value,
      );
      setEditingError(error);
    }
  }, [editingValue, editingCell, validateValue]);

  // Save the edited value
  const saveEditing = useCallback(async () => {
    if (!editingCell || !onPatchDocument || isSaving || editingError) return;

    setIsSaving(true);
    try {
      // Parse value based on original type
      let parsedValue: any = editingValue;
      const originalValue = editingCell.value;

      if (editingValue === "" || editingValue === "unset") {
        parsedValue = undefined;
      } else if (editingValue === "null") {
        parsedValue = null;
      } else if (typeof originalValue === "string") {
        // If original was a string, keep the input as a string directly
        // Don't try to parse it as JSON
        parsedValue = editingValue;
      } else if (typeof originalValue === "object" && originalValue !== null) {
        try {
          parsedValue = JSON.parse(editingValue);
        } catch {
          // Keep as string if JSON parse fails
        }
      } else if (typeof originalValue === "number") {
        const numValue = parseFloat(editingValue);
        if (!isNaN(numValue)) {
          parsedValue = numValue;
        }
      } else if (typeof originalValue === "boolean") {
        if (editingValue.toLowerCase() === "true") {
          parsedValue = true;
        } else if (editingValue.toLowerCase() === "false") {
          parsedValue = false;
        }
      }

      // Only save if value changed
      const valueChanged =
        JSON.stringify(parsedValue) !== JSON.stringify(originalValue);
      if (valueChanged) {
        await onPatchDocument(editingCell.rowId, {
          [editingCell.column]: parsedValue,
        });
      }

      setEditingCell(null);
      setEditingValue("");
      // Refocus container for keyboard navigation
      setTimeout(() => containerRef.current?.focus(), 0);
    } catch (err) {
      setEditingError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  }, [editingCell, editingValue, onPatchDocument, isSaving, editingError]);

  // Click outside handler
  useEffect(() => {
    if (!editingCell) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        editorRef.current &&
        !editorRef.current.contains(event.target as Node)
      ) {
        cancelEditing();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [editingCell, cancelEditing]);

  // Keyboard handler for global escape
  useEffect(() => {
    if (!editingCell) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        cancelEditing();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [editingCell, cancelEditing]);

  // Handle row selection
  const handleSelectRow = useCallback(
    (docId: string) => {
      if (selectedIds.includes(docId)) {
        onSelectionChange(selectedIds.filter((id) => id !== docId));
      } else {
        onSelectionChange([...selectedIds, docId]);
      }
    },
    [selectedIds, onSelectionChange],
  );

  // Keyboard navigation handler
  const handleKeyboardNavigation = useCallback(
    (event: React.KeyboardEvent) => {
      // Don't handle if editing
      if (editingCell) return;
      if (!focusedCell) return;
      if (documents.length === 0) return;

      const { rowIndex, colIndex } = focusedCell;
      const numRows = documents.length;
      const numCols = columns.length;

      switch (event.key) {
        case "ArrowUp":
          event.preventDefault();
          if (rowIndex > 0) {
            setFocusedCell({ rowIndex: rowIndex - 1, colIndex });
          }
          break;
        case "ArrowDown":
          event.preventDefault();
          if (rowIndex < numRows - 1) {
            setFocusedCell({ rowIndex: rowIndex + 1, colIndex });
          }
          break;
        case "ArrowLeft":
          event.preventDefault();
          if (colIndex > 0) {
            setFocusedCell({ rowIndex, colIndex: colIndex - 1 });
          }
          break;
        case "ArrowRight":
          event.preventDefault();
          if (colIndex < numCols - 1) {
            setFocusedCell({ rowIndex, colIndex: colIndex + 1 });
          }
          break;
        case "Tab":
          event.preventDefault();
          if (event.shiftKey) {
            // Move backward
            if (colIndex > 0) {
              setFocusedCell({ rowIndex, colIndex: colIndex - 1 });
            } else if (rowIndex > 0) {
              setFocusedCell({ rowIndex: rowIndex - 1, colIndex: numCols - 1 });
            }
          } else {
            // Move forward
            if (colIndex < numCols - 1) {
              setFocusedCell({ rowIndex, colIndex: colIndex + 1 });
            } else if (rowIndex < numRows - 1) {
              setFocusedCell({ rowIndex: rowIndex + 1, colIndex: 0 });
            }
          }
          break;
        case "Enter":
          event.preventDefault();
          const doc = documents[rowIndex];
          const column = columns[colIndex];
          if (doc && column && isEditableColumn(column) && onPatchDocument) {
            startEditing(doc._id, column, doc[column]);
          }
          break;
        case " ": // Space to toggle selection
          event.preventDefault();
          const spaceDoc = documents[rowIndex];
          if (spaceDoc) {
            handleSelectRow(spaceDoc._id);
          }
          break;
        case "Escape":
          event.preventDefault();
          setFocusedCell(null);
          break;
      }
    },
    [
      editingCell,
      focusedCell,
      documents,
      columns,
      isEditableColumn,
      onPatchDocument,
      startEditing,
      handleSelectRow,
    ],
  );

  // Click handler for cells to set focus
  const handleCellClick = useCallback((rowIndex: number, colIndex: number) => {
    setFocusedCell({ rowIndex, colIndex });
  }, []);

  // Click handler to clear focus when clicking outside cells
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    // Only clear if clicking directly on the container (not on a cell)
    const target = e.target as HTMLElement;
    // Check if the click was on an actual data cell
    if (!target.closest("td") && !target.closest("th")) {
      setFocusedCell(null);
    }
  }, []);

  // Handle select all
  const allSelected =
    documents.length > 0 &&
    documents.every((doc) => selectedIds.includes(doc._id));
  const someSelected =
    documents.some((doc) => selectedIds.includes(doc._id)) && !allSelected;

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(documents.map((doc) => doc._id));
    }
  }, [allSelected, documents, onSelectionChange]);

  // Column resizing
  const handleResizeStart = useCallback(
    (column: string, e: React.PointerEvent) => {
      e.preventDefault();
      setResizingColumn(column);

      const startX = e.clientX;
      const startWidth = columnWidths[column] || DEFAULT_COLUMN_WIDTH;

      const handleMove = (moveEvent: PointerEvent) => {
        const diff = moveEvent.clientX - startX;
        const newWidth = Math.max(MIN_COLUMN_WIDTH, startWidth + diff);
        setColumnWidths((prev) => ({ ...prev, [column]: newWidth }));
      };

      const handleUp = () => {
        setResizingColumn(null);
        document.removeEventListener("pointermove", handleMove);
        document.removeEventListener("pointerup", handleUp);
      };

      document.addEventListener("pointermove", handleMove);
      document.addEventListener("pointerup", handleUp);
    },
    [columnWidths],
  );

  // Drag and drop column reordering handlers
  const didDragRef = useRef(false);

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLTableCellElement>, column: string) => {
      didDragRef.current = true;
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", column);
      setDragState({ dragging: column });
    },
    [],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLTableCellElement>, column: string) => {
      e.preventDefault();
      if (!dragState?.dragging || dragState.dragging === column) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const midX = rect.left + rect.width / 2;
      const position = e.clientX < midX ? "left" : "right";

      setDragState((prev) => ({
        ...prev,
        over: column,
        position,
      }));
    },
    [dragState?.dragging],
  );

  const handleDrop = useCallback(
    (column: string) => {
      if (!dragState?.dragging || dragState.dragging === column) {
        setDragState(null);
        return;
      }

      const currentOrder = columnOrder || columns;
      const fromIndex = currentOrder.indexOf(dragState.dragging);
      let toIndex = currentOrder.indexOf(column);

      if (fromIndex === -1 || toIndex === -1) {
        setDragState(null);
        return;
      }

      // Adjust target index based on drop position
      if (dragState.position === "right") {
        toIndex += 1;
      }
      // If moving forward, account for the removed item
      if (fromIndex < toIndex) {
        toIndex -= 1;
      }

      const newOrder = [...currentOrder];
      newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, dragState.dragging);

      setColumnOrder(newOrder);
      setDragState(null);
    },
    [dragState, columnOrder, columns],
  );

  const handleDragEnd = useCallback(() => {
    setDragState(null);
    // Reset the drag flag after a short delay to allow click events to check it
    setTimeout(() => {
      didDragRef.current = false;
    }, 100);
  }, []);

  // Handle menu click - open context menu
  const handleMenuClick = useCallback(
    (e: React.MouseEvent, doc: TableDocument, column: string) => {
      e.stopPropagation();
      e.preventDefault();
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setContextMenu({
        position: { x: rect.left, y: rect.bottom + 4 },
        rowId: doc._id,
        column,
        value: doc[column],
        document: doc,
      });
      setMenuOpenCell({ rowId: doc._id, column });
    },
    [],
  );

  // Handle right-click context menu
  const handleCellContextMenu = useCallback(
    (e: React.MouseEvent, doc: TableDocument, column: string) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({
        position: { x: e.clientX, y: e.clientY },
        rowId: doc._id,
        column,
        value: doc[column],
        document: doc,
      });
      setMenuOpenCell({ rowId: doc._id, column });
    },
    [],
  );

  // Close context menu
  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
    setMenuOpenCell(null);
  }, []);

  // Build context menu items
  const getContextMenuItems = useCallback(
    (doc: TableDocument, column: string, value: any): ContextMenuEntry[] => {
      const items: ContextMenuEntry[] = [];

      // Copy value
      items.push({
        label: "Copy value",
        onClick: () => {
          // For date columns, copy the raw timestamp value
          const meta = columnMeta[column];
          const isDateColumn =
            column === "_creationTime" || meta?.typeLabel === "timestamp";

          let stringValue: string;
          if (isDateColumn && typeof value === "number") {
            // Copy raw timestamp value (e.g., "1765289523005.1084")
            stringValue = String(value);
          } else if (typeof value === "object") {
            stringValue = JSON.stringify(value, null, 2);
          } else {
            stringValue = String(value ?? "");
          }
          navigator.clipboard.writeText(stringValue);
        },
        shortcut: "⌘C",
      });

      // Copy _id
      items.push({
        label: "Copy _id",
        onClick: () => {
          navigator.clipboard.writeText(doc._id);
        },
      });

      items.push({ type: "divider" });

      // Edit (if editable column)
      if (isEditableColumn(column) && onPatchDocument) {
        items.push({
          label: `Edit "${column}"`,
          onClick: () => {
            startEditing(doc._id, column, value);
          },
        });
      }

      // Clone document
      if (_onClone) {
        items.push({
          label: "Clone document",
          onClick: () => {
            _onClone(doc);
          },
        });
      }

      // Edit document (open in sheet)
      if (_onEdit) {
        items.push({
          label: "Edit document",
          onClick: () => {
            _onEdit(doc._id);
          },
        });
      }

      items.push({ type: "divider" });

      // Delete document
      if (_onDelete) {
        items.push({
          label: "Delete document",
          onClick: () => {
            _onDelete(doc._id);
          },
          destructive: true,
        });
      }

      return items;
    },
    [
      isEditableColumn,
      onPatchDocument,
      startEditing,
      _onClone,
      _onEdit,
      _onDelete,
    ],
  );

  // Close menu on click outside
  useEffect(() => {
    if (!menuOpenCell) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-menu-trigger]")) {
        setMenuOpenCell(null);
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [menuOpenCell]);

  if (isLoading && documents.length === 0) {
    return <TableViewSkeleton />;
  }

  if (documents.length === 0) {
    const columns =
      visibleFields && visibleFields.length > 0
        ? visibleFields
        : schema && schema.fields
          ? schema.fields.map((field) => field.fieldName)
          : ["_id", "_creationTime"];

    return (
      <EmptyTableState columns={columns} onAddDocument={onAddDocument} />
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-full overflow-auto"
      tabIndex={0}
      onKeyDown={handleKeyboardNavigation}
      onClick={handleContainerClick}
      style={{ outline: "none" }}
    >
      <table
        ref={tableRef}
        className="w-full"
        style={{
          minWidth: "max-content",
          fontSize: "12px",
          fontFamily: "ui-monospace, monospace",
          borderCollapse: "separate",
          borderSpacing: 0,
        }}
      >
        {/* Header */}
        <thead style={{ position: "sticky", top: 0, zIndex: 15 }}>
          <tr
            style={{
              borderBottom: "1px solid var(--color-border-base)",
              fontSize: "12px",
              color: "var(--color-text-muted)",
              backgroundColor: "var(--color-surface-raised)",
            }}
          >
            {/* Checkbox column */}
            <th
              style={{
                width: CHECKBOX_COLUMN_WIDTH,
                minWidth: CHECKBOX_COLUMN_WIDTH,
                maxWidth: CHECKBOX_COLUMN_WIDTH,
                padding: 0,
                textAlign: "center",
                position: "sticky",
                left: 0,
                backgroundColor: "var(--color-surface-raised)",
                borderRight: "1px solid var(--color-border-base)",
                borderBottom: "1px solid var(--color-border-base)",
                zIndex: 20,
              }}
            >
              <div
                style={{
                  width: CHECKBOX_COLUMN_WIDTH,
                  height: HEADER_HEIGHT,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded cursor-pointer"
                  style={{ accentColor: "var(--color-brand-base)" }}
                />
              </div>
            </th>

            {/* Data columns */}
            {columns.map((column) => {
              const width = getColumnWidth(column);
              const meta = columnMeta[column];
              const isDragging = dragState?.dragging === column;
              const isResizeHover = resizingHover === column;

              return (
                <th
                  key={column}
                  draggable
                  onDragStart={(e) => handleDragStart(e, column)}
                  onDragOver={(e) => handleDragOver(e, column)}
                  onDrop={() => handleDrop(column)}
                  onDragEnd={handleDragEnd}
                  style={{
                    width,
                    minWidth: width,
                    maxWidth: width,
                    padding: 0,
                    textAlign: "left",
                    position: "relative",
                    borderRight: "1px solid var(--color-border-base)",
                    borderBottom: "1px solid var(--color-border-base)",
                    backgroundColor: isDragging
                      ? "var(--color-surface-overlay)"
                      : "var(--color-surface-raised)",
                    userSelect: "none",
                    transition: "background-color 0.2s ease",
                    cursor: isDragging ? "grabbing" : "grab",
                  }}
                >
                  {/* Drag target indicator */}
                  {dragState?.over === column &&
                    dragState.dragging !== column && (
                      <div
                        style={{
                          position: "absolute",
                          top: 4,
                          bottom: 4,
                          width: 3,
                          borderRadius: 999,
                          background: "var(--color-brand-base)",
                          boxShadow: "0 0 12px var(--color-brand-base)",
                          pointerEvents: "none",
                          zIndex: 30,
                          [dragState.position === "left" ? "left" : "right"]:
                            -1,
                        }}
                      />
                    )}

                  {/* Column Header Menu - wraps entire header content */}
                  <ColumnHeaderMenu
                    column={column}
                    isSystemField={
                      column === "_id" || column === "_creationTime"
                    }
                    isFrozen={frozenColumns.includes(column)}
                    sortDirection={
                      sortConfig?.field === column ? sortConfig.direction : null
                    }
                    onSortAscending={() => {
                      if (onSortDirection) {
                        onSortDirection(column, "asc");
                      } else {
                        onSort(column);
                      }
                    }}
                    onSortDescending={() => {
                      if (onSortDirection) {
                        onSortDirection(column, "desc");
                      } else {
                        onSort(column);
                      }
                    }}
                    onFreeze={
                      onFreezeColumn ? () => onFreezeColumn(column) : undefined
                    }
                    onUnfreeze={
                      onUnfreezeColumn
                        ? () => onUnfreezeColumn(column)
                        : undefined
                    }
                    checkDragInProgress={() => didDragRef.current}
                    triggerElement={
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: CELL_PADDING,
                          height: HEADER_HEIGHT,
                          gap: "8px",
                          cursor: "pointer",
                        }}
                      >
                        {/* Column name and type in a row */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            minWidth: 0,
                            flex: 1,
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 500,
                              color: "var(--color-text-base)",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {column}
                          </span>
                          {meta && (
                            <span
                              style={{
                                fontSize: "10px",
                                color: "var(--color-text-muted)",
                                whiteSpace: "nowrap",
                                flexShrink: 0,
                              }}
                            >
                              {meta.typeLabel}
                              {meta.optional && "?"}
                            </span>
                          )}
                        </div>
                        {/* Sort indicator */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 16,
                            height: 16,
                            borderRadius: 4,
                            opacity: sortConfig?.field === column ? 1 : 0,
                            transition: "opacity 0.15s ease",
                            flexShrink: 0,
                          }}
                        >
                          {sortConfig?.field === column &&
                            (sortConfig.direction === "asc" ? (
                              <ArrowUp
                                size={12}
                                color="var(--color-brand-base)"
                              />
                            ) : (
                              <ArrowDown
                                size={12}
                                color="var(--color-brand-base)"
                              />
                            ))}
                        </div>
                      </div>
                    }
                  />

                  {/* Resize handle */}
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: "8px",
                      cursor: "col-resize",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onPointerDown={(e) => handleResizeStart(column, e)}
                    onMouseEnter={() => setResizingHover(column)}
                    onMouseLeave={() => setResizingHover(null)}
                  >
                    <span
                      style={{
                        width: "2px",
                        height: "70%",
                        borderRadius: 999,
                        backgroundColor:
                          resizingColumn === column || isResizeHover
                            ? "var(--color-border-strong)"
                            : "transparent",
                        boxShadow:
                          resizingColumn === column
                            ? "0 0 8px var(--color-border-strong)"
                            : "none",
                        transition:
                          "background-color 0.15s ease, box-shadow 0.15s ease",
                      }}
                    />
                  </div>
                </th>
              );
            })}

            {/* Trailing spacer */}
            <th
              style={{
                padding: "8px",
                minWidth: 100,
                borderBottom: "1px solid var(--color-border-base)",
                backgroundColor: "var(--color-surface-raised)",
              }}
            />
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {documents.map((doc, rowIndex) => {
            const isSelected = selectedIds.includes(doc._id);

            return (
              <tr
                key={doc._id}
                style={{
                  transition: "background-color 0.15s ease",
                  backgroundColor: isSelected
                    ? "var(--color-brand-base-alpha)"
                    : "var(--color-surface-base)",
                }}
              >
                {/* Checkbox */}
                <td
                  style={{
                    padding: 0,
                    textAlign: "center",
                    width: CHECKBOX_COLUMN_WIDTH,
                    minWidth: CHECKBOX_COLUMN_WIDTH,
                    maxWidth: CHECKBOX_COLUMN_WIDTH,
                    position: "sticky",
                    left: 0,
                    zIndex: 11,
                    backgroundColor: isSelected
                      ? "var(--color-brand-base-alpha)"
                      : "var(--color-surface-base)",
                    borderRight: "1px solid var(--color-border-base)",
                    borderBottom: "1px solid var(--color-border-base)",
                  }}
                >
                  <div
                    style={{
                      width: CHECKBOX_COLUMN_WIDTH,
                      height: ROW_HEIGHT,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectRow(doc._id)}
                      className="w-4 h-4 rounded cursor-pointer"
                      style={{ accentColor: "var(--color-brand-base)" }}
                    />
                  </div>
                </td>

                {/* Data cells */}
                {columns.map((column, colIndex) => {
                  const value = doc[column];
                  const width = getColumnWidth(column);
                  const meta = columnMeta[column];
                  const isHovered =
                    hoveredCell?.rowId === doc._id &&
                    hoveredCell?.column === column;
                  const isMenuOpen =
                    menuOpenCell?.rowId === doc._id &&
                    menuOpenCell?.column === column;
                  const isEditing =
                    editingCell?.rowId === doc._id &&
                    editingCell?.column === column;
                  const isEditable =
                    isEditableColumn(column) && onPatchDocument;
                  const isUnset = value === null || value === undefined;
                  const isIdColumn =
                    column === "_id" || meta?.linkTable !== undefined;
                  const isDateColumn =
                    column === "_creationTime" ||
                    meta?.typeLabel === "timestamp";
                  const isFocused =
                    focusedCell?.rowIndex === rowIndex &&
                    focusedCell?.colIndex === colIndex;

                  return (
                    <td
                      key={column}
                      style={{
                        padding: 0,
                        borderRight: "1px solid var(--color-border-base)",
                        borderBottom: "1px solid var(--color-border-base)",
                        width,
                        minWidth: width,
                        maxWidth: width,
                        transition:
                          "background-color 0.15s ease, box-shadow 0.15s ease",
                        backgroundColor: isEditing
                          ? "var(--color-surface-raised)"
                          : isUnset
                            ? "rgba(128, 128, 128, 0.05)"
                            : isMenuOpen
                              ? "var(--color-surface-overlay)"
                              : isHovered || isFocused
                                ? "var(--color-surface-raised)"
                                : "transparent",
                        position: "relative",
                        overflow: isEditing ? "visible" : "hidden",
                        boxSizing: "border-box",
                        boxShadow: isFocused
                          ? "inset 0 0 0 2px var(--color-brand-base)"
                          : "none",
                      }}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                      onMouseEnter={() =>
                        setHoveredCell({ rowId: doc._id, column })
                      }
                      onMouseLeave={() => setHoveredCell(null)}
                      onContextMenu={(e) =>
                        handleCellContextMenu(e, doc, column)
                      }
                      onCopy={(e) => {
                        // For date columns, copy the raw timestamp value instead of formatted text
                        if (isDateColumn && typeof value === "number") {
                          e.preventDefault();
                          navigator.clipboard.writeText(String(value));
                        }
                      }}
                      onDoubleClick={() => {
                        if (isEditable && !isEditing) {
                          startEditing(doc._id, column, value);
                        }
                      }}
                    >
                      {isEditing ? (
                        <InlineCellEditor
                          value={editingValue}
                          onChange={setEditingValue}
                          onSave={saveEditing}
                          onCancel={cancelEditing}
                          isSaving={isSaving}
                          inputRef={editInputRef}
                          editorRef={editorRef}
                          cellWidth={width}
                          error={editingError}
                          linkTable={meta?.linkTable}
                        />
                      ) : (
                        <div
                          style={{
                            position: "relative",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: CELL_PADDING,
                            gap: "8px",
                            cursor: isEditable ? "pointer" : "default",
                            height: ROW_HEIGHT,
                            boxSizing: "border-box",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              flex: 1,
                              minWidth: 0,
                            }}
                          >
                            {isUnset ? (
                              <span
                                style={{
                                  color: "var(--color-text-muted)",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  fontStyle: "italic",
                                  flex: 1,
                                  minWidth: 0,
                                }}
                              >
                                {value === null ? "null" : "No field"}
                              </span>
                            ) : isDateColumn && typeof value === "number" ? (
                              <span
                                style={{
                                  color: TIMESTAMP_COLOR,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  flex: 1,
                                  minWidth: 0,
                                }}
                                title={new Date(value).toISOString()}
                              >
                                {formatTimestamp(value)}
                              </span>
                            ) : (
                              <span
                                style={{
                                  color: getValueColor(value, isIdColumn),
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  flex: 1,
                                  minWidth: 0,
                                }}
                                title={
                                  typeof value === "object"
                                    ? JSON.stringify(value)
                                    : String(value ?? "")
                                }
                              >
                                {formatValue(value, 50)}
                              </span>
                            )}
                          </div>

                          {/* Cell menu button */}
                          {(isHovered || isMenuOpen) && (
                            <button
                              type="button"
                              data-menu-trigger
                              onClick={(e) => handleMenuClick(e, doc, column)}
                              style={{
                                width: 20,
                                height: 20,
                                borderRadius: 4,
                                border: "1px solid var(--color-border-base)",
                                backgroundColor: "var(--color-surface-raised)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "var(--color-text-base)",
                                cursor: "pointer",
                                flexShrink: 0,
                              }}
                            >
                              <MoreVertical
                                size={12}
                                color="var(--color-text-muted)"
                              />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}

                {/* Trailing spacer */}
                <td
                  style={{
                    padding: "8px",
                    minWidth: 100,
                    borderRight: "1px solid var(--color-border-base)",
                  }}
                />
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Infinite scroll trigger */}
      {hasMore && (
        <div
          ref={observerTarget}
          className="flex items-center justify-center py-4"
          style={{ color: "var(--color-text-muted)" }}
        >
          {isLoadingMore && (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <span className="text-xs">Loading more...</span>
            </>
          )}
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          items={getContextMenuItems(
            contextMenu.document,
            contextMenu.column,
            contextMenu.value,
          )}
          position={contextMenu.position}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
}

export default TableView;
