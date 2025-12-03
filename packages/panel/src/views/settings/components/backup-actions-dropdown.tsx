import React, { useEffect, useRef, useState } from 'react';
import { Download, RotateCcw, Trash2 } from 'lucide-react';
import { createPortal } from 'react-dom';

export interface BackupActionsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  onDownload: () => void;
  onRestore: () => void;
  onDelete: () => void;
}

export const BackupActionsDropdown: React.FC<BackupActionsDropdownProps> = ({
  isOpen,
  onClose,
  position,
  onDownload,
  onRestore,
  onDelete,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  // Update position when it changes and ensure it's visible
  useEffect(() => {
    const menuWidth = 150;
    const viewportWidth = window.innerWidth;
    
    let x = position.x;
    let y = position.y;
    
    // Ensure initial position is within viewport bounds
    if (x + menuWidth > viewportWidth) {
      x = Math.max(8, viewportWidth - menuWidth - 8);
    }
    if (x < 8) {
      x = 8;
    }
    
    if (y < 8) {
      y = 8;
    }
    
    setAdjustedPosition({ x, y });
  }, [position]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !adjustedPosition) return null;

  const menuItems = [
    {
      icon: <Download size={14} />,
      label: 'Download',
      onClick: () => {
        onDownload();
        onClose();
      },
    },
    {
      icon: <RotateCcw size={14} />,
      label: 'Restore',
      onClick: () => {
        onRestore();
        onClose();
      },
    },
    {
      icon: <Trash2 size={14} />,
      label: 'Delete',
      onClick: () => {
        onDelete();
        onClose();
      },
      destructive: true,
    },
  ];

  if (!adjustedPosition || adjustedPosition.x < 0 || adjustedPosition.y < 0) {
    return null;
  }

  return createPortal(
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: `${Math.max(0, adjustedPosition.x)}px`,
        top: `${Math.max(0, adjustedPosition.y)}px`,
        backgroundColor: 'var(--color-panel-bg-secondary)',
        border: '1px solid var(--color-panel-border)',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: 100000,
        width: '150px',
        padding: '4px',
        display: 'flex',
        flexDirection: 'column',
        pointerEvents: 'auto',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {menuItems.map((item, index) => (
        <button
          key={index}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            item.onClick();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '4px',
            color: item.destructive
              ? 'var(--color-panel-error)'
              : 'var(--color-panel-text)',
            fontSize: '12px',
            cursor: 'pointer',
            textAlign: 'left',
            width: '100%',
            transition: 'background-color 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </div>,
    document.body
  );
};
