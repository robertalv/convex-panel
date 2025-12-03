import React, { useMemo } from 'react';
import { Code as CodeIcon } from 'lucide-react';
import {
  SearchableDropdown,
} from './shared/searchable-dropdown';
import type {
  SearchableDropdownOption,
} from './shared/searchable-dropdown';
import { isComponentId } from '../utils/components';

interface ComponentSelectorProps {
  selectedComponent: string | null;
  onSelect: (component: string | null) => void;
  components?: string[];
}

export const ComponentSelector: React.FC<ComponentSelectorProps> = ({
  selectedComponent,
  onSelect,
  components = ['app'],
}) => {
  const options = useMemo<SearchableDropdownOption<string>[]>(() => {
    return components
      .filter(component => {
        const trimmed = component?.trim();
        return trimmed && trimmed !== '' && !isComponentId(trimmed);
      })
      .map(component => ({
        key: component,
        label: component,
        value: component,
        icon: <CodeIcon style={{ width: '14px', height: '14px', color: 'var(--color-panel-text-muted)' }} />,
        searchValue: component.toLowerCase(),
      }));
  }, [components]);

  const handleSelect = (value: string) => onSelect(value);

  return (
    <SearchableDropdown
      selectedValue={selectedComponent}
      options={options}
      onSelect={handleSelect}
      placeholder="Select component..."
      searchPlaceholder="Search components..."
      emptyStateText="No components found"
      triggerIcon={<CodeIcon style={{ width: '14px', height: '14px' }} />}
      listMaxHeight={300}
    />
  );
};

