import React, { useCallback, useMemo } from 'react';
import { Code as CodeIcon } from 'lucide-react';
import { isCustomQueryValue } from '../../utils/api/functionDiscovery';
import type { ModuleFunction } from '../../utils/api/functionDiscovery';
import type { CustomQuery } from '../../types/functions';
import {
  SearchableDropdown,
} from '../shared/searchable-dropdown';
import type {
  SearchableDropdownOption,
} from '../shared/searchable-dropdown';

interface FunctionSelectorProps {
  selectedFunction: ModuleFunction | CustomQuery | null;
  onSelect: (fn: ModuleFunction | CustomQuery | null) => void;
  functions: ModuleFunction[];
  componentId?: string | null;
  allowAllOption?: boolean;
  showCustomQuery?: boolean;
}

export const FunctionSelector: React.FC<FunctionSelectorProps> = ({
  selectedFunction,
  onSelect,
  functions,
  componentId,
  allowAllOption = false,
  showCustomQuery = true,
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

  const options = useMemo<SearchableDropdownOption<ModuleFunction | CustomQuery | null>[]>(() => {
    const functionOptions = filteredFunctions.map((fn, index) => {
      // Extract file path and function name from identifier
      // Format: "path/to/file.js:functionName" or "component:path/to/file.js:functionName"
      let filePath = fn.file?.path || '';
      let functionName = fn.name || fn.identifier || 'Unnamed function';
      
      // Parse identifier to extract file path and function name
      if (fn.identifier && fn.identifier.includes(':')) {
        const parts = fn.identifier.split(':');
        // If it's HTTP action, use full identifier as name
        if (fn.identifier.startsWith('GET ') || fn.identifier.startsWith('POST ') || 
            fn.identifier.startsWith('PUT ') || fn.identifier.startsWith('DELETE ') ||
            fn.identifier.startsWith('PATCH ') || fn.identifier.startsWith('OPTIONS ')) {
          functionName = fn.identifier;
          filePath = '';
        } else {
          // Regular function: extract file path and function name
          const filePart = parts.slice(0, -1).join(':');
          functionName = parts[parts.length - 1];
          if (filePart) {
            filePath = filePart;
            // Remove .js extension if present
            if (filePath.endsWith('.js')) {
              filePath = filePath.slice(0, -3);
            }
          }
        }
      }
      
      // Format file name for display
      let fileName = filePath ? filePath.split('/').pop() || filePath : '';
      
      // Ensure unique key - use identifier with componentId if available to handle duplicates across components
      const uniqueKey = fn.identifier
        ? (fn.componentId ? `${fn.componentId}:${fn.identifier}` : fn.identifier)
        : fn.name
          ? (fn.componentId ? `${fn.componentId}:${fn.name}` : fn.name)
          : `function-${index}`;
      
      return {
        key: uniqueKey,
        label: (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
            {fileName && (
              <span style={{ 
                fontFamily: 'monospace', 
                fontSize: '11px', 
                color: 'var(--color-panel-text-muted)',
                flexShrink: 0,
              }}>
                {fileName}:
              </span>
            )}
            <span style={{ flex: 1 }}>{functionName}</span>
          </div>
        ),
        value: fn,
        icon: <CodeIcon style={{ width: '14px', height: '14px', color: 'var(--color-panel-text-muted)' }} />,
        searchValue: `${fn.name || ''} ${fn.identifier || ''} ${filePath || ''}`.toLowerCase(),
      };
    });

    const baseOptions: SearchableDropdownOption<ModuleFunction | CustomQuery | null>[] = [];

    // Add "All functions" option if enabled
    if (allowAllOption) {
      baseOptions.push({
        key: 'all-functions',
        label: 'All functions',
        value: null,
        icon: <CodeIcon style={{ width: '14px', height: '14px', color: 'var(--color-panel-text-muted)' }} />,
        searchValue: 'all functions',
      });
    }

    // Add custom query option if enabled
    if (showCustomQuery) {
      baseOptions.push({
        key: 'custom-query',
        label: 'Custom test query',
        value: customQueryOption,
        icon: <CodeIcon style={{ width: '14px', height: '14px', color: 'var(--color-panel-text-muted)' }} />,
        searchValue: 'custom test query custom-query',
      });
    }

    return [...baseOptions, ...functionOptions];
  }, [filteredFunctions, customQueryOption, allowAllOption, showCustomQuery]);

  const getIsSelected = useCallback((
    current: ModuleFunction | CustomQuery | null,
    option: SearchableDropdownOption<ModuleFunction | CustomQuery | null>,
  ) => {
    // Handle "All functions" option (null value)
    if (option.value === null) {
      return current === null;
    }

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

  // Handle placeholder text based on whether "All functions" is allowed
  const placeholder = allowAllOption ? 'All functions' : 'Select function...';

  return (
    <SearchableDropdown
      selectedValue={selectedFunction}
      options={options}
      onSelect={onSelect as (value: ModuleFunction | CustomQuery | null) => void}
      placeholder={placeholder}
      searchPlaceholder="Search functions..."
      emptyStateText="No functions found"
      listMaxHeight={350}
      getIsSelected={getIsSelected}
    />
  );
};

