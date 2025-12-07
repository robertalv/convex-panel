import React, { useMemo } from 'react';
import { MultiSelectCombobox } from '../shared/multi-select-combobox';
import { LOG_TYPES } from '../../utils/constants';
import type { MultiSelectValue } from '../../types/common';

interface MultiSelectLogTypeSelectorProps {
  selectedLogTypes: string[] | MultiSelectValue;
  onSelect: (logTypes: string[] | MultiSelectValue) => void;
}

export const MultiSelectLogTypeSelector: React.FC<MultiSelectLogTypeSelectorProps> = ({
  selectedLogTypes,
  onSelect,
}) => {
  const logTypeOptions = useMemo(() => LOG_TYPES.map((lt) => lt.value), []);

  const selectedOptions: MultiSelectValue = useMemo(() => {
    if (Array.isArray(selectedLogTypes)) {
      if (selectedLogTypes.length === logTypeOptions.length) {
        return 'all';
      }
      return selectedLogTypes;
    }
    return selectedLogTypes;
  }, [selectedLogTypes, logTypeOptions.length]);

  const handleSelect = (newValue: MultiSelectValue) => {
    if (newValue === 'all') {
      onSelect('all');
    } else {
      onSelect(newValue);
    }
  };

  return (
    <MultiSelectCombobox
      options={logTypeOptions}
      selectedOptions={selectedOptions}
      setSelectedOptions={handleSelect}
      unit="type"
      unitPlural="types"
      labelHidden
      disableSearch
    />
  );
};
