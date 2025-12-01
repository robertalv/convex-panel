import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Code as CodeIcon, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { Checkbox } from '../../shared/checkbox';

interface MultiSelectComponentSelectorProps {
  selectedComponents: string[];
  onSelect: (components: string[]) => void;
  components?: string[];
}

export const MultiSelectComponentSelector: React.FC<MultiSelectComponentSelectorProps> = ({
  selectedComponents,
  onSelect,
  components = ['app'],
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

  // Filter out component IDs (long alphanumeric strings)
  const isComponentId = (component: string): boolean => {
    const trimmed = component.trim();
    if (trimmed.length < 20) return false;
    const alphanumericRatio = trimmed.replace(/[^a-zA-Z0-9]/g, '').length / trimmed.length;
    const hasCommonWords = /\b(app|component|module|lib|util|helper|service|api|auth|db|data|ui|view|page|layout|widget|plugin|addon|extension)\b/i.test(trimmed);
    return alphanumericRatio > 0.8 && !hasCommonWords;
  };

  const filteredComponents = useMemo(() => {
    return components.filter(component => {
      const trimmed = component?.trim();
      return trimmed && trimmed !== '' && !isComponentId(trimmed);
    });
  }, [components]);

  // Calculate width after filtered components are available
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      // Get filtered components for width calculation
      const filtered = components.filter(component => {
        const trimmed = component?.trim();
        return trimmed && trimmed !== '' && !isComponentId(trimmed);
      });
      
      if (filtered.length > 0) {
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
        filtered.forEach(component => {
          tempElement.textContent = component;
          const textWidth = tempElement.getBoundingClientRect().width;
          // Add padding (12px left + 12px right) + checkbox (14px) + icon (14px) + gap (8px * 2)
          const totalWidth = textWidth + 12 + 12 + 14 + 14 + 16;
          maxContentWidth = Math.max(maxContentWidth, totalWidth);
        });
        
        // Also measure the search placeholder
        tempElement.textContent = 'Search components...';
        const searchWidth = tempElement.getBoundingClientRect().width + 28 + 8 + 8; // padding + icon
        maxContentWidth = Math.max(maxContentWidth, searchWidth);
        
        document.body.removeChild(tempElement);
        
        // Calculate desired width (larger of trigger width or content width, with a minimum)
        const desiredWidth = Math.max(triggerWidth, maxContentWidth, 200);
        
        // Constrain to viewport - don't exceed available space
        const constrainedWidth = Math.min(desiredWidth, availableWidth);
        
        setDropdownWidth(constrainedWidth);
      }
    }
  }, [isOpen, components]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery) {
      return filteredComponents;
    }
    const normalizedQuery = searchQuery.toLowerCase();
    return filteredComponents.filter(component =>
      component.toLowerCase().includes(normalizedQuery)
    );
  }, [filteredComponents, searchQuery]);

  const allSelected = useMemo(() => {
    return filteredComponents.length > 0 && filteredComponents.every(comp => selectedComponents.includes(comp));
  }, [filteredComponents, selectedComponents]);

  const someSelected = useMemo(() => {
    return filteredComponents.some(comp => selectedComponents.includes(comp)) && !allSelected;
  }, [filteredComponents, selectedComponents, allSelected]);

  const handleSelectAll = () => {
    if (allSelected) {
      // Deselect all
      onSelect([]);
    } else {
      // Select all
      onSelect([...filteredComponents]);
    }
  };

  const handleToggleComponent = (component: string) => {
    if (selectedComponents.includes(component)) {
      onSelect(selectedComponents.filter(c => c !== component));
    } else {
      onSelect([...selectedComponents, component]);
    }
  };

  const handleSelectOnly = (component: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect([component]);
  };

  const displayText = selectedComponents.length === 0
    ? 'All components'
    : selectedComponents.length === filteredComponents.length
    ? 'All components'
    : `${selectedComponents.length} ${selectedComponents.length === 1 ? 'component' : 'components'}`;

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
                placeholder="Search components..."
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

          {/* Select All Option */}
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
              Select all
            </span>
          </div>

          {/* Component List */}
          <div
            style={{
              maxHeight: '300px',
              overflowY: 'auto',
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((component) => {
                const isSelected = selectedComponents.includes(component);

                return (
                  <div
                    key={component}
                    onClick={() => handleToggleComponent(component)}
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
                      onChange={() => handleToggleComponent(component)}
                      size={16}
                    />
                    <CodeIcon style={{ width: '14px', height: '14px', color: 'var(--color-panel-text-muted)', flexShrink: 0 }} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'visible', minWidth: 0, flex: 1 }}>{component}</span>
                    <span
                      onClick={(e) => handleSelectOnly(component, e)}
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
                No components found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
