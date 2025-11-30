import React, { useMemo, useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { Checkbox } from '../../shared/checkbox';

interface MultiSelectLogTypeSelectorProps {
  selectedLogTypes: string[];
  onSelect: (logTypes: string[]) => void;
}

const LOG_TYPES = [
  { value: 'success', label: 'success' },
  { value: 'failure', label: 'failure' },
  { value: 'debug', label: 'debug' },
  { value: 'log / info', label: 'log / info' },
  { value: 'warn', label: 'warn' },
  { value: 'error', label: 'error' },
];

export const MultiSelectLogTypeSelector: React.FC<MultiSelectLogTypeSelectorProps> = ({
  selectedLogTypes,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownContentRef = useRef<HTMLDivElement>(null);
  const [dropdownWidth, setDropdownWidth] = useState<number | undefined>(undefined);

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
      setDropdownWidth(undefined);
    }
  }, [isOpen]);

  // Calculate width after log types are available
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      // Get the width of the trigger button and its position
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const triggerWidth = triggerRect.width;
      const triggerLeft = triggerRect.left;
      const viewportWidth = window.innerWidth;
      const availableWidth = viewportWidth - triggerLeft - 16; // 16px padding from edge
      
      // Calculate the minimum width needed for content
      // Create a temporary element to measure text width
      const tempElement = document.createElement('span');
      tempElement.style.visibility = 'hidden';
      tempElement.style.position = 'absolute';
      tempElement.style.fontSize = '12px';
      tempElement.style.whiteSpace = 'nowrap';
      document.body.appendChild(tempElement);
      
      let maxContentWidth = 0;
      
      // Measure the longest option text (including padding and icons)
      LOG_TYPES.forEach(logType => {
        tempElement.textContent = logType.label;
        const textWidth = tempElement.getBoundingClientRect().width;
        // Add padding (12px left + 12px right) + checkbox (16px) + gap (8px * 2)
        const totalWidth = textWidth + 12 + 12 + 16 + 16;
        maxContentWidth = Math.max(maxContentWidth, totalWidth);
      });
      
      // Also measure the search placeholder
      tempElement.textContent = 'Search log types...';
      const searchWidth = tempElement.getBoundingClientRect().width + 28 + 8 + 8; // padding + icon
      maxContentWidth = Math.max(maxContentWidth, searchWidth);
      
      document.body.removeChild(tempElement);
      
      // Calculate desired width (larger of trigger width or content width, with a minimum)
      const desiredWidth = Math.max(triggerWidth, maxContentWidth, 200);
      
      // Constrain to viewport - don't exceed available space
      const constrainedWidth = Math.min(desiredWidth, availableWidth);
      
      setDropdownWidth(constrainedWidth);
    }
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery) {
      return LOG_TYPES;
    }
    const normalizedQuery = searchQuery.toLowerCase();
    return LOG_TYPES.filter(logType =>
      logType.label.toLowerCase().includes(normalizedQuery)
    );
  }, [searchQuery]);

  const allSelected = useMemo(() => {
    return LOG_TYPES.length > 0 && LOG_TYPES.every(logType => selectedLogTypes.includes(logType.value));
  }, [selectedLogTypes]);

  const someSelected = useMemo(() => {
    return LOG_TYPES.some(logType => selectedLogTypes.includes(logType.value)) && !allSelected;
  }, [selectedLogTypes, allSelected]);

  const handleSelectAll = () => {
    if (allSelected) {
      // Deselect all
      onSelect([]);
    } else {
      // Select all
      onSelect(LOG_TYPES.map(logType => logType.value));
    }
  };

  const handleToggleLogType = (logType: string) => {
    if (selectedLogTypes.includes(logType)) {
      onSelect(selectedLogTypes.filter(t => t !== logType));
    } else {
      onSelect([...selectedLogTypes, logType]);
    }
  };

  const handleSelectOnly = (logType: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect([logType]);
  };

  const displayText = selectedLogTypes.length === 0
    ? 'All log types'
    : selectedLogTypes.length === LOG_TYPES.length
    ? 'All log types'
    : `${selectedLogTypes.length} ${selectedLogTypes.length === 1 ? 'type' : 'types'}`;

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
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
          <span>{displayText}</span>
        </div>
      </div>
      {isOpen && (
        <div
          ref={dropdownContentRef}
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            width: dropdownWidth ? `${dropdownWidth}px` : '100%',
            maxWidth: 'calc(100vw - 16px)',
            backgroundColor: 'var(--color-panel-bg)',
            border: '1px solid var(--color-panel-border)',
            borderRadius: '6px',
            boxShadow: '0 4px 16px var(--color-panel-shadow)',
            zIndex: 10000,
            maxHeight: '300px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Bar */}
          <div style={{ padding: '8px', borderBottom: '1px solid var(--color-panel-border)' }}>
            <div style={{ position: 'relative', width: '100%' }}>
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
                placeholder="Search log types..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsOpen(false);
                  }
                }}
                autoFocus
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
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
                  e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-tertiary)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-panel-border)';
                  e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-secondary)';
                }}
              />
            </div>
          </div>

          {/* Deselect All Option */}
          <div
            onClick={handleSelectAll}
            style={{
              padding: '8px 12px',
              fontSize: '12px',
              color: allSelected || someSelected ? 'var(--color-panel-text)' : 'var(--color-panel-text-secondary)',
              backgroundColor: allSelected || someSelected ? 'var(--color-panel-active)' : 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => {
              if (!allSelected && !someSelected) {
                e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
              }
            }}
            onMouseLeave={(e) => {
              if (!allSelected && !someSelected) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <Checkbox
              checked={allSelected}
              indeterminate={someSelected}
              onChange={handleSelectAll}
              size={16}
            />
            <span style={{ fontWeight: allSelected || someSelected ? 500 : 400 }}>
              {allSelected ? 'Deselect all' : 'Select all'}
            </span>
          </div>

          {/* Log Type List */}
          <div
            style={{
              maxHeight: '300px',
              overflowY: 'auto',
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((logType) => {
                const isSelected = selectedLogTypes.includes(logType.value);

                return (
                  <div
                    key={logType.value}
                    onClick={() => handleToggleLogType(logType.value)}
                    style={{
                      padding: '8px 12px',
                      fontSize: '12px',
                      color: isSelected ? 'var(--color-panel-text)' : 'var(--color-panel-text-secondary)',
                      backgroundColor: isSelected ? 'var(--color-panel-active)' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      minWidth: 0,
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
                      }
                      // Show only button on hover
                      const onlyButton = e.currentTarget.querySelector('.only-button') as HTMLElement;
                      if (onlyButton) {
                        onlyButton.style.opacity = '1';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                      // Hide only button on leave
                      const onlyButton = e.currentTarget.querySelector('.only-button') as HTMLElement;
                      if (onlyButton) {
                        onlyButton.style.opacity = '0';
                      }
                    }}
                  >
                    <Checkbox
                      checked={isSelected}
                      onChange={() => handleToggleLogType(logType.value)}
                      size={16}
                    />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'visible', minWidth: 0, flex: 1 }}>{logType.label}</span>
                    <span
                      onClick={(e) => handleSelectOnly(logType.value, e)}
                      className="only-button"
                      style={{
                        fontSize: '11px',
                        color: 'var(--color-panel-text-muted)',
                        cursor: 'pointer',
                        padding: '2px 4px',
                        marginLeft: 'auto',
                        flexShrink: 0,
                        opacity: 0,
                        transition: 'opacity 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--color-panel-text)';
                        e.currentTarget.style.textDecoration = 'underline';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--color-panel-text-muted)';
                        e.currentTarget.style.textDecoration = 'none';
                      }}
                    >
                      only
                    </span>
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
                No log types found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
