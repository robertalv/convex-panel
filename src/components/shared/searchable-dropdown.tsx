import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';

export interface SearchableDropdownOption<T> {
  key: string;
  label: string;
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
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
      const searchableText = option.searchValue || option.label;
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
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '-webkit-fill-available',
          height: '36px',
          padding: '0 12px',
          backgroundColor: '#16181D',
          border: isOpen ? '1px solid #3B82F6' : '1px solid #2D313A',
          borderRadius: '4px',
          cursor: 'pointer',
          transition: 'border-color 0.2s',
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = '#999';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = '#2D313A';
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#e5e7eb' }}>
          {triggerIcon ? (
            <span style={{ color: '#999', display: 'flex', alignItems: 'center' }}>{triggerIcon}</span>
          ) : null}
          <span>{displayLabel}</span>
        </div>
        {isOpen ? (
          <ChevronUp style={{ width: '14px', height: '14px', color: '#999' }} />
        ) : (
          <ChevronDown style={{ width: '14px', height: '14px', color: '#999' }} />
        )}
      </div>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            backgroundColor: '#0F1115',
            border: '1px solid #2D313A',
            borderRadius: '6px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            maxHeight: `${listMaxHeight}px`,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ padding: '8px', borderBottom: '1px solid #2D313A' }}>
            <div style={{ position: 'relative' }}>
              <Search
                size={12}
                style={{
                  position: 'absolute',
                  left: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6b7280',
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
                  backgroundColor: '#16181D',
                  border: '1px solid #2D313A',
                  borderRadius: '4px',
                  height: '28px',
                  paddingLeft: '28px',
                  paddingRight: '8px',
                  fontSize: '12px',
                  color: '#fff',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#3B82F6';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#2D313A';
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
                      fontSize: '14px',
                      color: isSelected ? '#fff' : '#d1d5db',
                      backgroundColor: isSelected ? '#2D313A' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = '#1C1F26';
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
                  color: '#9ca3af',
                  textAlign: 'center',
                }}
              >
                {emptyStateText}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

