import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { useThemeSafe } from '../../hooks/useTheme';

export interface DropdownOption<T> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

export interface DropdownProps<T> {
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  disabled?: boolean;
  triggerClassName?: string;
  triggerStyle?: React.CSSProperties;
  dropdownClassName?: string;
  dropdownStyle?: React.CSSProperties;
  optionClassName?: string;
  optionStyle?: React.CSSProperties;
  minWidth?: number;
  maxHeight?: number;
  align?: 'left' | 'right';
}

export function Dropdown<T = string | number>({
  value,
  options,
  onChange,
  placeholder = 'Select...',
  disabled = false,
  triggerClassName,
  triggerStyle,
  dropdownClassName,
  dropdownStyle,
  optionClassName,
  optionStyle,
  minWidth,
  maxHeight = 300,
  align = 'left',
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { theme } = useThemeSafe();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      // Use a small delay to avoid immediate closing when opening
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 10);
      
      // Handle escape key
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsOpen(false);
        }
      };
      document.addEventListener('keydown', handleEscape);
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value);

  const handleSelect = (optionValue: T) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  // Calculate dropdown position
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const updatePosition = () => {
        if (triggerRef.current) {
          const rect = triggerRef.current.getBoundingClientRect();
          
          setDropdownPosition({
            top: rect.bottom + 4,
            left: align === 'right' ? rect.right : rect.left,
            width: Math.max(minWidth || 0, rect.width),
          });
        }
      };
      
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        updatePosition();
      });
      
      // Update position on scroll/resize
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    } else {
      setDropdownPosition(null);
    }
  }, [isOpen, minWidth, align]);

  return (
    <div style={{ position: 'relative', height: 'inherit' }}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={triggerClassName}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%',
          minHeight: '100%',
          padding: '0 8px',
          backgroundColor: 'var(--color-panel-bg-tertiary)',
          border: 'none',
          borderRight: '1px solid var(--color-panel-border)',
          fontSize: '10px',
          color: 'var(--color-panel-text)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontFamily: 'monospace',
          outline: 'none',
          transition: 'background-color 0.2s',
          opacity: disabled ? 0.5 : 1,
          boxSizing: 'border-box',
          ...triggerStyle,
        }}
        onMouseEnter={(e) => {
          if (!disabled && !isOpen) {
            e.currentTarget.style.backgroundColor = 'var(--color-panel-active)';
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-tertiary)';
          }
        }}
      >
        <span style={{ 
          textAlign: 'center',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          size={12} 
          style={{ 
            color: 'var(--color-panel-text-muted)',
            marginLeft: '4px',
            flexShrink: 0,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }} 
        />
      </button>

      {isOpen && dropdownPosition && createPortal(
        <div
          ref={dropdownRef}
          className={`${dropdownClassName || ''} cp-theme-${theme}`.trim()}
          style={{
            position: 'fixed',
            top: `${dropdownPosition.top}px`,
            left: align === 'right' ? 'auto' : `${dropdownPosition.left}px`,
            right: align === 'right' ? `${window.innerWidth - dropdownPosition.left - dropdownPosition.width}px` : 'auto',
            width: `${dropdownPosition.width}px`,
            backgroundColor: 'var(--color-panel-bg-tertiary)',
            border: '1px solid var(--color-panel-border)',
            borderRadius: '8px',
            boxShadow: '0 4px 16px var(--color-panel-shadow)',
            zIndex: 99999,
            maxHeight: `${maxHeight}px`,
            overflow: 'auto',
            pointerEvents: 'auto',
            ...dropdownStyle,
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <div
                key={String(option.value)}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(option.value);
                }}
                className={optionClassName}
                style={{
                  padding: '6px 12px',
                  fontSize: '10px',
                  color: isSelected ? 'var(--color-panel-text)' : 'var(--color-panel-text-secondary)',
                  backgroundColor: isSelected ? 'var(--color-panel-active)' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontFamily: 'monospace',
                  transition: 'background-color 0.15s, color 0.15s',
                  ...optionStyle,
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
                    e.currentTarget.style.color = 'var(--color-panel-text)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--color-panel-text-secondary)';
                  }
                }}
              >
                {option.icon && (
                  <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    {option.icon}
                  </span>
                )}
                <span style={{ 
                  textAlign: 'center',
                  flex: 1,
                }}>
                  {option.label}
                </span>
                {isSelected && (
                  <span style={{ 
                    color: 'var(--color-panel-accent)',
                    fontSize: '12px',
                    flexShrink: 0,
                  }}>
                    ✓
                  </span>
                )}
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}

