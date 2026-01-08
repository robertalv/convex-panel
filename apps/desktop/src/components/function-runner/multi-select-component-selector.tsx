import React, { useMemo } from 'react';
import { Code as CodeIcon } from 'lucide-react';
import { MultiSelectCombobox } from '../shared/multi-select-combobox';
import { isComponentId } from '../../utils/components';
import type { MultiSelectValue } from '../../types/common';

interface MultiSelectComponentSelectorProps {
  selectedComponents: string[] | MultiSelectValue;
  onSelect: (components: string[] | MultiSelectValue) => void;
  components?: string[];
}

export const MultiSelectComponentSelector: React.FC<MultiSelectComponentSelectorProps> = ({
  selectedComponents,
  onSelect,
  components = ['app'],
}) => {
  const filteredComponents = useMemo(() => {
    return components.filter((component) => {
      const trimmed = component?.trim();
      return trimmed && trimmed !== '' && !isComponentId(trimmed);
    });
  }, [components]);

  const selectedOptions: MultiSelectValue = useMemo(() => {
    if (typeof selectedComponents === 'string' && selectedComponents === 'all') {
      return 'all';
    }
    const selectedArray = Array.isArray(selectedComponents) ? selectedComponents : [];
    if (selectedArray.length === filteredComponents.length && filteredComponents.length > 0) {
      return 'all';
    }
    return selectedArray;
  }, [selectedComponents, filteredComponents.length]);

  const handleSelect = (newValue: MultiSelectValue) => {
    onSelect(newValue);
  };

  return (
    <MultiSelectCombobox
      options={filteredComponents}
      selectedOptions={selectedOptions}
      setSelectedOptions={handleSelect}
      unit="component"
      unitPlural="components"
      labelHidden
      triggerIcon={
        <CodeIcon
          style={{
            width: '14px',
            height: '14px',
            color: 'var(--color-panel-text-muted)',
          }}
        />
      }
    />
  );
};
