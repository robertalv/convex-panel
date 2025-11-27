import React, { useMemo } from 'react';
import { Code as CodeIcon } from 'lucide-react';
import {
  SearchableDropdown,
  SearchableDropdownOption,
} from '../../shared/searchable-dropdown';

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
  const options = useMemo<SearchableDropdownOption<string>[]>(() => (
    components.map(component => ({
      key: component,
      label: component,
      value: component,
      icon: <CodeIcon style={{ width: '14px', height: '14px', color: '#999' }} />,
      searchValue: component.toLowerCase(),
    }))
  ), [components]);

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

