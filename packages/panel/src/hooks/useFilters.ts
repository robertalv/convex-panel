import { useState, useCallback, useEffect, useRef } from 'react';
import { FilterExpression, FilterClause, MenuPosition, UseFiltersReturn, UseFiltersProps } from '../types';
import { saveTableFilters } from '../utils/storage';

export const useFilters = ({
  /**
   * Callback fired when a filter is applied.
   * Receives the applied filter clause as a parameter.
   * @param filter Filter clause object
   */
  onFilterApply,

  /**
   * Callback fired when a filter is removed.
   * Receives the field name of the removed filter as a parameter.
   * @param field Field name of the removed filter
   */
  onFilterRemove,

  /**
   * Callback fired when all filters are cleared.
   * Clears all applied filters.
   */
  onFilterClear,

  /**
   * The name of the currently selected table.
   * Used to scope filters to the selected table.
   * @required
   */
  selectedTable,

  /**
   * Initial set of filters to apply.
   * Used to initialize the filter state.
   * @default { clauses: [] }
   */
  initialFilters = { clauses: [] }
}: UseFiltersProps): UseFiltersReturn => {
  const initializedRef = useRef<Record<string, boolean>>({});

  const [filters, setFiltersState] = useState<FilterExpression>(initialFilters);
  const [filterMenuField, setFilterMenuField] = useState<string | null>(null);
  const [filterMenuPosition, setFilterMenuPosition] = useState<MenuPosition | null>(null);

  /**
   * Closes the filter menu
   */
  const closeFilterMenu = useCallback(() => {
    setFilterMenuField(null);
    setFilterMenuPosition(null);
  }, []);

  /**
   * Wrapper for setFilters that also updates localStorage
   */
  const setFilters = useCallback((filtersOrUpdater: React.SetStateAction<FilterExpression>) => {
    setFiltersState((prev: FilterExpression) => {
      const newFilters = typeof filtersOrUpdater === 'function' 
        ? filtersOrUpdater(prev) 
        : filtersOrUpdater;
      
      if (selectedTable) {
        saveTableFilters(selectedTable, newFilters);
      }
      
      return newFilters;
    });
  }, [selectedTable]);

  /**
   * Updates filters when initialFilters changes, but only once per table
   * or when new filters are explicitly provided from the parent
   */
  useEffect(() => {
    // Skip empty initialFilters which can trigger circular updates
    if (!selectedTable || !initialFilters || initialFilters.clauses.length === 0) {
      return;
    }
    
    // Only update in these cases:
    // 1. First time for this table (initialization)
    // 2. When parent sends a non-empty filter set that's different from current filters
    if (!initializedRef.current[selectedTable]) {
      // First time for this table - initialize with parent filters
      setFiltersState(initialFilters);
      initializedRef.current[selectedTable] = true;
    } else {
      // Convert to JSON once for comparison
      const currentFiltersJson = JSON.stringify(filters);
      const initialFiltersJson = JSON.stringify(initialFilters);
      
      // Only sync when parent has different filters
      if (initialFiltersJson !== currentFiltersJson) {
        // Prevent overrides of local filter changes when parent has stale data
        const locallyChanged = filters.clauses.length === 0 && 
          initialFilters.clauses.length === 1;
          
        if (!locallyChanged) {
          setFiltersState(initialFilters);
        }
      }
    }
  }, [selectedTable, initialFilters, filters]);

  /**
   * Handles the click event for the filter button
   */
  const handleFilterButtonClick = useCallback((e: React.MouseEvent, header: string) => {
    e.stopPropagation();
    e.preventDefault();
        
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    
    // Get the viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate position to ensure it's visible
    const menuWidth = 300; // Approximate width of the menu
    const menuHeight = 300; // Approximate height of the menu
    
    // Position the menu so it fits on screen
    let left = rect.left;
    // If menu would overflow right edge, position it to the left of the button
    if (left + menuWidth > viewportWidth - 20) {
      left = Math.max(viewportWidth - menuWidth - 20, 10);
    }
    
    // Ensure it's not too close to the bottom of the viewport
    let top = rect.bottom + 8;
    if (top + menuHeight > viewportHeight - 20) {
      // Position above the button if there's not enough space below
      top = Math.max(rect.top - menuHeight - 8, 10);
    }
    
    const menuPosition = {
      top: top,
      left: left,
    };
        
    setFilterMenuPosition(menuPosition);
    setFilterMenuField(header);
  }, []);

  /**
   * Handles the apply event for the filter
   */
  const handleFilterApply = useCallback((filter: FilterClause) => {
    // Check if we're editing an existing filter
    const existingFilterIndex = filters.clauses.findIndex(f => f.field === filter.field);
    
    // Create a new filters object to avoid mutation
    const newFilters = { ...filters };
    
    if (existingFilterIndex !== -1) {
      // Update existing filter
      newFilters.clauses = [...filters.clauses];
      newFilters.clauses[existingFilterIndex] = filter;
    } else {
      // Add new filter
      newFilters.clauses = [...filters.clauses, filter];
    }
    
    // Update filters
    setFilters(newFilters);
    
    // Close the filter menu
    setFilterMenuField(null);
    
    // Call the onFilterApply callback
    if (onFilterApply) {
      onFilterApply(filter);
    }
  }, [filters, setFilters, onFilterApply]);

  /**
   * Handles the remove event for the filter
   */
  const handleFilterRemove = useCallback((field: string) => {    
    // Use the functional updater pattern to get the most current filters state
    setFilters(currentFilters => {
      const newFilters = {
        clauses: currentFilters.clauses.filter(c => c.field !== field)
      };
        
      // Return the new filters to update state
      return newFilters;
    });
    
    // Call the callback
    onFilterRemove(field);
  }, [onFilterRemove, setFilters]);

  /**
   * Clears the filters
   */
  const clearFilters = useCallback(() => {
    // Set filters to empty array immediately
    setFilters({ clauses: [] });
    
    // Call the callback
    onFilterClear();
  }, [onFilterClear, setFilters]);

  /**
   * Handles the click outside event for the filter menu
   */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterMenuField && filterMenuPosition) {
        const target = e.target as HTMLElement;
        
        // Find if click is on button or menu
        const isFilterButton = target.closest('.convex-panel-filter-button');
        const isFilterMenu = target.closest('.convex-panel-filter-menu');
        
        // Only close if click is outside both the button and menu
        if (!isFilterButton && !isFilterMenu) {
          closeFilterMenu();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [filterMenuField, filterMenuPosition, closeFilterMenu]);

  return {
    filters,
    filterMenuField,
    filterMenuPosition,
    handleFilterButtonClick,
    handleFilterApply,
    handleFilterRemove,
    clearFilters,
    closeFilterMenu,
    setFilters
  };
}; 