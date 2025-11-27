import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export interface ContextMenuItemDescriptor {
  label: string;
  onClick: () => void;
  shortcut?: string;
  destructive?: boolean;
}

export type ContextMenuEntry = ContextMenuItemDescriptor | { type: 'divider' };

export interface ContextMenuProps {
  items: ContextMenuEntry[];
  position: { x: number; y: number };
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  items,
  position,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    const handleContextMenu = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={menuRef}
      className="global-context-menu"
      style={{
        position: 'fixed',
        top: position.y,
        left: position.x,
        minWidth: 220,
        backgroundColor: '#11151C',
        border: '1px solid #2D313A',
        borderRadius: 10,
        boxShadow: '0 20px 35px rgba(0,0,0,0.55)',
        padding: '6px 0',
        zIndex: 100000,
      }}
    >
      {items.map((item, index) => {
        if ('type' in item && item.type === 'divider') {
          return (
            <div
              key={`divider-${index}`}
              style={{
                borderTop: '1px solid #2C313D',
                margin: '6px 0',
              }}
            />
          );
        }
        const action = item as ContextMenuItemDescriptor;
        return (
          <button
            key={action.label}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              action.onClick();
            }}
            style={{
              width: '100%',
              padding: '6px 14px',
              backgroundColor: 'transparent',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
              color: action.destructive ? '#F87171' : '#E5E7EB',
              cursor: 'pointer',
              transition: 'background 0.15s,color 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = action.destructive ? 'rgba(248,113,113,0.10)' : '#232832';
              e.currentTarget.style.color = action.destructive ? '#ef4444' : '#fff';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = action.destructive ? '#F87171' : '#E5E7EB';
            }}
          >
            <span>{action.label}</span>
            {action.shortcut && (
              <span style={{ color: '#6B7280', fontSize: '11px' }}>
                {action.shortcut}
              </span>
            )}
          </button>
        );
      })}
    </div>,
    document.body,
  );
};

