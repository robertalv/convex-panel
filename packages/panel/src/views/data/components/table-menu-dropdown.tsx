import React, { useEffect, useRef, useState } from 'react';
import { Code, Box, Fingerprint, BarChart3, X, Trash2 } from 'lucide-react';
import { createPortal } from 'react-dom';

export interface TableMenuDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  onCustomQuery: () => void;
  onSchema: () => void;
  onIndexes: () => void;
  onMetrics: () => void;
  onClearTable?: () => void;
  onDeleteTable?: () => void;
}

export const TableMenuDropdown: React.FC<TableMenuDropdownProps> = ({
  isOpen,
  onClose,
  position,
  onCustomQuery,
  onSchema,
  onIndexes,
  onMetrics,
  onClearTable,
  onDeleteTable,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  // Update position when it changes and ensure it's visible
  useEffect(() => {
    const menuWidth = 180;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let x = position.x;
    let y = position.y;
    
    // Ensure initial position is within viewport bounds
    // If menu would overflow right edge, position it to the left of the button
    if (x + menuWidth > viewportWidth) {
      x = Math.max(8, viewportWidth - menuWidth - 8);
    }
    // If menu would overflow left edge
    if (x < 8) {
      x = 8;
    }
    
    // Ensure vertical position is within viewport
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

    // Adjust position after render
    const adjustPosition = () => {
      if (menuRef.current) {
        const rect = menuRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const menuWidth = 180; // minWidth from styles
        
        let x = adjustedPosition.x;
        let y = adjustedPosition.y;

        // Adjust horizontal position - if menu would go off right edge, align to right edge of viewport
        const actualMenuWidth = rect.width || menuWidth;
        if (x + actualMenuWidth > viewportWidth) {
          x = Math.max(8, viewportWidth - actualMenuWidth - 8);
        }
        // If menu would go off left edge, align to left edge
        if (x < 8) {
          x = 8;
        }

        // Adjust vertical position - if menu would go off bottom, show above button instead
        if (y + rect.height > viewportHeight) {
          // Position above the button (we need the button position, but for now just move up)
          y = adjustedPosition.y - rect.height - 8;
        }
        if (y < 8) {
          y = 8;
        }

        // Only update if position changed
        if (x !== adjustedPosition.x || y !== adjustedPosition.y) {
          setAdjustedPosition({ x, y });
        }
      }
    };

    // Use requestAnimationFrame to ensure the element is rendered
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(adjustPosition);
    });

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };

  }, [isOpen, adjustedPosition, onClose]);

  if (!isOpen || !adjustedPosition) return null;

  const menuItems = [
    {
      icon: <Code size={14} />,
      label: 'Custom query',
      onClick: () => {
        onCustomQuery();
        onClose();
      },
    },
    {
      icon: <Box size={14} />,
      label: 'Schema',
      onClick: () => {
        onSchema();
        onClose();
      },
    },
    {
      icon: <Fingerprint size={14} />,
      label: 'Indexes',
      onClick: () => {
        onIndexes();
        onClose();
      },
    },
    {
      icon: <BarChart3 size={14} />,
      label: 'Metrics',
      onClick: () => {
        onMetrics();
        onClose();
      },
    },
    ...(onClearTable
      ? [
          {
            icon: <X size={14} />,
            label: 'Clear Table',
            onClick: () => {
              onClearTable();
              onClose();
            },
            destructive: true,
          },
        ]
      : []),
    ...(onDeleteTable
      ? [
          {
            icon: <Trash2 size={14} />,
            label: 'Delete Table',
            onClick: () => {
              onDeleteTable();
              onClose();
            },
            destructive: true,
          },
        ]
      : []),
  ];

  // Ensure we have valid position before rendering
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
        width: '180px',
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
          onClick={item.onClick}
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

