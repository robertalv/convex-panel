import React, { ReactNode, forwardRef } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export interface DropdownTriggerProps {
  isOpen: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const DropdownTrigger = forwardRef<HTMLDivElement, DropdownTriggerProps>(
  ({ isOpen, onClick, children, className, style }, ref) => {
    return (
      <div
        ref={ref}
        onClick={onClick}
        className={className}
        style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '-webkit-fill-available',
        height: '32px',
        padding: '0 12px',
        backgroundColor: 'var(--color-panel-bg-tertiary)',
        border: isOpen
          ? '1px solid var(--color-panel-accent)'
          : '1px solid var(--color-panel-border)',
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'color 0.15s',
        color: 'var(--color-panel-text-secondary)',
        fontSize: '12px',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!isOpen) {
          e.currentTarget.style.borderColor = 'var(--color-panel-text-muted)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isOpen) {
          e.currentTarget.style.borderColor = 'var(--color-panel-border)';
        }
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          color: 'var(--color-panel-text)',
        }}
      >
        {children}
      </div>
      {isOpen ? (
        <ChevronUp
          style={{
            width: '14px',
            height: '14px',
            color: 'var(--color-panel-text-muted)',
          }}
        />
      ) : (
        <ChevronDown
          style={{
            width: '14px',
            height: '14px',
            color: 'var(--color-panel-text-muted)',
          }}
        />
      )}
    </div>
    );
  }
);

DropdownTrigger.displayName = 'DropdownTrigger';

