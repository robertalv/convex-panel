import React, { useMemo, useState, useRef } from 'react';
import { Code as CodeIcon } from 'lucide-react';
import { isCustomQueryValue, ModuleFunction } from '../../utils/functionDiscovery';
import { CustomQuery } from '../../types/functions';
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
} from '../../hooks/dropdowns';

interface MultiSelectFunctionSelectorProps {
  selectedFunctions: (ModuleFunction | CustomQuery)[];
  onSelect: (functions: (ModuleFunction | CustomQuery)[]) => void;
  functions: ModuleFunction[];
  componentId?: string | null;
}

interface FunctionOption {
  key: string;
  label: string;
  value: ModuleFunction | CustomQuery;
  identifier?: string;
  searchValue: string;
  functionName: string;
  componentPart: string;
  identifierFunctionName: string;
  shouldShowFunctionName: boolean;
}

export const MultiSelectFunctionSelector: React.FC<MultiSelectFunctionSelectorProps> = ({
  selectedFunctions,
  onSelect,
  functions,
  componentId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

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

  const allOptions = useMemo<FunctionOption[]>(() => {
    return filteredFunctions.map((fn) => {
      const filePath = fn.file?.path || '';
      let fileName = filePath.split('/').pop() || filePath;
      if (fileName.endsWith('.js')) {
        fileName = fileName.slice(0, -3);
      }

      const functionName = fn.name || fn.identifier || 'Unnamed function';
      let identifier = fn.identifier || '';

      if (identifier) {
        identifier = identifier.replace(/\.js:/g, ':').replace(/\.js$/g, '');
      }

      let componentPart = '';
      let identifierFunctionName = '';
      if (identifier && identifier.includes(':')) {
        const parts = identifier.split(':');
        componentPart = parts[0];
        identifierFunctionName = parts.slice(1).join(':');
      } else {
        componentPart = identifier;
      }

      const shouldShowFunctionName = Boolean(
        functionName && identifierFunctionName && functionName !== identifierFunctionName
      );

      return {
        key: fn.identifier || fn.name || `function-${fn.name}`,
        label: functionName,
        value: fn as ModuleFunction | CustomQuery,
        identifier,
        searchValue: `${fn.name || ''} ${fn.identifier || ''} ${filePath || ''}`.toLowerCase(),
        functionName,
        componentPart,
        identifierFunctionName,
        shouldShowFunctionName,
      };
    });
  }, [filteredFunctions]);

  const { filteredOptions, searchQuery, setSearchQuery, clearSearch } =
    useFilteredOptions(allOptions, (option) => option.searchValue);

  const dropdownWidth = useDropdownWidth(
    triggerRef,
    isOpen,
    allOptions,
    (option) => option.identifier || option.label,
    {
      searchPlaceholder: 'Search functions...',
      fontSize: '12px',
      fontFamily: 'monospace',
      iconWidth: 14,
      checkboxWidth: 16,
    }
  );

  React.useEffect(() => {
    if (!isOpen) {
      clearSearch();
    }
  }, [isOpen, clearSearch]);

  const isFunctionSelected = (option: FunctionOption): boolean => {
    return selectedFunctions.some((selected) => {
      if (isCustomQueryValue(option.value) && isCustomQueryValue(selected)) {
        return true;
      }
      if (isCustomQueryValue(option.value) || isCustomQueryValue(selected)) {
        return false;
      }
      const optionIdentifier = (option.value as ModuleFunction).identifier;
      const selectedIdentifier = (selected as ModuleFunction).identifier;
      return (
        !!optionIdentifier && !!selectedIdentifier && optionIdentifier === selectedIdentifier
      );
    });
  };

  const allSelected = useMemo(() => {
    return filteredOptions.length > 0 && filteredOptions.every((option) => isFunctionSelected(option));
  }, [filteredOptions, selectedFunctions]);

  const someSelected = useMemo(() => {
    return (
      filteredOptions.some((option) => isFunctionSelected(option)) && !allSelected
    );
  }, [filteredOptions, selectedFunctions, allSelected]);

  const handleSelectAll = () => {
    if (allSelected) {
      onSelect([]);
    } else {
      onSelect(filteredOptions.map((opt) => opt.value));
    }
  };

  const handleToggleFunction = (option: FunctionOption) => {
    const isSelected = isFunctionSelected(option);
    if (isSelected) {
      onSelect(
        selectedFunctions.filter((selected) => {
          if (isCustomQueryValue(option.value) && isCustomQueryValue(selected)) {
            return false;
          }
          if (isCustomQueryValue(option.value) || isCustomQueryValue(selected)) {
            return true;
          }
          const optionIdentifier = (option.value as ModuleFunction).identifier;
          const selectedIdentifier = (selected as ModuleFunction).identifier;
          return !(
            !!optionIdentifier && !!selectedIdentifier && optionIdentifier === selectedIdentifier
          );
        })
      );
    } else {
      onSelect([...selectedFunctions, option.value]);
    }
  };

  const handleSelectOnly = (option: FunctionOption, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect([option.value]);
  };

  const displayText =
    selectedFunctions.length === 0
      ? 'All functions'
      : selectedFunctions.length === allOptions.length
      ? 'All functions'
      : `${selectedFunctions.length} ${selectedFunctions.length === 1 ? 'function' : 'functions'}`;

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

      <DropdownPanel isOpen={isOpen} width={dropdownWidth} maxHeight={350}>
        <DropdownSearch
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search functions..."
          onEscape={() => setIsOpen(false)}
        />

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
            {allSelected ? 'Deselect all' : 'Select all'}
          </span>
        </div>

        {/* Function List with Virtualization */}
        <DropdownList
          items={filteredOptions}
          renderItem={(option, index) => {
            const isSelected = isFunctionSelected(option);
            return (
              <div
                key={option.key}
                onClick={() => handleToggleFunction(option)}
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
                  onChange={() => handleToggleFunction(option)}
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
                    fontFamily: 'monospace',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'visible',
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  {option.componentPart && (
                    <span style={{ color: 'var(--color-panel-text-muted)' }}>
                      {option.componentPart}
                    </span>
                  )}
                  {option.componentPart &&
                    (option.identifierFunctionName || option.functionName) && (
                      <span style={{ color: 'var(--color-panel-text-muted)', opacity: 0.6 }}>
                        :
                      </span>
                    )}
                  {(option.identifierFunctionName || option.functionName) && (
                    <span
                      style={{
                        color: isSelected
                          ? 'var(--color-panel-text)'
                          : 'var(--color-panel-text-secondary)',
                      }}
                    >
                      {option.shouldShowFunctionName
                        ? option.functionName
                        : option.identifierFunctionName || option.functionName}
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
          }}
          itemHeight={36}
          maxHeight={350}
          virtualized={true}
          emptyStateText="No functions found"
        />
      </DropdownPanel>
    </DropdownShell>
  );
};
