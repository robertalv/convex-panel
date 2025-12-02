import React, { useState, useRef } from 'react';
import { Checkbox } from '../shared/checkbox';
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
import { LOG_TYPES, LogType } from '../../types/logs';

interface MultiSelectLogTypeSelectorProps {
  selectedLogTypes: string[];
  onSelect: (logTypes: string[]) => void;
}

export const MultiSelectLogTypeSelector: React.FC<MultiSelectLogTypeSelectorProps> = ({
  selectedLogTypes,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  const { filteredOptions, searchQuery, setSearchQuery, clearSearch } =
    useFilteredOptions(LOG_TYPES, (logType) => logType.label.toLowerCase());

  const selectedLogTypeObjects = React.useMemo(
    () => LOG_TYPES.filter((lt) => selectedLogTypes.includes(lt.value)),
    [selectedLogTypes]
  );

  const selectionState = useSelectionState<LogType>({
    items: LOG_TYPES,
    selected: selectedLogTypeObjects,
    getKey: (item) => item.value,
  });

  const dropdownWidth = useDropdownWidth(
    triggerRef,
    isOpen,
    LOG_TYPES,
    (logType) => logType.label,
    {
      searchPlaceholder: 'Search log types...',
      checkboxWidth: 16,
      iconWidth: 0,
    }
  );

  React.useEffect(() => {
    if (!isOpen) {
      clearSearch();
    }
  }, [isOpen, clearSearch]);

  const handleSelectAll = () => {
    if (selectionState.allSelected) {
      onSelect(selectionState.deselectAll().map((lt) => lt.value));
    } else {
      onSelect(selectionState.selectAll().map((lt) => lt.value));
    }
  };

  const handleToggleLogType = (logType: typeof LOG_TYPES[0]) => {
    const newSelection = selectionState.toggle(logType);
    onSelect(newSelection.map((lt) => lt.value));
  };

  const handleSelectOnly = (logType: typeof LOG_TYPES[0], e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(selectionState.selectOnly(logType).map((lt) => lt.value));
  };

  const displayText =
    selectedLogTypes.length === 0
      ? 'All log types'
      : selectedLogTypes.length === LOG_TYPES.length
      ? 'All log types'
      : `${selectedLogTypes.length} ${selectedLogTypes.length === 1 ? 'type' : 'types'}`;

  return (
    <DropdownShell isOpen={isOpen} onOpenChange={setIsOpen}>
      <DropdownTrigger
        ref={triggerRef}
        isOpen={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{displayText}</span>
      </DropdownTrigger>

      <DropdownPanel isOpen={isOpen} width={dropdownWidth} maxHeight={300}>
        <DropdownSearch
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search log types..."
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
            {selectionState.allSelected ? 'Deselect all' : 'Select all'}
          </span>
        </div>

        {/* Log Type List */}
        <DropdownList
          items={filteredOptions}
          renderItem={(logType, index) => {
            const isSelected = selectedLogTypes.includes(logType.value);
            return (
              <div
                key={logType.value}
                onClick={() => handleToggleLogType(logType)}
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
                  onChange={() => handleToggleLogType(logType)}
                  size={16}
                />
                <span
                  style={{
                    whiteSpace: 'nowrap',
                    overflow: 'visible',
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  {logType.label}
                </span>
                <span
                  onClick={(e) => handleSelectOnly(logType, e)}
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
          emptyStateText="No log types found"
        />
      </DropdownPanel>
    </DropdownShell>
  );
};
