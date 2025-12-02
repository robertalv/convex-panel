import React, { useCallback, useMemo } from 'react';
import { Code as CodeIcon } from 'lucide-react';
import { isCustomQueryValue, ModuleFunction } from '../../utils/functionDiscovery';
import { CustomQuery } from '../../types/functions';
import {
  SearchableDropdown,
  SearchableDropdownOption,
} from '../shared/searchable-dropdown';

interface FunctionSelectorProps {
  selectedFunction: ModuleFunction | CustomQuery | null;
  onSelect: (fn: ModuleFunction | CustomQuery) => void;
  functions: ModuleFunction[];
  componentId?: string | null;
}

export const FunctionSelector: React.FC<FunctionSelectorProps> = ({
  selectedFunction,
  onSelect,
  functions,
  componentId,
}) => {
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

  const customQueryOption = useMemo<CustomQuery>(() => ({
    type: 'customQuery',
    table: null,
    componentId,
  }), [componentId]);

  const options = useMemo<SearchableDropdownOption<ModuleFunction | CustomQuery>[]>(() => {
    const functionOptions = filteredFunctions.map((fn, index) => {
      const filePath = fn.file?.path || '';
      let fileName = filePath.split('/').pop() || filePath;
      if (fileName.endsWith('.js')) {
        fileName = fileName.slice(0, -3);
      }
      
      return {
        key: fn.identifier || fn.name || `function-${index}`,
        label: (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
            {filePath && (
              <span style={{ 
                fontFamily: 'monospace', 
                fontSize: '11px', 
                color: 'var(--color-panel-text-muted)',
                flexShrink: 0,
              }}>
                {fileName}
              </span>
            )}
            <span style={{ flex: 1 }}>{fn.name || fn.identifier || 'Unnamed function'}</span>
          </div>
        ),
        value: fn,
        icon: <CodeIcon style={{ width: '14px', height: '14px', color: 'var(--color-panel-text-muted)' }} />,
        searchValue: `${fn.name || ''} ${fn.identifier || ''} ${filePath || ''}`.toLowerCase(),
      };
    });

    return [
      {
        key: 'custom-query',
        label: 'Custom test query',
        value: customQueryOption,
        icon: <CodeIcon style={{ width: '14px', height: '14px', color: 'var(--color-panel-text-muted)' }} />,
        searchValue: 'custom test query custom-query',
      },
      ...functionOptions,
    ];
  }, [filteredFunctions, customQueryOption]);

  const getIsSelected = useCallback((
    current: ModuleFunction | CustomQuery | null,
    option: SearchableDropdownOption<ModuleFunction | CustomQuery>,
  ) => {
    if (!current) {
      return false;
    }

    if (isCustomQueryValue(option.value)) {
      return isCustomQueryValue(current);
    }

    if (isCustomQueryValue(current)) {
      return false;
    }

    const selectedIdentifier = (current as ModuleFunction).identifier;
    const optionIdentifier = (option.value as ModuleFunction).identifier;

    return !!selectedIdentifier && !!optionIdentifier && selectedIdentifier === optionIdentifier;
  }, []);

  return (
    <SearchableDropdown
      selectedValue={selectedFunction}
      options={options}
      onSelect={onSelect}
      placeholder="Select function..."
      searchPlaceholder="Search functions..."
      emptyStateText="No functions found"
      listMaxHeight={350}
      getIsSelected={getIsSelected}
    />
  );
};

