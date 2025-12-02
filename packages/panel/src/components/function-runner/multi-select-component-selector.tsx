import React, { useMemo, useState, useRef } from 'react';
import { Code as CodeIcon } from 'lucide-react';
import { Checkbox } from '../shared/checkbox';
import { isComponentId } from '../../utils/components';
import {
  DropdownShell,
  DropdownTrigger,
  DropdownPanel,
  DropdownSearch,
  DropdownList,
} from '../dropdowns';
import {
  useDropdownWidth,
  useFilteredOptions,
  useSelectionState,
} from '../../hooks/dropdowns';

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
  const triggerRef = useRef<HTMLDivElement>(null);

  const filteredComponents = useMemo(() => {
    return components.filter((component) => {
      const trimmed = component?.trim();
      return trimmed && trimmed !== '' && !isComponentId(trimmed);
    });
  }, [components]);

  const { filteredOptions, searchQuery, setSearchQuery, clearSearch } =
    useFilteredOptions(
      filteredComponents.map((c) => ({ value: c, label: c, searchValue: c.toLowerCase() })),
      (option) => option.searchValue
    );

  const selectionState = useSelectionState({
    items: filteredComponents,
    selected: selectedComponents,
    getKey: (item) => item,
  });

  const dropdownWidth = useDropdownWidth(
    triggerRef,
    isOpen,
    filteredComponents,
    (component) => component,
    {
      searchPlaceholder: 'Search components...',
      iconWidth: 14,
      checkboxWidth: 16,
    }
  );

  React.useEffect(() => {
    if (!isOpen) {
      clearSearch();
    }
  }, [isOpen, clearSearch]);

  const handleSelectAll = () => {
    if (selectionState.allSelected) {
      onSelect(selectionState.deselectAll());
    } else {
      onSelect(selectionState.selectAll());
    }
  };

  const handleToggleComponent = (component: string) => {
    const newSelection = selectionState.toggle(component);
    onSelect(newSelection);
  };

  const handleSelectOnly = (component: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(selectionState.selectOnly(component));
  };

  const displayText =
    selectedComponents.length === 0
      ? 'All components'
      : selectedComponents.length === filteredComponents.length
      ? 'All components'
      : `${selectedComponents.length} ${selectedComponents.length === 1 ? 'component' : 'components'}`;

  return (
    <DropdownShell isOpen={isOpen} onOpenChange={setIsOpen}>
      <DropdownTrigger
        ref={triggerRef}
        isOpen={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      >
        <CodeIcon
          style={{
            width: '14px',
            height: '14px',
            color: 'var(--color-panel-text-muted)',
          }}
        />
        <span>{displayText}</span>
      </DropdownTrigger>

      <DropdownPanel isOpen={isOpen} width={dropdownWidth} maxHeight={300}>
        <DropdownSearch
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search components..."
          onEscape={() => setIsOpen(false)}
        />

        {/* Select All Option */}
        <div
          onClick={handleSelectAll}
          style={{
            padding: '8px 12px',
            fontSize: '12px',
            color:
              selectionState.allSelected || selectionState.someSelected
                ? 'var(--color-panel-text)'
                : 'var(--color-panel-text-secondary)',
            backgroundColor:
              selectionState.allSelected || selectionState.someSelected
                ? 'var(--color-panel-active)'
                : 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
          onMouseEnter={(e) => {
            if (!selectionState.allSelected && !selectionState.someSelected) {
              e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
            }
          }}
          onMouseLeave={(e) => {
            if (!selectionState.allSelected && !selectionState.someSelected) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          <Checkbox
            checked={selectionState.allSelected}
            indeterminate={selectionState.someSelected}
            onChange={handleSelectAll}
            size={16}
          />
          <span
            style={{
              fontWeight:
                selectionState.allSelected || selectionState.someSelected ? 500 : 400,
            }}
          >
            Select all
          </span>
        </div>

        {/* Component List */}
        <DropdownList
          items={filteredOptions}
          renderItem={(option, index) => {
            const component = option.value;
            const isSelected = selectedComponents.includes(component);
            return (
              <div
                key={component}
                onClick={() => handleToggleComponent(component)}
                style={{
                  padding: '8px 12px',
                  fontSize: '12px',
                  color: isSelected
                    ? 'var(--color-panel-text)'
                    : 'var(--color-panel-text-secondary)',
                  backgroundColor: isSelected
                    ? 'var(--color-panel-active)'
                    : 'transparent',
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
                  const onlyButton = e.currentTarget.querySelector(
                    '.only-button'
                  ) as HTMLElement;
                  if (onlyButton) {
                    onlyButton.style.opacity = '1';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                  const onlyButton = e.currentTarget.querySelector(
                    '.only-button'
                  ) as HTMLElement;
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
                <CodeIcon
                  style={{
                    width: '14px',
                    height: '14px',
                    color: 'var(--color-panel-text-muted)',
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    whiteSpace: 'nowrap',
                    overflow: 'visible',
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  {component}
                </span>
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
          }}
          emptyStateText="No components found"
        />
      </DropdownPanel>
    </DropdownShell>
  );
};
