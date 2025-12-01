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
  const options = useMemo<SearchableDropdownOption<string>[]>(() => {
    // Filter out components that are just IDs (long alphanumeric strings without meaningful names)
    const isComponentId = (component: string): boolean => {
      // Check if it's a long alphanumeric string (likely an ID)
      // IDs are typically 20+ characters of alphanumeric characters
      const trimmed = component.trim();
      if (trimmed.length < 20) return false;
      
      // Check if it's mostly alphanumeric with minimal special characters
      const alphanumericRatio = trimmed.replace(/[^a-zA-Z0-9]/g, '').length / trimmed.length;
      
      // If it's mostly alphanumeric and long, it's likely an ID
      // Also check if it doesn't contain common words that would indicate it's a name
      const hasCommonWords = /\b(app|component|module|lib|util|helper|service|api|auth|db|data|ui|view|page|layout|widget|plugin|addon|extension)\b/i.test(trimmed);
      
      return alphanumericRatio > 0.8 && !hasCommonWords;
    };

    return components
      .filter(component => {
        const trimmed = component?.trim();
        // Filter out empty strings and component IDs
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

