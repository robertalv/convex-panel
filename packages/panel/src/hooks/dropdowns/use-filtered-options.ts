import { useMemo, useState, useCallback } from 'react';

export interface FilterableOption<> {
  searchValue?: string;
  label?: string;
  [key: string]: any;
}

export function useFilteredOptions<T extends FilterableOption>(
  options: T[],
  getSearchText?: (option: T) => string
) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOptions = useMemo(() => {
    if (!searchQuery) {
      return options;
    }

    const normalizedQuery = searchQuery.toLowerCase();
    return options.filter((option) => {
      const searchText = getSearchText
        ? getSearchText(option)
        : option.searchValue || (typeof option.label === 'string' ? option.label : '');
      return searchText.toLowerCase().includes(normalizedQuery);
    });
  }, [options, searchQuery, getSearchText]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  return {
    filteredOptions,
    searchQuery,
    setSearchQuery,
    clearSearch,
  };
}

