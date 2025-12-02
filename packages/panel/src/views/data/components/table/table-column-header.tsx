import React from 'react';
import classNames from 'classnames';
import { GripVertical } from 'lucide-react';
import { SchemaHoverLabel } from './schema-hover-label';
import { ColumnMeta } from './data-table-utils';
import { MIN_COLUMN_WIDTH } from './data-table-utils';

export interface TableColumnHeaderProps {
  column: string;
  width: number;
  meta?: ColumnMeta;
  isDragging: boolean;
  dragState: {
    dragging?: string;
    over?: string;
    position?: 'left' | 'right';
  } | null;
  hoveredHeader: string | null;
  resizingHover: string | null;
  onDragOver: (event: React.DragEvent<HTMLTableHeaderCellElement>) => void;
  onDrop: () => void;
  onDragEnd: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onDragStart: (event: React.DragEvent<HTMLDivElement>) => void;
  onResizeStart: (event: React.PointerEvent<HTMLDivElement>) => void;
  onResizeHoverEnter: () => void;
  onResizeHoverLeave: () => void;
}

export const TableColumnHeader: React.FC<TableColumnHeaderProps> = ({
  column,
  width,
  meta,
  isDragging,
  dragState,
  hoveredHeader,
  resizingHover,
  onDragOver,
  onDrop,
  onDragEnd,
  onMouseEnter,
  onMouseLeave,
  onDragStart,
  onResizeStart,
  onResizeHoverEnter,
  onResizeHoverLeave,
}) => {
  return (
    <th
      className={classNames('cp-data-table__header-cell', {
        'cp-data-table__header-cell--dragging': isDragging,
      })}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        width,
        minWidth: width,
        maxWidth: width,
      }}
    >
      {dragState?.over === column && dragState.dragging !== column && (
        <div
          className="cp-data-table__drag-target"
          style={{ [dragState.position === 'left' ? 'left' : 'right']: -1 }}
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
        <SchemaHoverLabel column={column} meta={meta} />
      </div>
      {hoveredHeader === column && (
        <div
          className="cp-data-table__drag-handle"
          draggable
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
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
        className="cp-data-table__resize-area"
        onPointerDown={onResizeStart}
        onMouseEnter={onResizeHoverEnter}
        onMouseLeave={onResizeHoverLeave}
      >
        <span
          className={classNames('cp-data-table__resize-indicator', {
            'is-active': resizingHover === column,
          })}
        />
      </div>
    </th>
  );
};

