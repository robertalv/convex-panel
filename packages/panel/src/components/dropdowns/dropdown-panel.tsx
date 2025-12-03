import React from 'react';
import type { ReactNode } from 'react';

export interface DropdownPanelProps {
  isOpen: boolean;
  width?: number | string;
  maxHeight?: number;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const DropdownPanel: React.FC<DropdownPanelProps> = ({
  isOpen,
  width,
  maxHeight = 300,
  children,
  className,
  style,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={className}
      style={{
        position: 'absolute',
        top: 'calc(100% + 4px)',
        left: 0,
        width: width ? (typeof width === 'number' ? `${width}px` : width) : '100%',
        maxWidth: 'calc(100vw - 16px)',
        backgroundColor: 'var(--color-panel-bg)',
        border: '1px solid var(--color-panel-border)',
        borderRadius: '6px',
        boxShadow: '0 4px 16px var(--color-panel-shadow)',
        zIndex: 10000,
        maxHeight: `${maxHeight}px`,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
};

