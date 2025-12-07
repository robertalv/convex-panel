import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  TableDocument,
  TableDefinition,
  FilterExpression,
} from '../../../../types';
import { ContextMenu } from '../../../../components/shared/context-menu';
import { patchDocumentFields, deleteDocuments } from '../../../../utils/api/documents';
import { toast } from '../../../../utils/toast';
import { EmptyTableState } from './empty-table-state';
import { TableHeader } from './table-header';
import { TableRow } from './table-row';
import { TableFooter } from './table-footer';
import { buildCellMenuItems } from './data-table-menu';
import {
  buildColumnMeta,
  formatValue,
  isConvexId,
  DEFAULT_COLUMN_WIDTH,
  MIN_COLUMN_WIDTH,
} from './data-table-utils';

export interface DataTableProps {
  selectedTable: string;
  documents: TableDocument[];
  isLoading: boolean;
  tables: TableDefinition;
  visibleFields?: string[];
  selectedDocumentIds: string[];
  onSelectionChange: (ids: string[]) => void;
  adminClient?: any;
  onDocumentUpdate?: () => void;
  deploymentUrl?: string;
  componentId?: string | null;
  onNavigateToTable?: (tableName: string, documentId: string) => void;
  accessToken?: string;
  teamSlug?: string;
  projectSlug?: string;
  filters?: FilterExpression;
  setFilters?: (filters: FilterExpression) => void;
  onAddDocument?: () => void;
}

export const DataTable: React.FC<DataTableProps> = ({
  selectedTable,
  documents,
  isLoading,
  tables,
  visibleFields,
  selectedDocumentIds,
  onSelectionChange,
  adminClient,
  onDocumentUpdate,
  deploymentUrl,
  componentId,
  onNavigateToTable,
  accessToken,
  teamSlug,
  projectSlug,
  filters,
  setFilters,
  onAddDocument,
}) => {
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [dragState, setDragState] = useState<{
    dragging?: string;
    over?: string;
    position?: 'left' | 'right';
  } | null>(null);
  const [hoveredHeader, setHoveredHeader] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{
    rowId: string;
    column: string;
  } | null>(null);
  const [cellMenuState, setCellMenuState] = useState<{
    rowId: string;
    column: string;
    value: any;
    position: { x: number; y: number };
  } | null>(null);
  const [resizingHover, setResizingHover] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{
    rowId: string;
    column: string;
    value: any;
  } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [editingError, setEditingError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Track new/updated documents for visual highlighting
  const previousDocumentsRef = useRef<TableDocument[]>([]);
  const highlightTimeoutRef = useRef<number | null>(null);
  const [highlightedRows, setHighlightedRows] = useState<string[]>([]);
  const [highlightedCells, setHighlightedCells] = useState<
    Record<string, string[]>
  >({});

  const clampPosition = useCallback((x: number, y: number) => {
    const margin = 12;
    const menuWidth = 240;
    const menuHeight = 320;
    const clampedX = Math.max(
      margin,
      Math.min(x, window.innerWidth - menuWidth - margin),
    );
    const clampedY = Math.max(
      margin,
      Math.min(y, window.innerHeight - menuHeight - margin),
    );
    return { x: clampedX, y: clampedY };
  }, []);

  const hasSelectedTable = Boolean(selectedTable);
  const tableSchema = hasSelectedTable ? tables[selectedTable] : undefined;

  const columnMeta = useMemo(
    () => buildColumnMeta(tableSchema),
    [tableSchema],
  );

  const baseColumns = useMemo(() => {
    const schemaColumns = tableSchema?.fields?.map((field) => field.fieldName) || [];
    const combined = ['_id', ...schemaColumns, '_creationTime'];
    const unique = combined.filter((col, index, self) => self.indexOf(col) === index);
    return hasSelectedTable ? unique : [];
  }, [tableSchema, hasSelectedTable]);

  const filteredColumns = useMemo(() => {
    if (!visibleFields || visibleFields.length === 0) {
      // If no visibleFields specified, show all columns
      return baseColumns;
    }
    // Filter columns based on visibleFields
    return baseColumns.filter(col => visibleFields.includes(col));
  }, [baseColumns, visibleFields]);

  useEffect(() => {
    setColumnOrder(filteredColumns);
  }, [filteredColumns]);

  const orderedColumns = useMemo(() => {
    const allowed = new Set(filteredColumns);
    const preserved = columnOrder.filter((col) => allowed.has(col));
    const missing = filteredColumns.filter((col) => !preserved.includes(col));
    return [...preserved, ...missing];
  }, [columnOrder, filteredColumns]);

  const renderEmptyState = useCallback(() => {
    const columnsForEmptyState =
      orderedColumns.length > 0 ? orderedColumns : ['_id', '_creationTime'];
    return (
      <EmptyTableState
        columns={columnsForEmptyState}
        onAddDocument={onAddDocument}
      />
    );
  }, [orderedColumns, onAddDocument]);

  const getColumnWidth = useCallback(
    (column: string) => {
      if (columnWidths[column]) {
        return columnWidths[column];
      }
      if (column === '_id') {
        return 220;
      }
      if (column === '_creationTime') {
        return 180;
      }
      return DEFAULT_COLUMN_WIDTH;  
    },
    [columnWidths],
  );

  const selectionColumnWidth = 40;
  const baseTrailingSpacerWidth = 24;
  const [containerWidth, setContainerWidth] = useState<number | null>(null);

  const totalTableWidth = useMemo(() => {
    const dataWidth = orderedColumns.reduce(
      (sum, column) => sum + getColumnWidth(column),
      0,
    );
    return selectionColumnWidth + dataWidth + baseTrailingSpacerWidth;
  }, [orderedColumns, getColumnWidth, selectionColumnWidth, baseTrailingSpacerWidth]);

  useEffect(() => {
    if (!tableContainerRef.current) return;
    const element = tableContainerRef.current;
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry?.contentRect?.width) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    resizeObserver.observe(element);
    setContainerWidth(element.offsetWidth);
    return () => resizeObserver.disconnect();
  }, []);

  const extraSpacerWidth = Math.max(
    0,
    (containerWidth ?? totalTableWidth) - totalTableWidth,
  );
  const trailingSpacerWidth = baseTrailingSpacerWidth + extraSpacerWidth;
  const renderedTableWidth = totalTableWidth + extraSpacerWidth;

  const allDocumentIds = useMemo(
    () => documents.map((doc) => doc._id),
    [documents],
  );

  // Map of rowId -> Set of highlighted column keys
  const highlightedColumnMap = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    Object.entries(highlightedCells).forEach(([rowId, columns]) => {
      map[rowId] = new Set(columns);
    });
    return map;
  }, [highlightedCells]);

  const highlightedRowSet = useMemo(
    () => new Set(highlightedRows),
    [highlightedRows],
  );

  const isAllSelected =
    allDocumentIds.length > 0 &&
    allDocumentIds.every((id) => selectedDocumentIds.includes(id));
  const isIndeterminate =
    selectedDocumentIds.length > 0 && !isAllSelected;

  const toggleSelectAll = useCallback(() => {
    onSelectionChange(isAllSelected ? [] : allDocumentIds);
  }, [allDocumentIds, isAllSelected, onSelectionChange]);

  const toggleRowSelection = useCallback(
    (id: string) => {
      const isSelected = selectedDocumentIds.includes(id);
      if (isSelected) {
        onSelectionChange(selectedDocumentIds.filter((selectedId) => selectedId !== id));
      } else {
        onSelectionChange([...selectedDocumentIds, id]);
      }
    },
    [selectedDocumentIds, onSelectionChange],
  );

  // Track filters to detect when they change
  const previousFiltersRef = useRef<FilterExpression | undefined>(filters);

  // Reset highlights when switching tables
  useEffect(() => {
    previousDocumentsRef.current = documents;
    previousFiltersRef.current = filters;
    setHighlightedRows([]);
    setHighlightedCells({});
    if (highlightTimeoutRef.current !== null) {
      window.clearTimeout(highlightTimeoutRef.current);
      highlightTimeoutRef.current = null;
    }
  }, [selectedTable]);

  // Detect new rows and updated cells whenever documents change
  useEffect(() => {
    const prevDocs = previousDocumentsRef.current;
    const prevFilters = previousFiltersRef.current;
    
    // Check if filters changed - if so, reset document reference and skip highlighting
    const filtersChanged = JSON.stringify(prevFilters) !== JSON.stringify(filters);
    if (filtersChanged) {
      previousFiltersRef.current = filters;
      previousDocumentsRef.current = documents;
      setHighlightedRows([]);
      setHighlightedCells({});
      if (highlightTimeoutRef.current !== null) {
        window.clearTimeout(highlightTimeoutRef.current);
        highlightTimeoutRef.current = null;
      }
      return;
    }
    
    // Skip highlighting on initial load (when previousDocumentsRef is empty)
    // Only highlight when there are previous documents to compare against
    if (prevDocs.length === 0) {
      previousDocumentsRef.current = documents;
      previousFiltersRef.current = filters;
      return;
    }

    const prevById = new Map(prevDocs.map((doc) => [doc._id, doc]));

    const newRowIds: string[] = [];
    const updatedCells: Record<string, string[]> = {};

    for (const doc of documents) {
      const prev = prevById.get(doc._id);

      if (!prev) {
        // New document: highlight all of its fields (except internal metadata)
        newRowIds.push(doc._id);
        const cols = Object.keys(doc).filter(
          (key) => key !== '_id' && key !== '_creationTime',
        );
        if (cols.length) {
          updatedCells[doc._id] = cols;
        }
      } else {
        // Existing document: highlight only changed fields
        const changedCols: string[] = [];
        for (const key of Object.keys(doc)) {
          if (key === '_id' || key === '_creationTime') continue;
          if ((prev as any)[key] !== (doc as any)[key]) {
            changedCols.push(key);
          }
        }
        if (changedCols.length) {
          updatedCells[doc._id] = changedCols;
        }
      }
    }

    const hasChanges =
      newRowIds.length > 0 || Object.keys(updatedCells).length > 0;

    if (hasChanges) {
      // If we already have a pending timeout, reset it so the
      // highlight duration starts from the most recent change.
      if (highlightTimeoutRef.current !== null) {
        window.clearTimeout(highlightTimeoutRef.current);
        highlightTimeoutRef.current = null;
      }

      // Merge new highlights with any existing ones
      setHighlightedRows((prev) =>
        Array.from(new Set([...prev, ...newRowIds])),
      );
      setHighlightedCells((prev) => {
        const next: Record<string, string[]> = { ...prev };
        for (const [rowId, cols] of Object.entries(updatedCells)) {
          const existing = new Set(next[rowId] ?? []);
          cols.forEach((c) => existing.add(c));
          next[rowId] = Array.from(existing);
        }
        return next;
      });

      // Automatically clear highlights after a short delay
      highlightTimeoutRef.current = window.setTimeout(() => {
        setHighlightedRows([]);
        setHighlightedCells({});
        highlightTimeoutRef.current = null;
      }, 1200);
    }

    previousDocumentsRef.current = documents;
  }, [documents]);

  const startResizing = useCallback(
    (column: string, event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      const startX = event.clientX;
      const startWidth = getColumnWidth(column);
      setResizingHover(column);

      const handleMove = (moveEvent: PointerEvent) => {
        const delta = moveEvent.clientX - startX;
        const nextWidth = Math.max(MIN_COLUMN_WIDTH, startWidth + delta);
        setColumnWidths((prev) => ({
          ...prev,
          [column]: nextWidth,
        }));
      };

      const handleUp = () => {
        window.removeEventListener('pointermove', handleMove);
        window.removeEventListener('pointerup', handleUp);
        setResizingHover((prev) => (prev === column ? null : prev));
      };

      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleUp);
    },
    [getColumnWidth],
  );

  const reorderColumns = useCallback(
    (source: string, target: string, position: 'left' | 'right') => {
      if (source === target) {
        return;
      }
      setColumnOrder((prev) => {
        const withoutSource = prev.filter((col) => col !== source);
        const targetIndex = withoutSource.indexOf(target);
        if (targetIndex === -1) {
          return prev;
        }
        const insertIndex = position === 'left' ? targetIndex : targetIndex + 1;
        const next = [...withoutSource];
        next.splice(insertIndex, 0, source);
        return next;
      });
    },
    [],
  );

  const handleDragStart = useCallback((column: string) => {
    setDragState({ dragging: column, over: column, position: 'right' });
  }, []);

  const handleDragOver = useCallback(
    (column: string, event: React.DragEvent<HTMLTableHeaderCellElement>) => {
      event.preventDefault();
      if (!dragState?.dragging || dragState.dragging === column) {
        return;
      }
      const bounds = event.currentTarget.getBoundingClientRect();
      const position = event.clientX - bounds.left < bounds.width / 2 ? 'left' : 'right';
      setDragState((prev) =>
        prev
          ? {
              ...prev,
              over: column,
              position,
            }
          : prev,
      );
    },
    [dragState],
  );

  const handleDrop = useCallback(
    (column: string) => {
      if (dragState?.dragging && dragState.over) {
        reorderColumns(dragState.dragging, column, dragState.position ?? 'right');
      }
      setDragState(null);
    },
    [dragState, reorderColumns],
  );

  const handleDragEnd = useCallback(() => {
    setDragState(null);
  }, []);

  useEffect(() => {
    if (!cellMenuState) {
      return;
    }
    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.closest('.global-context-menu') ||
        target.closest('[data-menu-trigger]')
      ) {
        return;
      }
      setCellMenuState(null);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setCellMenuState(null);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [cellMenuState]);

  // Check if a column is editable (not a system field)
  const isEditableColumn = useCallback((column: string) => {
    return column !== '_id' && column !== '_creationTime';
  }, []);

  // Validate edited value against schema
  const validateValue = useCallback((value: string, column: string, originalValue: any): string | null => {
    const meta = columnMeta[column];
    if (!meta) return null;

    // Check if it's an ID field that references another table
    if (meta.linkTable) {
      // For ID references, validate it's a valid Convex ID
      if (!isConvexId(value)) {
        return `Type 'string' is not assignable to: v.id("${meta.linkTable}")`;
      }
    }

    // Check if original was a number
    if (typeof originalValue === 'number') {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        return `Type 'string' is not assignable to: v.number()`;
      }
    }

    // Check if original was a boolean
    if (typeof originalValue === 'boolean') {
      if (value.toLowerCase() !== 'true' && value.toLowerCase() !== 'false') {
        return `Type 'string' is not assignable to: v.boolean()`;
      }
    }

    return null;
  }, [columnMeta]);

  // Start editing a cell
  const startEditing = useCallback((rowId: string, column: string, value: any) => {
    if (!isEditableColumn(column)) {
      return;
    }
    const stringValue = formatValue(value);
    setEditingCell({ rowId, column, value });
    setEditingValue(stringValue);
    setEditingError(null);
  }, [isEditableColumn]);

  // Cancel editing
  const cancelEditing = useCallback(() => {
    setEditingCell(null);
    setEditingValue('');
    setEditingError(null);
  }, []);

  // Handle delete document
  const handleDeleteDocument = useCallback(async (documentId: string) => {
    if (!adminClient || !selectedTable) return;

    try {
      await deleteDocuments(selectedTable, [documentId], adminClient, componentId);
      toast('success', 'Document deleted successfully');
      
      // Refresh table data
      if (onDocumentUpdate) {
        onDocumentUpdate();
      }
    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast('error', error?.message || 'Failed to delete document');
    }
  }, [adminClient, selectedTable, componentId, onDocumentUpdate]);

  // Handle clicks outside the editor to close it
  useEffect(() => {
    if (!editingCell) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        editorRef.current &&
        !editorRef.current.contains(target) &&
        !(target instanceof Element && target.closest('[data-menu-trigger]'))
      ) {
        // Don't close if clicking on context menu
        if (!(target instanceof Element && target.closest('[role="menu"]'))) {
          cancelEditing();
        }
      }
    };

    // Add event listener with a small delay to avoid closing immediately on open
    const timeout = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editingCell, cancelEditing]);

  // Validate editing value on change
  useEffect(() => {
    if (editingCell) {
      const error = validateValue(editingValue, editingCell.column, editingCell.value);
      setEditingError(error);
    }
  }, [editingValue, editingCell, validateValue]);

  // Save edited value
  const saveEditing = useCallback(async () => {
    if (!editingCell || !adminClient || !selectedTable || isSaving || editingError) {
      return;
    }

    setIsSaving(true);
    try {
      // Parse the value based on the original value type
      let parsedValue: any = editingValue;
      const originalValue = editingCell.value;

      // Try to parse as JSON if it looks like JSON
      if (typeof originalValue === 'object' && originalValue !== null) {
        try {
          parsedValue = JSON.parse(editingValue);
        } catch {
          // If parsing fails, keep as string
          parsedValue = editingValue;
        }
      } else if (typeof originalValue === 'number') {
        // Try to parse as number
        const numValue = parseFloat(editingValue);
        if (!isNaN(numValue)) {
          parsedValue = numValue;
        }
      } else if (typeof originalValue === 'boolean') {
        // Parse boolean
        if (editingValue.toLowerCase() === 'true') {
          parsedValue = true;
        } else if (editingValue.toLowerCase() === 'false') {
          parsedValue = false;
        }
      } else if (originalValue === null || originalValue === undefined) {
        // If original was null/undefined, try to parse or keep as string
        if (editingValue.trim() === '' || editingValue.toLowerCase() === 'null' || editingValue.toLowerCase() === 'unset') {
          parsedValue = null;
        } else {
          try {
            parsedValue = JSON.parse(editingValue);
          } catch {
            parsedValue = editingValue;
          }
        }
      }

      // Update the document
      await patchDocumentFields(
        selectedTable,
        [editingCell.rowId],
        { [editingCell.column]: parsedValue },
        adminClient
      );

      // Call update callback if provided
      if (onDocumentUpdate) {
        onDocumentUpdate();
      }

      // Clear editing state
      setEditingCell(null);
      setEditingValue('');
    } catch (error) {
      console.error('Error updating document:', error);
      // Keep editing state so user can retry
    } finally {
      setIsSaving(false);
    }
  }, [editingCell, editingValue, adminClient, selectedTable, isSaving, editingError, onDocumentUpdate]);

  // Handle keyboard events for editing
  useEffect(() => {
    if (!editingCell) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        cancelEditing();
      } else if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        saveEditing();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [editingCell, cancelEditing, saveEditing]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingCell]);

  const renderLoadingState = () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: 'var(--color-panel-text-secondary)',
        fontSize: '14px',
      }}
    >
      Loading...
    </div>
  );

  const handleCellHover = useCallback((rowId: string, column: string) => {
    setHoveredCell({ rowId, column });
  }, []);

  const handleCellHoverLeave = useCallback((rowId: string, column: string) => {
    setHoveredCell((prev) =>
      prev &&
      prev.rowId === rowId &&
      prev.column === column
        ? null
        : prev,
    );
  }, []);

  const handleCellContextMenu = useCallback((event: React.MouseEvent, rowId: string, column: string, value: any) => {
    event.preventDefault();
    event.stopPropagation();
    const position = clampPosition(
      event.clientX,
      event.clientY,
    );
    setCellMenuState({
      rowId,
      column,
      value,
      position,
    });
  }, [clampPosition]);

  const handleCellMenuClick = useCallback((event: React.MouseEvent, rowId: string, column: string, value: any) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const position = clampPosition(rect.right, rect.bottom);
    setCellMenuState(
      cellMenuState?.rowId === rowId && cellMenuState?.column === column
        ? null
        : {
            rowId,
            column,
            value,
            position,
          },
    );
  }, [cellMenuState, clampPosition]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      <div
        ref={tableContainerRef}
        style={{
          flex: 1,
          overflow: 'auto',
          minHeight: 0,
        }}
      >
        {!hasSelectedTable ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'var(--color-panel-text-secondary)',
              fontSize: '14px',
            }}
          >
            Select a table to view data
          </div>
        ) : isLoading ? (
          renderLoadingState()
        ) : documents.length === 0 ? (
          renderEmptyState()
        ) : (
          <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>
            <table
              style={{
                textAlign: 'left',
                borderCollapse: 'collapse',
                tableLayout: 'fixed',
                width: renderedTableWidth,
                minWidth: renderedTableWidth,
              }}
            >
              <colgroup>
                <col style={{ width: 40 }} />
                {orderedColumns.map((column) => {
                  const width = getColumnWidth(column);
                  return <col key={`col-${column}`} style={{ width }} />;
                })}
                <col style={{ width: trailingSpacerWidth }} />
              </colgroup>
              <TableHeader
                columns={orderedColumns}
                getColumnWidth={getColumnWidth}
                columnMeta={columnMeta}
                dragState={dragState}
                hoveredHeader={hoveredHeader}
                resizingHover={resizingHover}
                isAllSelected={isAllSelected}
                isIndeterminate={isIndeterminate}
                trailingSpacerWidth={trailingSpacerWidth}
                onSelectAll={toggleSelectAll}
                onColumnDragOver={handleDragOver}
                onColumnDrop={handleDrop}
                onColumnDragEnd={handleDragEnd}
                onColumnMouseEnter={(column) => setHoveredHeader(column)}
                onColumnMouseLeave={(column) => setHoveredHeader((prev) => (prev === column ? null : prev))}
                onColumnDragStart={(column, event) => {
                  event.dataTransfer.effectAllowed = 'move';
                  event.dataTransfer.setData('text/plain', column);
                  handleDragStart(column);
                }}
                onColumnResizeStart={startResizing}
                onColumnResizeHoverEnter={(column) => setResizingHover(column)}
                onColumnResizeHoverLeave={(column) => setResizingHover((prev) => (prev === column ? null : prev))}
              />
              <tbody
                style={{
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  color: 'var(--color-panel-text)',
                }}
              >
                {documents.map((doc: TableDocument) => (
                  <TableRow
                    key={doc._id}
                    document={doc}
                    columns={orderedColumns}
                    getColumnWidth={getColumnWidth}
                    columnMeta={columnMeta}
                    selectedDocumentIds={selectedDocumentIds}
                    hoveredCell={hoveredCell}
                    cellMenuState={cellMenuState}
                    editingCell={editingCell}
                    editingValue={editingValue}
                    editingError={editingError}
                    isSaving={isSaving}
                    editInputRef={editInputRef as React.RefObject<HTMLTextAreaElement>}
                    editorRef={editorRef as React.RefObject<HTMLDivElement>}
                    trailingSpacerWidth={trailingSpacerWidth}
                    adminClient={adminClient}
                    deploymentUrl={deploymentUrl}
                    componentId={componentId}
                    onRowSelectionToggle={toggleRowSelection}
                    onCellHover={handleCellHover}
                    onCellHoverLeave={handleCellHoverLeave}
                    onCellDoubleClick={startEditing}
                    onCellContextMenu={handleCellContextMenu}
                    onEditingValueChange={setEditingValue}
                    onSaveEditing={saveEditing}
                    onCancelEditing={cancelEditing}
                    onCellMenuClick={handleCellMenuClick}
                    isEditableColumn={isEditableColumn}
                    onNavigateToTable={onNavigateToTable}
                    accessToken={accessToken}
                    teamSlug={teamSlug}
                    projectSlug={projectSlug}
                    isNewRow={highlightedRowSet.has(doc._id)}
                    highlightedColumns={highlightedColumnMap[doc._id]}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TableFooter
        tableName={selectedTable}
        tableSchema={tableSchema}
        documents={documents}
        adminClient={adminClient}
        componentId={componentId}
      />

      {cellMenuState && (
        <ContextMenu
          position={cellMenuState.position}
          items={buildCellMenuItems(
            cellMenuState.column,
            cellMenuState.value,
            cellMenuState.rowId,
            startEditing,
            {
              tableName: selectedTable,
              adminClient,
              deploymentUrl,
              componentId,
              onNavigateToTable,
              accessToken,
              teamSlug,
              projectSlug,
              filters,
              setFilters,
              onDeleteDocument: handleDeleteDocument,
              getDocument: (documentId: string) => {
                return documents.find(doc => doc._id === documentId);
              },
            },
          )}
          onClose={() => setCellMenuState(null)}
        />
      )}
    </div>
  );
};
