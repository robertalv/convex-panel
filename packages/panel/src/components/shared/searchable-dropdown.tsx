import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { usePortalTarget } from '../../contexts/portal-context';
import { useThemeSafe } from '../../hooks/useTheme';

export interface SearchableDropdownOption<T> {
  key: string;
  label: string | React.ReactNode;
  value: T;
  icon?: React.ReactNode;
  searchValue?: string;
}

interface SearchableDropdownProps<T> {
  selectedValue: T | null;
  options: SearchableDropdownOption<T>[];
  onSelect: (value: T) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyStateText?: string;
  triggerIcon?: React.ReactNode;
  listMaxHeight?: number;
  getIsSelected?: (selectedValue: T | null, option: SearchableDropdownOption<T>) => boolean;
}

const defaultPlaceholder = 'Select option...';
const defaultSearchPlaceholder = 'Search options...';

export function SearchableDropdown<T>({
  selectedValue,
  options,
  onSelect,
  placeholder = defaultPlaceholder,
  searchPlaceholder = defaultSearchPlaceholder,
  emptyStateText = 'No results found',
  triggerIcon,
  listMaxHeight = 300,
  getIsSelected,
}: SearchableDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const portalTarget = usePortalTarget();
  const { theme } = useThemeSafe();
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);

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

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  // Calculate dropdown position for portal
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const updatePosition = () => {
        if (triggerRef.current) {
          const rect = triggerRef.current.getBoundingClientRect();
          setDropdownPosition({
            top: rect.bottom + 4,
            left: rect.left,
            width: rect.width,
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
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery) {
      return options;
    }

    const normalizedQuery = searchQuery.toLowerCase();
    return options.filter(option => {
      // Use searchValue if provided, otherwise use label as string
      const searchableText = option.searchValue || (typeof option.label === 'string' ? option.label : '');
      return searchableText.toLowerCase().includes(normalizedQuery);
    });
  }, [options, searchQuery]);

  const selectedOption = useMemo(() => {
    if (!selectedValue) {
      return null;
    }

    return options.find(option =>
      getIsSelected ? getIsSelected(selectedValue, option) : selectedValue === option.value
    ) || null;
  }, [getIsSelected, options, selectedValue]);

  const displayLabel = selectedOption?.label || placeholder;

  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '-webkit-fill-available',
          height: '32px',
          padding: '0 12px',
          backgroundColor: 'var(--color-panel-bg-tertiary)',
          border: isOpen ? '1px solid var(--color-panel-accent)' : '1px solid var(--color-panel-border)',
          borderRadius: '6px',
          cursor: 'pointer',
          transition: 'color 0.15s',
          color: 'var(--color-panel-text-secondary)',
          fontSize: '12px',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--color-panel-text)' }}>
          {triggerIcon ? (
            <span style={{ color: 'var(--color-panel-text-muted)', display: 'flex', alignItems: 'center' }}>{triggerIcon}</span>
          ) : null}
          {typeof displayLabel === 'string' ? <span>{displayLabel}</span> : displayLabel}
        </div>
        {isOpen ? (
          <ChevronUp style={{ width: '14px', height: '14px', color: 'var(--color-panel-text-muted)' }} />
        ) : (
          <ChevronDown style={{ width: '14px', height: '14px', color: 'var(--color-panel-text-muted)' }} />
        )}
      </div>

      {isOpen && dropdownPosition && portalTarget && createPortal(
        <div
          ref={dropdownRef}
          className={`cp-theme-${theme}`}
          style={{
            position: 'fixed',
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            backgroundColor: 'var(--color-panel-bg)',
            border: '1px solid var(--color-panel-border)',
            borderRadius: '6px',
            boxShadow: '0 4px 16px var(--color-panel-shadow)',
            zIndex: 100000,
            maxHeight: `${listMaxHeight}px`,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            pointerEvents: 'auto',
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div style={{ padding: '8px', borderBottom: '1px solid var(--color-panel-border)' }}>
            <div style={{ position: 'relative' }}>
              <Search
                size={12}
                style={{
                  position: 'absolute',
                  left: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-panel-text-muted)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsOpen(false);
                  }
                }}
                autoFocus
                style={{
                  width: '-webkit-fill-available',
                  backgroundColor: 'var(--color-panel-bg-secondary)',
                  border: '1px solid var(--color-panel-border)',
                  borderRadius: '4px',
                  height: '28px',
                  paddingLeft: '28px',
                  paddingRight: '8px',
                  fontSize: '12px',
                  color: 'var(--color-panel-text)',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-panel-accent)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-panel-border)';
                }}
              />
            </div>
          </div>

          <div style={{
            maxHeight: `${listMaxHeight - 50}px`,
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
            minHeight: 0,
          }}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected = selectedOption ? option.key === selectedOption.key : false;

                return (
                  <div
                    key={option.key}
                    onClick={() => {
                      onSelect(option.value);
                      setIsOpen(false);
                    }}
                    style={{
                      padding: '8px 12px',
                      fontSize: '12px',
                      color: isSelected ? 'var(--color-panel-text)' : 'var(--color-panel-text-secondary)',
                      backgroundColor: isSelected ? 'var(--color-panel-active)' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {option.icon ? (
                      <span style={{ display: 'flex', alignItems: 'center' }}>{option.icon}</span>
                    ) : null}
                    <span>{option.label}</span>
                  </div>
                );
              })
            ) : (
              <div
                style={{
                  padding: '12px',
                  fontSize: '12px',
                  color: 'var(--color-panel-text-secondary)',
                  textAlign: 'center',
                }}
              >
                {emptyStateText}
              </div>
            )}
          </div>
        </div>,
        portalTarget
      )}
    </div>
  );
}

