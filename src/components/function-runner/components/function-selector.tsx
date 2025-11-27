import React, { useCallback, useEffect, useMemo } from 'react';
import { Code as CodeIcon } from 'lucide-react';
import { ModuleFunction } from '../../../utils/functionDiscovery';
import { CustomQuery } from '../function-runner';
import {
  SearchableDropdown,
  SearchableDropdownOption,
} from '../../shared/searchable-dropdown';

interface FunctionSelectorProps {
  selectedFunction: ModuleFunction | CustomQuery | null;
  onSelect: (fn: ModuleFunction | CustomQuery) => void;
  functions: ModuleFunction[];
  componentId?: string | null;
}

const isCustomQueryValue = (value: ModuleFunction | CustomQuery): value is CustomQuery =>
  'type' in value && value.type === 'customQuery';

export const FunctionSelector: React.FC<FunctionSelectorProps> = ({
  selectedFunction,
  onSelect,
  functions,
  componentId,
}) => {
  useEffect(() => {
    console.log('[FunctionSelector] Props:', {
      functionsCount: functions.length,
      componentId,
      selectedFunction,
    });
  }, [functions, componentId, selectedFunction]);

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

      if (!matchesComponent) {
        console.log('[FunctionSelector] Function filtered out:', {
          name: fn.name,
          identifier: fn.identifier,
          componentId: fn.componentId,
          matchesComponent,
          currentComponentId: componentId,
          normalizedComponentId,
        });
      }

      return matchesComponent;
    });
  }, [functions, componentId]);

  useEffect(() => {
    console.log('[FunctionSelector] Filtered functions:', {
      totalFunctions: functions.length,
      filteredCount: filteredFunctions.length,
      componentId,
      filteredFunctions: filteredFunctions.map(f => ({
        name: f.name,
        identifier: f.identifier,
        componentId: f.componentId,
      })),
    });
  }, [functions.length, filteredFunctions, componentId]);

  const customQueryOption = useMemo<CustomQuery>(() => ({
    type: 'customQuery',
    table: null,
    componentId,
  }), [componentId]);

  const options = useMemo<SearchableDropdownOption<ModuleFunction | CustomQuery>[]>(() => {
    const functionOptions = filteredFunctions.map((fn, index) => ({
      key: fn.identifier || fn.name || `function-${index}`,
      label: fn.name || fn.identifier || 'Unnamed function',
      value: fn,
      icon: <CodeIcon style={{ width: '14px', height: '14px', color: '#999' }} />,
      searchValue: `${fn.name || ''} ${fn.identifier || ''}`.toLowerCase(),
    }));

    return [
      {
        key: 'custom-query',
        label: 'Custom test query',
        value: customQueryOption,
        icon: <CodeIcon style={{ width: '14px', height: '14px', color: '#999' }} />,
        searchValue: 'custom test query custom-query',
      },
      ...functionOptions,
    ];
  }, [filteredFunctions, customQueryOption]);

  useEffect(() => {
    console.log('[FunctionSelector] Options array:', {
      totalOptions: options.length,
      options: options.map((opt, idx) => ({
        index: idx,
        isCustomQuery: isCustomQueryValue(opt.value),
        label: opt.label,
        identifier: isCustomQueryValue(opt.value) ? 'custom-query' : (opt.value as ModuleFunction).identifier,
      })),
    });
  }, [options]);

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

