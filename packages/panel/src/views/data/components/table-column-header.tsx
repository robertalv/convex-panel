import React from 'react';
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
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
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
        <SchemaHoverLabel column={column} meta={meta} />
      </div>
      {hoveredHeader === column && (
        <div
          draggable
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
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
            const svg = e.currentTarget.querySelector('svg');
            if (svg) svg.style.filter = 'brightness(1.75)';
          }}
          onMouseLeave={e => {
            const svg = e.currentTarget.querySelector('svg');
            if (svg) svg.style.filter = '';
          }}
        >
          <GripVertical size={12} color="#9CA3AF" />
        </div>
      )}
      <div
        onPointerDown={onResizeStart}
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
        onMouseEnter={onResizeHoverEnter}
        onMouseLeave={onResizeHoverLeave}
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
};

