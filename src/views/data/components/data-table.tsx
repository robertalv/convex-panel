import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Settings as SettingsIcon,
  GripVertical,
  MoreVertical,
} from 'lucide-react';
import {
  TableDocument,
  TableDefinition,
  TableField,
  TableSchema,
} from '../../../types';
import { Checkbox } from '../../../components/shared/checkbox';
import {
  ContextMenu,
  ContextMenuEntry,
} from '../../../components/shared/context-menu';
import { copyToClipboard } from '../../../utils/toast';

export interface DataTableProps {
  selectedTable: string;
  documents: TableDocument[];
  isLoading: boolean;
  tables: TableDefinition;
  visibleFields?: string[];
  selectedDocumentIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

const DEFAULT_COLUMN_WIDTH = 160;
const MIN_COLUMN_WIDTH = 96;

type ColumnMeta = {
  typeLabel: string;
  optional: boolean;
  linkTable?: string;
};

const formatValue = (value: any): string => {
  if (value === null || value === undefined) {
    return 'unset';
  }
  if (typeof value === 'boolean') {
    return value.toString();
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  if (typeof value === 'string') {
    if (value.length > 30) {
      return value;
    }
    return value;
  }
  if (value instanceof Date) {
    return value.toLocaleString();
  }
  if (typeof value === 'object') {
    try {
    return JSON.stringify(value);
    } catch {
      return '[object]';
    }
  }
  return String(value);
};

const getValueColor = (value: any): string => {
  if (typeof value === 'string' && value.length > 20) {
    return 'var(--color-panel-text)';
  }
  if (typeof value === 'boolean') {
    return 'var(--color-panel-warning)';
  }
  if (typeof value === 'number') {
    return 'var(--color-panel-warning)';
  }
  return 'var(--color-panel-text)';
};

const deriveTypeLabel = (field?: TableField): string => {
  if (!field) {
    return 'string';
  }
  if (field.shape.type === 'object' && field.shape.fields?.length) {
    return 'object';
  }
  if (field.shape.type === 'Id') {
    return field.shape.tableName ? `id<${field.shape.tableName}>` : 'id';
  }
  if (field.shape.shape && field.shape.shape.tableName) {
    return `id<${field.shape.shape.tableName}>`;
  }
  return field.shape.type ?? 'string';
};

const buildColumnMeta = (tableSchema?: TableSchema): Record<string, ColumnMeta> => {
  const meta: Record<string, ColumnMeta> = {
    _id: { typeLabel: 'id', optional: false },
    _creationTime: { typeLabel: 'timestamp', optional: false },
  };

  tableSchema?.fields?.forEach((field) => {
    meta[field.fieldName] = {
      typeLabel: deriveTypeLabel(field),
      optional: field.optional ?? false,
      linkTable:
        field.shape.tableName ??
        field.shape.shape?.tableName ??
        field.shape.fields?.find((f) => f.shape.tableName)?.shape.tableName,
    };
  });

  return meta;
};

const SchemaHoverLabel: React.FC<{
  column: string;
  meta?: ColumnMeta;
}> = ({ column, meta }) => {
  const [showPanel, setShowPanel] = useState(false);
  const timerRef = useRef<number | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleMouseEnter = () => {
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      setShowPanel(true);
    }, 2000);
  };

  const handleMouseLeave = () => {
    clearTimer();
    setShowPanel(false);
  };

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span>{column}</span>
      {showPanel && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            minWidth: 200,
            padding: '8px 12px',
            backgroundColor: 'var(--color-panel-bg-tertiary)',
            border: '1px solid var(--color-panel-border)',
            borderRadius: '6px',
            boxShadow: '0 10px 25px var(--color-panel-shadow)',
            zIndex: 30,
            color: 'var(--color-panel-text)',
            fontSize: '12px',
            lineHeight: 1.4,
          }}
        >
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--color-panel-text-secondary)', marginBottom: 6 }}>
            Schema
          </div>
          <div style={{ marginBottom: 4 }}>
            Type:{' '}
            <span style={{ color: 'var(--color-panel-text)' }}>
              {meta?.typeLabel ?? 'unknown'}
            </span>
          </div>
          <div style={{ marginBottom: 4 }}>
            Optional:{' '}
            <span style={{ color: meta?.optional ? 'var(--color-panel-warning)' : 'var(--color-panel-success)' }}>
              {meta?.optional ? 'Yes' : 'No'}
            </span>
          </div>
          {meta?.linkTable && (
            <div>
              References:{' '}
              <span style={{ color: 'var(--color-panel-accent)' }}>{meta.linkTable}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const DataTable: React.FC<DataTableProps> = ({
  selectedTable,
  documents,
  isLoading,
  tables,
  visibleFields,
  selectedDocumentIds,
  onSelectionChange,
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

  const tableContainerRef = useRef<HTMLDivElement>(null);

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
    return <EmptyTableState columns={columnsForEmptyState} />;
  }, [orderedColumns]);

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
              <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <tr
                  style={{
                  borderBottom: '1px solid var(--color-panel-border)',
                  fontSize: '12px',
                    color: 'var(--color-panel-text-secondary)',
                    backgroundColor: 'var(--color-panel-bg)',
                  }}
                >
                  <th
                    style={{
                      width: 40,
                      minWidth: 40,
                      maxWidth: 40,
                      padding: 0,
                      textAlign: 'center',
                      position: 'sticky',
                      left: 0,
                  backgroundColor: 'var(--color-panel-bg)',
                      zIndex: 11,
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRight: '1px solid var(--color-panel-border)',
                      }}
                    >
                      <Checkbox
                        aria-label="Select all rows"
                        size={16}
                        containerSize={28}
                        checked={isAllSelected}
                        indeterminate={isIndeterminate}
                        onChange={toggleSelectAll}
                      />
                    </div>
                  </th>
                  {orderedColumns.map((column) => {
                    const width = getColumnWidth(column);
                    const isDragging = dragState?.dragging === column;

                    return (
                    <th
                      key={column}
                        onDragOver={(event) => handleDragOver(column, event)}
                        onDrop={() => handleDrop(column)}
                        onDragEnd={handleDragEnd}
                        onMouseEnter={() => setHoveredHeader(column)}
                        onMouseLeave={() => setHoveredHeader((prev) => (prev === column ? null : prev))}
                      style={{
                          padding: '8px 12px',
                        fontWeight: 500,
                          position: 'relative',
                          borderRight: '1px solid var(--color-panel-border)',
                          cursor: 'default',
                          color: 'var(--color-panel-text-secondary)',
                          backgroundColor: isDragging ? 'var(--color-panel-active)' : 'var(--color-panel-bg)',
                          width,
                          minWidth: width,
                          maxWidth: width,
                          userSelect: 'none',
                        }}
                      >
                        {dragState?.over === column && dragState.dragging !== column && (
                          <div
                            style={{
                              position: 'absolute',
                              top: 4,
                              bottom: 4,
                              width: 3,
                              borderRadius: 999,
                              background: 'linear-gradient(180deg, var(--color-panel-success), var(--color-panel-success))',
                              boxShadow: '0 0 12px color-mix(in srgb, var(--color-panel-success) 70%, transparent)',
                              [dragState.position === 'left' ? 'left' : 'right']: -1,
                              pointerEvents: 'none',
                            }}
                          />
                        )}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '8px',
                          }}
                        >
                          <SchemaHoverLabel column={column} meta={columnMeta[column]} />
                        </div>
                        {hoveredHeader === column && (
                          <div
                            draggable
                            onDragStart={(event) => {
                              event.dataTransfer.effectAllowed = 'move';
                              event.dataTransfer.setData('text/plain', column);
                              handleDragStart(column);
                            }}
                            onDragEnd={handleDragEnd}
                            style={{
                              position: 'absolute',
                              top: '50%',
                              right: 6,
                              transform: 'translateY(-50%)',
                              cursor: 'grab',
                              width: 18,
                              height: 24,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: 'transparent',
                              transition: 'filter 0.15s',
                            }}
                            onMouseEnter={e => {
                              // lighten the icon using a filter (children is <GripVertical ... />)
                              const svg = e.currentTarget.querySelector('svg');
                              if (svg) svg.style.filter = 'brightness(1.75)';
                            }}
                            onMouseLeave={e => {
                              // reset the icon brightness
                              const svg = e.currentTarget.querySelector('svg');
                              if (svg) svg.style.filter = '';
                            }}
                          >
                            <GripVertical size={12} color="#9CA3AF" />
                          </div>
                        )}
                        <div
                          onPointerDown={(event) => startResizing(column, event)}
                          style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            bottom: 0,
                            width: 8,
                            cursor: 'col-resize',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          onMouseEnter={() => setResizingHover(column)}
                          onMouseLeave={() => setResizingHover((prev) => (prev === column ? null : prev))}
                        >
                          <span
                            style={{
                              width: 2,
                              height: '70%',
                              borderRadius: 999,
                              backgroundColor: resizingHover === column ? 'var(--color-panel-success)' : 'transparent',
                              boxShadow:
                                resizingHover === column
                                  ? '0 0 8px color-mix(in srgb, var(--color-panel-success) 70%, transparent)'
                                  : 'none',
                              transition: 'background-color 0.15s ease, box-shadow 0.15s ease',
                            }}
                          />
                        </div>
                    </th>
                    );
                  })}
                  <th
                    style={{
                      padding: '8px',
                      width: trailingSpacerWidth,
                      borderRight: '1px solid var(--color-panel-border)',
                    }}
                  ></th>
                </tr>
              </thead>
              <tbody
                style={{
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  color: 'var(--color-panel-text)',
                }}
              >
                {documents.map((doc: TableDocument) => (
                <tr
                  key={doc._id}
                  style={{
                    borderBottom: '1px solid var(--color-panel-border)',
                    transition: 'background-color 0.15s ease',
                    backgroundColor: selectedDocumentIds.includes(doc._id)
                      ? 'var(--color-panel-active)'
                      : 'transparent',
                  }}
                >
                    <td
                      style={{
                        padding: 0,
                        textAlign: 'center',
                        width: 40,
                        minWidth: 40,
                        maxWidth: 40,
                        position: 'sticky',
                        left: 0,
                        backgroundColor: 'var(--color-panel-bg)',
                        zIndex: 11,
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRight: '1px solid var(--color-panel-border)',
                        }}
                      >
                        <Checkbox
                          aria-label={`Select row ${doc._id}`}
                          size={16}
                          containerSize={28}
                          checked={selectedDocumentIds.includes(doc._id)}
                          onChange={() => toggleRowSelection(doc._id)}
                        />
                      </div>
                  </td>
                    {orderedColumns.map((column) => {
                    const value = doc[column as keyof TableDocument];
                      const width = getColumnWidth(column);
                      const isUnset = value === null || value === undefined;
                      const isHovered =
                        hoveredCell?.rowId === doc._id &&
                        hoveredCell?.column === column;
                      const isMenuOpen =
                        cellMenuState?.rowId === doc._id &&
                        cellMenuState?.column === column;
                    return (
                      <td
                        key={column}
                        style={{
                            padding: 0,
                            borderRight: '1px solid var(--color-panel-border)',
                            width,
                            minWidth: width,
                            maxWidth: width,
                            backgroundColor: isMenuOpen
                              ? 'var(--color-panel-active)'
                              : isHovered
                                ? 'var(--color-panel-hover)'
                                : 'transparent',
                          }}
                          onMouseEnter={() =>
                            setHoveredCell({ rowId: doc._id, column })
                          }
                          onMouseLeave={() =>
                            setHoveredCell((prev) =>
                              prev &&
                              prev.rowId === doc._id &&
                              prev.column === column
                                ? null
                                : prev,
                            )
                          }
                          onContextMenu={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            const position = clampPosition(
                              event.clientX,
                              event.clientY,
                            );
                            setCellMenuState({
                              rowId: doc._id,
                              column,
                              value,
                              position,
                            });
                          }}
                        >
                          <div
                            style={{
                              position: 'relative',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 12px',
                              gap: '8px',
                            }}
                          >
                            <span
                              style={{
                                color: isUnset ? 'var(--color-panel-text-muted)' : getValueColor(value),
                          whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                fontStyle: isUnset ? 'italic' : 'normal',
                                flex: 1,
                        }}
                      >
                        {formatValue(value)}
                            </span>
                            {(isHovered || isMenuOpen) && (
                              <button
                                type="button"
                                data-menu-trigger
                                onClick={(event) => {
                                  event.stopPropagation();
                                  const rect =
                                    event.currentTarget.getBoundingClientRect();
                                  const position = clampPosition(
                                    rect.right,
                                    rect.bottom,
                                  );
                                  setCellMenuState(
                                    isMenuOpen
                                      ? null
                                      : {
                                          rowId: doc._id,
                                          column,
                                          value,
                                          position,
                                        },
                                  );
                                }}
                                style={{
                                  width: 22,
                                  height: 22,
                                  borderRadius: 6,
                                  border: '1px solid var(--color-panel-border)',
                                  backgroundColor: 'var(--color-panel-bg-tertiary)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'var(--color-panel-text)',
                                  cursor: 'pointer',
                                }}
                              >
                                <MoreVertical 
                                  size={12}
                                  color="var(--color-panel-text-secondary)"
                                />
                              </button>
                            )}
                          </div>
                      </td>
                    );
                  })}
                    <td
                      style={{
                        padding: '8px',
                        width: trailingSpacerWidth,
                        borderRight: '1px solid var(--color-panel-border)',
                      }}
                    ></td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      <div
        style={{
        height: '40px',
        borderTop: '1px solid var(--color-panel-border)',
        backgroundColor: 'var(--color-panel-bg)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        flexShrink: 0,
        }}
      >
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--color-panel-text-muted)',
            fontSize: '12px',
            border: '1px solid var(--color-panel-border)',
            borderRadius: '4px',
            padding: '6px 12px',
            backgroundColor: 'transparent',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--color-panel-text)';
            e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-tertiary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--color-panel-text-muted)';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <SettingsIcon size={12} />
          Schema
        </button>
      </div>

      {cellMenuState && (
        <ContextMenu
          position={cellMenuState.position}
          items={buildCellMenuItems(
            cellMenuState.column,
            cellMenuState.value,
            cellMenuState.rowId,
          )}
          onClose={() => setCellMenuState(null)}
        />
      )}
    </div>
  );
};

const buildCellMenuItems = (
  column: string,
  value: any,
  rowId: string,
): ContextMenuEntry[] => [
  {
    label: `View ${column}`,
    shortcut: 'Space',
    onClick: () => console.log('View field', column, value),
  },
  {
    label: `Copy ${column}`,
    shortcut: '⌘C',
    onClick: () => copyToClipboard(formatValue(value)),
  },
  {
    label: `Edit ${column}`,
    shortcut: '↩',
    onClick: () => console.log('Edit field', column, rowId),
  },
  { type: 'divider' },
  {
    label: 'Filter equals',
    onClick: () => console.log('Filter equals', column, value),
  },
  {
    label: 'Filter is not null',
    onClick: () => console.log('Filter is not null', column),
  },
  { type: 'divider' },
  {
    label: 'View document',
    shortcut: '⇧Space',
    onClick: () => console.log('View document', rowId),
  },
  {
    label: 'Copy document',
    shortcut: '⌘⇧C',
    onClick: () => console.log('Copy document', rowId),
  },
  {
    label: 'Delete document',
    destructive: true,
    onClick: () => console.log('Delete document', rowId),
  },
];

const EmptyTableState: React.FC<{ columns: string[] }> = ({ columns }) => {
  const placeholderColumns = columns.length ? columns : ['_id', '_creationTime'];
  const tableRef = useRef<HTMLDivElement | null>(null);
  const [fakeRows, setFakeRows] = useState(18);

  useEffect(() => {
    if (!tableRef.current) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const height = entries[0]?.contentRect?.height ?? 0;
      const rowHeight = 32;
      setFakeRows(Math.max(10, Math.ceil(height / rowHeight) + 5));
    });
    observer.observe(tableRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%', overflow: 'hidden' }}>
      <div
        ref={tableRef}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          maskImage:
            'linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.55) 30%, transparent 90%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.55) 30%, transparent 90%)',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            tableLayout: 'fixed',
            fontSize: '12px',
            color: 'var(--color-panel-text-muted)',
          }}
        >
          <thead>
            <tr style={{ backgroundColor: 'color-mix(in srgb, var(--color-panel-bg) 85%, transparent)' }}>
              {placeholderColumns.map((column) => (
                <th
                  key={column}
                  style={{
                    textAlign: 'left',
                    padding: '8px 12px',
                    borderRight: '1px solid color-mix(in srgb, var(--color-panel-border) 60%, transparent)',
                    borderBottom: '1px solid color-mix(in srgb, var(--color-panel-border) 60%, transparent)',
                    textTransform: 'lowercase',
                  }}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: fakeRows }).map((_, rowIdx) => (
              <tr key={`empty-row-${rowIdx}`}>
                {placeholderColumns.map((column) => (
                  <td
                    key={`${rowIdx}-${column}`}
                    style={{
                      padding: '6px 12px',
                      borderRight: '1px solid color-mix(in srgb, var(--color-panel-border) 30%, transparent)',
                      borderBottom: '1px solid color-mix(in srgb, var(--color-panel-border) 30%, transparent)',
                    }}
                  >
                    <div
                      style={{
                        height: '12px',
                        borderRadius: '999px',
                        backgroundColor: 'var(--color-panel-hover)',
                        width: `${60 + Math.random() * 30}%`,
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-panel-bg) 92%, transparent)',
            border: '1px solid var(--color-panel-border)',
            borderRadius: '24px',
            padding: '32px 40px',
            textAlign: 'center',
            color: 'var(--color-panel-text)',
            maxWidth: 420,
            width: '90%',
            boxShadow: '0 25px 55px var(--color-panel-shadow)',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              margin: '0 auto 16px',
              borderRadius: '12px',
              backgroundColor: 'var(--color-panel-bg-tertiary)',
              border: '1px solid var(--color-panel-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
            }}
          >
            ⌗
          </div>
          <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 600 }}>
            This table is empty.
          </h3>
          <p
            style={{
              margin: '0 0 20px',
              fontSize: '13px',
              color: 'var(--color-panel-text-secondary)',
              lineHeight: 1.5,
            }}
          >
            Create a document or run a mutation to start storing data.
          </p>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <button
              type="button"
              style={{
                pointerEvents: 'auto',
                height: '36px',
                borderRadius: '8px',
                border: '1px solid var(--color-panel-border)',
                background: 'transparent',
                color: 'var(--color-panel-text)',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              + Add Documents
            </button>
            <a
              href="https://docs.convex.dev/quickstarts"
              target="_blank"
              rel="noreferrer"
              style={{
                pointerEvents: 'auto',
                fontSize: '12px',
                color: 'var(--color-panel-success)',
                textDecoration: 'none',
              }}
            >
              Follow a quickstart guide →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

