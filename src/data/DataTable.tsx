import React, { useCallback, useEffect, useState } from 'react';
import { FilterClause, MenuPosition, DataTableProps } from './types';
import { useTableData, useFilters } from './hooks';
import { 
  DataTableSidebar, 
  DataTableContent, 
  ActiveFilters, 
  FilterDebug,
  StorageDebug,
  FilterMenu
} from './components';
import { getStorageItem, STORAGE_KEYS } from './utils/storage';
import { ConvexPanelSettings } from '../settings';

// Define settings storage key
const SETTINGS_STORAGE_KEY = 'convex-panel:settings';

// Default settings
const defaultSettings = {
  showDebugFilters: false,
  showStorageDebug: false,
  logLevel: 'info' as const,
  healthCheckInterval: 60, // seconds
  showRequestIdInput: true,
  showLimitInput: true,
  showSuccessCheckbox: true,
};

// Define the filter menu state interface
interface FilterMenuState {
  isOpen: boolean;
  position: MenuPosition;
  editingFilter?: FilterClause;
}

const DataTable: React.FC<DataTableProps> = ({
  convexUrl,
  accessToken,
  onError,
  theme = {},
  baseUrl,
  convex,
  adminClient,
  settings: externalSettings
}) => {
  const [searchText, setSearchText] = React.useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [settings, setSettings] = useState<ConvexPanelSettings>(() => {
    // Use external settings if provided, otherwise initialize from localStorage
    if (externalSettings) {
      return externalSettings;
    }
    
    // Initialize from localStorage if available, otherwise use defaults
    if (typeof window !== 'undefined') {
      return getStorageItem<ConvexPanelSettings>(SETTINGS_STORAGE_KEY, defaultSettings);
    }
    return defaultSettings;
  });
  
  const {
    tables,
    selectedTable,
    setSelectedTable,
    documents,
    isLoading,
    hasMore,
    isLoadingMore,
    fetchTableData,
    formatValue,
    getColumnHeaders,
    observerTarget,
    filters: tableFilters,
    setFilters: setTableFilters
  } = useTableData({
    convexUrl,
    accessToken,
    baseUrl,
    adminClient,
    onError
  });

  // Add filter menu state
  const [filterMenuState, setFilterMenuState] = useState<FilterMenuState>({
    isOpen: false,
    position: { top: 0, left: 0 }
  });

  const onFilterApply = useCallback((filter: FilterClause) => {
    // Reset pagination and reload data immediately
    fetchTableData(selectedTable, null);
  }, [selectedTable, fetchTableData]);

  const {
    filters,
    filterMenuField,
    filterMenuPosition,
    handleFilterButtonClick,
    handleFilterApply,
    handleFilterRemove,
    clearFilters,
    closeFilterMenu,
    setFilters
  } = useFilters({
    onFilterApply,
    onFilterRemove: (field) => {
      fetchTableData(selectedTable, null);
    },
    onFilterClear: () => {
      fetchTableData(selectedTable, null);
    },
    selectedTable,
    initialFilters: tableFilters
  });

  // Sync filters from useFilters to useTableData with priority
  useEffect(() => {
    // Always update tableFilters when filters change
    setTableFilters(filters);
    
    // If filters are cleared, force a data refresh
    if (filters.clauses.length === 0) {
      fetchTableData(selectedTable, null);
    }
  }, [filters, setTableFilters, fetchTableData, selectedTable]);

  const columnHeaders = getColumnHeaders();

  return (
    <div className="convex-panel-data-layout">
      <DataTableSidebar
        tables={tables}
        selectedTable={selectedTable}
        searchText={searchText}
        onSearchChange={setSearchText}
        onTableSelect={setSelectedTable}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        theme={theme}
      />

      <div className="convex-panel-data-content">          
        <div className="convex-panel-data-container">
            
          {!filters || filters.clauses.length === 0 ? null : (
            <div className="convex-panel-filters-bar">
                <ActiveFilters
                    filters={filters}
                    onRemove={handleFilterRemove}
                    onClearAll={clearFilters}
                    selectedTable={selectedTable}
                    theme={theme}
                    onEdit={(e, field) => {
                    // Find the existing filter
                    const existingFilter = filters.clauses.find(f => f.field === field);
                    if (existingFilter) {
                        // Open the filter menu with the existing filter values
                        setFilterMenuState({
                        isOpen: true,
                        position: {
                            top: e.clientY,
                            left: e.clientX
                        },
                        editingFilter: existingFilter
                        });
                    }
                    }}
                />
            </div>
          )}
          {settings.showDebugFilters && (
            <FilterDebug 
              filters={filters} 
              selectedTable={selectedTable}
            />
          )}
          
          {settings.showStorageDebug && (
            <StorageDebug 
              visible={true}
              selectedTable={selectedTable}
              filters={filters}
            />
          )}
          
          {selectedTable && (
            <DataTableContent
              documents={documents}
              columnHeaders={columnHeaders}
              isLoading={isLoading}
              hasMore={hasMore}
              isLoadingMore={isLoadingMore}
              observerTarget={observerTarget}
              onFilterButtonClick={handleFilterButtonClick}
              filterMenuField={filterMenuField}
              filterMenuPosition={filterMenuPosition}
              handleFilterApply={handleFilterApply}
              onFilterMenuClose={closeFilterMenu}
              formatValue={formatValue}
              activeFilters={filters}
            />
          )}
        </div>
      </div>
      {filterMenuState.isOpen && (
        <FilterMenu
          field={filterMenuState.editingFilter?.field || ''}
          position={filterMenuState.position}
          onClose={() => setFilterMenuState(prev => ({ ...prev, isOpen: false }))}
          onApply={(filter) => {
            handleFilterApply(filter);
            setFilterMenuState(prev => ({ ...prev, isOpen: false }));
          }}
          existingFilter={filterMenuState.editingFilter}
          theme={theme}
        />
      )}
    </div>
  );
};

export default DataTable; 