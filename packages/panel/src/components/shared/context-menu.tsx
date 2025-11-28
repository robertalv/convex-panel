import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useThemeSafe } from '../../hooks/useTheme';

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

// Parse shortcut string to key combination
function parseShortcut(shortcut: string): {
  key: string;
  meta: boolean;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
} {
  const parts = shortcut.toLowerCase().split('+');
  return {
    key: parts[parts.length - 1],
    meta: parts.includes('meta') || parts.includes('cmd'),
    ctrl: parts.includes('ctrl'),
    shift: parts.includes('shift'),
    alt: parts.includes('alt'),
  };
}

// Check if keyboard event matches shortcut
function matchesShortcut(
  event: KeyboardEvent,
  shortcut: { key: string; meta: boolean; ctrl: boolean; shift: boolean; alt: boolean }
): boolean {
  const isMac = navigator.platform.includes('Mac');
  const key = event.key.toLowerCase();
  
  // Map special keys
  const keyMap: Record<string, string> = {
    'enter': 'return',
    ' ': 'space',
    'escape': 'esc',
  };
  
  const normalizedKey = keyMap[key] || key;
  const normalizedShortcutKey = keyMap[shortcut.key] || shortcut.key;
  
  if (normalizedKey !== normalizedShortcutKey) return false;
  
  // Check modifiers
  const metaMatch = shortcut.meta ? (isMac ? event.metaKey : event.ctrlKey) : !event.metaKey && !event.ctrlKey;
  const ctrlMatch = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey;
  const shiftMatch = shortcut.shift === event.shiftKey;
  const altMatch = shortcut.alt === event.altKey;
  
  // For Mac, meta takes precedence over ctrl
  if (isMac && shortcut.meta) {
    return metaMatch && shiftMatch && altMatch && !event.ctrlKey;
  }
  
  return metaMatch && ctrlMatch && shiftMatch && altMatch;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  items,
  position,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { theme } = useThemeSafe();
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  
  // Get only actionable items (no dividers)
  const actionableItems = items.filter(
    (item): item is ContextMenuItemDescriptor => !('type' in item && (item as { type: string }).type === 'divider')
  );
  
  // Map item index to actual index in items array
  const getItemIndex = useCallback((actionableIndex: number): number => {
    let actionableCount = 0;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!('type' in item && (item as { type: string }).type === 'divider')) {
        if (actionableCount === actionableIndex) {
          return i;
        }
        actionableCount++;
      }
    }
    return -1;
  }, [items]);

  // Execute selected item
  const executeSelected = useCallback(() => {
    if (selectedIndex >= 0 && selectedIndex < actionableItems.length) {
      actionableItems[selectedIndex].onClick();
      onClose();
    }
  }, [selectedIndex, actionableItems, onClose]);

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
        event.preventDefault();
        onClose();
        return;
      }

      // Arrow key navigation
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % actionableItems.length);
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + actionableItems.length) % actionableItems.length);
        return;
      }

      // Enter or Space to activate
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        executeSelected();
        return;
      }

      // Number keys for quick selection (1-9)
      const numKey = parseInt(event.key);
      if (!isNaN(numKey) && numKey >= 1 && numKey <= 9) {
        const index = numKey - 1;
        if (index < actionableItems.length) {
          event.preventDefault();
          actionableItems[index].onClick();
          onClose();
        }
        return;
      }

      // Check for shortcut matches
      for (const item of actionableItems) {
        if (item.shortcut) {
          const shortcut = parseShortcut(item.shortcut);
          if (matchesShortcut(event, shortcut)) {
            event.preventDefault();
            item.onClick();
            onClose();
            return;
          }
        }
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
  }, [onClose, actionableItems, executeSelected]);

  return createPortal(
    <div
      ref={menuRef}
      className={`global-context-menu cp-theme-${theme}`}
      style={{
        position: 'fixed',
        top: position.y,
        left: position.x,
        minWidth: 220,
        backgroundColor: 'var(--color-panel-bg-secondary)',
        border: '1px solid var(--color-panel-border)',
        borderRadius: 12,
        boxShadow: '0 20px 35px var(--color-panel-shadow)',
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
                borderTop: '1px solid var(--color-panel-border)',
                margin: '6px 0',
              }}
            />
          );
        }
        const action = item as ContextMenuItemDescriptor;
        const actionableIndex = actionableItems.findIndex(a => a === action);
        const isSelected = actionableIndex === selectedIndex;
        
        return (
          <button
            key={action.label}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              action.onClick();
              onClose();
            }}
            style={{
              width: '100%',
              padding: '6px 14px',
              backgroundColor: isSelected
                ? (action.destructive 
                    ? 'color-mix(in srgb, var(--color-panel-error) 10%, transparent)' 
                    : 'var(--color-panel-hover)')
                : 'transparent',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
              color: action.destructive ? 'var(--color-panel-error)' : 'var(--color-panel-text)',
              cursor: 'pointer',
              transition: 'background 0.15s,color 0.15s',
            }}
            onMouseEnter={() => {
              setSelectedIndex(actionableIndex);
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
              e.currentTarget.style.color = action.destructive ? 'var(--color-panel-error)' : 'var(--color-panel-text)';
            }}
          >
            <span>{action.label}</span>
            {action.shortcut && (
              <span style={{ color: 'var(--color-panel-text-muted)', fontSize: '11px' }}>
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

