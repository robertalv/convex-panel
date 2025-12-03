import React from 'react';
import type { ReactNode } from 'react';
import { FixedSizeList } from 'react-window';
import type { ListChildComponentProps } from 'react-window';

export interface DropdownListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  itemHeight?: number;
  maxHeight?: number;
  virtualized?: boolean;
  emptyStateText?: string;
  emptyState?: ReactNode;
}

export function DropdownList<T>({
  items,
  renderItem,
  itemHeight = 36,
  maxHeight = 300,
  virtualized = false,
  emptyStateText = 'No items found',
  emptyState,
}: DropdownListProps<T>) {
  if (items.length === 0) {
    return (
      <div
        style={{
          padding: '12px',
          fontSize: '12px',
          color: 'var(--color-panel-text-secondary)',
          textAlign: 'center',
        }}
      >
        {emptyState || emptyStateText}
      </div>
    );
  }

  if (virtualized && items.length > 10) {
    const listHeight = Math.min(maxHeight, items.length * itemHeight);

    const Row = ({ index, style }: ListChildComponentProps) => {
      const item = items[index];
      return (
        <div style={style}>
          {renderItem(item, index)}
        </div>
      );
    };

    return (
      <div style={{ height: listHeight, maxHeight: `${maxHeight}px` }}>
        <FixedSizeList
          height={listHeight}
          itemCount={items.length}
          itemSize={itemHeight}
          width="100%"
        >
          {Row}
        </FixedSizeList>
      </div>
    );
  }

  return (
    <div
      style={{
        maxHeight: `${maxHeight}px`,
        overflowY: 'auto',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {items.map((item, index) => (
        <React.Fragment key={index}>{renderItem(item, index)}</React.Fragment>
      ))}
    </div>
  );
}

