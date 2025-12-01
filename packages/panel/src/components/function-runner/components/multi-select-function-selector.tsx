import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Code as CodeIcon, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { ModuleFunction } from '../../../utils/functionDiscovery';
import { CustomQuery } from '../function-runner';
import { Checkbox } from '../../shared/checkbox';

interface MultiSelectFunctionSelectorProps {
  selectedFunctions: (ModuleFunction | CustomQuery)[];
  onSelect: (functions: (ModuleFunction | CustomQuery)[]) => void;
  functions: ModuleFunction[];
  componentId?: string | null;
}

const isCustomQueryValue = (value: ModuleFunction | CustomQuery): value is CustomQuery =>
  'type' in value && value.type === 'customQuery';

export const MultiSelectFunctionSelector: React.FC<MultiSelectFunctionSelectorProps> = ({
  selectedFunctions,
  onSelect,
  functions,
  componentId,
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

  const filteredFunctions = useMemo(() => {
    const normalizedComponentId = componentId === 'app' ? null : componentId;

    return functions.filter((fn: ModuleFunction) => {
      let matchesComponent = false;

      if (!normalizedComponentId) {
        matchesComponent = fn.componentId === null || fn.componentId === undefined;
      } else {
        matchesComponent =
          (!!fn.identifier && fn.identifier.startsWith(`${normalizedComponentId}:`)) ||
          fn.componentId === normalizedComponentId;
      }

      return matchesComponent;
    });
  }, [functions, componentId]);

  const allOptions = useMemo(() => {
    return filteredFunctions.map((fn) => {
      const filePath = fn.file?.path || '';
      let fileName = filePath.split('/').pop() || filePath;
      if (fileName.endsWith('.js')) {
        fileName = fileName.slice(0, -3);
      }
      
      return {
        key: fn.identifier || fn.name || `function-${fn.name}`,
        label: fn.name || fn.identifier || 'Unnamed function',
        value: fn as ModuleFunction | CustomQuery,
        identifier: fn.identifier,
        searchValue: `${fn.name || ''} ${fn.identifier || ''} ${filePath || ''}`.toLowerCase(),
      };
    });
  }, [filteredFunctions]);

  // Calculate width after options are available
  useEffect(() => {
    if (isOpen && triggerRef.current && allOptions.length > 0) {
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
      tempElement.style.fontFamily = 'monospace';
      tempElement.style.whiteSpace = 'nowrap';
      document.body.appendChild(tempElement);
      
      let maxContentWidth = 0;
      
      // Measure the longest option text (including padding and icons)
      allOptions.forEach(option => {
        const text = option.identifier || option.label;
        tempElement.textContent = text;
        const textWidth = tempElement.getBoundingClientRect().width;
        // Add padding (12px left + 12px right) + checkbox (14px) + icon (14px) + gap (8px * 2)
        const totalWidth = textWidth + 12 + 12 + 14 + 14 + 16;
        maxContentWidth = Math.max(maxContentWidth, totalWidth);
      });
      
      // Also measure the search placeholder
      tempElement.textContent = 'Search functions...';
      const searchWidth = tempElement.getBoundingClientRect().width + 28 + 8 + 8; // padding + icon
      maxContentWidth = Math.max(maxContentWidth, searchWidth);
      
      document.body.removeChild(tempElement);
      
      // Calculate desired width (larger of trigger width or content width, with a minimum)
      const desiredWidth = Math.max(triggerWidth, maxContentWidth, 200);
      
      // Constrain to viewport - don't exceed available space
      const constrainedWidth = Math.min(desiredWidth, availableWidth);
      
      setDropdownWidth(constrainedWidth);
    }
  }, [isOpen, allOptions]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery) {
      return allOptions;
    }
    const normalizedQuery = searchQuery.toLowerCase();
    return allOptions.filter(option =>
      option.searchValue.includes(normalizedQuery)
    );
  }, [allOptions, searchQuery]);

  const isFunctionSelected = (option: typeof allOptions[0]): boolean => {
    return selectedFunctions.some(selected => {
      if (isCustomQueryValue(option.value) && isCustomQueryValue(selected)) {
        return true;
      }
      if (isCustomQueryValue(option.value) || isCustomQueryValue(selected)) {
        return false;
      }
      const optionIdentifier = (option.value as ModuleFunction).identifier;
      const selectedIdentifier = (selected as ModuleFunction).identifier;
      return !!optionIdentifier && !!selectedIdentifier && optionIdentifier === selectedIdentifier;
    });
  };

  const allSelected = useMemo(() => {
    return filteredOptions.length > 0 && filteredOptions.every(option => isFunctionSelected(option));
  }, [filteredOptions, selectedFunctions]);

  const someSelected = useMemo(() => {
    return filteredOptions.some(option => isFunctionSelected(option)) && !allSelected;
  }, [filteredOptions, selectedFunctions, allSelected]);

  const handleSelectAll = () => {
    if (allSelected) {
      // Deselect all
      onSelect([]);
    } else {
      // Select all
      onSelect(filteredOptions.map(opt => opt.value));
    }
  };

  const handleToggleFunction = (option: typeof allOptions[0]) => {
    const isSelected = isFunctionSelected(option);
    if (isSelected) {
      onSelect(selectedFunctions.filter(selected => {
        if (isCustomQueryValue(option.value) && isCustomQueryValue(selected)) {
          return false;
        }
        if (isCustomQueryValue(option.value) || isCustomQueryValue(selected)) {
          return true;
        }
        const optionIdentifier = (option.value as ModuleFunction).identifier;
        const selectedIdentifier = (selected as ModuleFunction).identifier;
        return !(!!optionIdentifier && !!selectedIdentifier && optionIdentifier === selectedIdentifier);
      }));
    } else {
      onSelect([...selectedFunctions, option.value]);
    }
  };

  const handleSelectOnly = (option: typeof allOptions[0], e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect([option.value]);
  };

  const displayText = selectedFunctions.length === 0
    ? 'All functions'
    : selectedFunctions.length === allOptions.length
    ? 'All functions'
    : `${selectedFunctions.length} ${selectedFunctions.length === 1 ? 'function' : 'functions'}`;

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
          <CodeIcon style={{ width: '14px', height: '14px', color: 'var(--color-panel-text-muted)' }} />
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
            maxHeight: '350px',
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
                placeholder="Search functions..."
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

          {/* Function List */}
          <div
            style={{
              maxHeight: '350px',
              overflowY: 'auto',
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected = isFunctionSelected(option);
                const functionName = option.label;
                let identifier = option.identifier || '';
                
                // Remove .js extension from identifier
                if (identifier) {
                  identifier = identifier.replace(/\.js:/g, ':').replace(/\.js$/g, '');
                }

                // Extract component and function name from identifier if it contains a colon
                let componentPart = '';
                let identifierFunctionName = '';
                if (identifier && identifier.includes(':')) {
                  const parts = identifier.split(':');
                  componentPart = parts[0];
                  identifierFunctionName = parts.slice(1).join(':');
                } else {
                  componentPart = identifier;
                }

                // Only show function name if it's different from what's in the identifier
                const shouldShowFunctionName = functionName && identifierFunctionName && functionName !== identifierFunctionName;

                return (
                  <div
                    key={option.key}
                    onClick={() => handleToggleFunction(option)}
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
                      onChange={() => handleToggleFunction(option)}
                      size={16}
                    />
                    <CodeIcon style={{ width: '14px', height: '14px', color: 'var(--color-panel-text-muted)', flexShrink: 0 }} />
                    <span style={{ fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 0, whiteSpace: 'nowrap', overflow: 'visible', minWidth: 0, flex: 1 }}>
                      {componentPart && (
                        <span style={{ color: 'var(--color-panel-text-muted)' }}>
                          {componentPart}
                        </span>
                      )}
                      {componentPart && (identifierFunctionName || functionName) && (
                        <span style={{ color: 'var(--color-panel-text-muted)', opacity: 0.6 }}>:</span>
                      )}
                      {(identifierFunctionName || functionName) && (
                        <span style={{ color: isSelected ? 'var(--color-panel-text)' : 'var(--color-panel-text-secondary)' }}>
                          {shouldShowFunctionName ? functionName : (identifierFunctionName || functionName)}
                        </span>
                      )}
                    </span>
                    <span
                      onClick={(e) => handleSelectOnly(option, e)}
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
                No functions found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
