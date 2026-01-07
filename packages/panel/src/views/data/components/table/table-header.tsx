import React from "react";
import { Checkbox } from "../../../../components/shared/checkbox";
import { TableColumnHeader } from "./table-column-header";
import type { ColumnMeta } from "./data-table-utils";

export interface TableHeaderProps {
  columns: string[];
  getColumnWidth: (column: string) => number;
  columnMeta: Record<string, ColumnMeta>;
  dragState: {
    dragging?: string;
    over?: string;
    position?: "left" | "right";
  } | null;
  hoveredHeader: string | null;
  resizingHover: string | null;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  trailingSpacerWidth: number;
  onSelectAll: () => void;
  onColumnDragOver: (
    column: string,
    event: React.DragEvent<HTMLTableHeaderCellElement>,
  ) => void;
  onColumnDrop: (column: string) => void;
  onColumnDragEnd: () => void;
  onColumnMouseEnter: (column: string) => void;
  onColumnMouseLeave: (column: string) => void;
  onColumnDragStart: (
    column: string,
    event: React.DragEvent<HTMLDivElement>,
  ) => void;
  onColumnResizeStart: (
    column: string,
    event: React.PointerEvent<HTMLDivElement>,
  ) => void;
  onColumnResizeHoverEnter: (column: string) => void;
  onColumnResizeHoverLeave: (column: string) => void;
}

const TableHeaderComponent: React.FC<TableHeaderProps> = ({
  columns,
  getColumnWidth,
  columnMeta,
  dragState,
  hoveredHeader,
  resizingHover,
  isAllSelected,
  isIndeterminate,
  trailingSpacerWidth,
  onSelectAll,
  onColumnDragOver,
  onColumnDrop,
  onColumnDragEnd,
  onColumnMouseEnter,
  onColumnMouseLeave,
  onColumnDragStart,
  onColumnResizeStart,
  onColumnResizeHoverEnter,
  onColumnResizeHoverLeave,
}) => {
  return (
    <thead style={{ position: "sticky", top: 0, zIndex: 15 }}>
      <tr
        style={{
          borderBottom: "1px solid var(--color-panel-border)",
          fontSize: "12px",
          color: "var(--color-panel-text-secondary)",
          backgroundColor: "var(--color-panel-bg)",
        }}
      >
        <th
          style={{
            width: 40,
            minWidth: 40,
            maxWidth: 40,
            padding: 0,
            textAlign: "center",
            position: "sticky",
            left: 0,
            backgroundColor: "var(--color-panel-bg)",
            zIndex: 20,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRight: "1px solid var(--color-panel-border)",
            }}
          >
            <Checkbox
              aria-label="Select all rows"
              size={16}
              containerSize={28}
              checked={isAllSelected}
              indeterminate={isIndeterminate}
              onChange={onSelectAll}
            />
          </div>
        </th>
        {columns.map((column) => {
          const width = getColumnWidth(column);
          const isDragging = dragState?.dragging === column;

          return (
            <TableColumnHeader
              key={column}
              column={column}
              width={width}
              meta={columnMeta[column]}
              isDragging={isDragging}
              dragState={dragState}
              hoveredHeader={hoveredHeader}
              resizingHover={resizingHover}
              onDragOver={(event) => onColumnDragOver(column, event)}
              onDrop={() => onColumnDrop(column)}
              onDragEnd={onColumnDragEnd}
              onMouseEnter={() => onColumnMouseEnter(column)}
              onMouseLeave={() => onColumnMouseLeave(column)}
              onDragStart={(event) => onColumnDragStart(column, event)}
              onResizeStart={(event) => onColumnResizeStart(column, event)}
              onResizeHoverEnter={() => onColumnResizeHoverEnter(column)}
              onResizeHoverLeave={() => onColumnResizeHoverLeave(column)}
            />
          );
        })}
        <th
          style={{
            padding: "8px",
            width: trailingSpacerWidth,
            borderRight: "1px solid var(--color-panel-border)",
          }}
        ></th>
      </tr>
    </thead>
  );
};

// Memoize TableHeader to prevent re-renders when parent re-renders
// but header props haven't changed
export const TableHeader = React.memo(TableHeaderComponent);
