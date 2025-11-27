import React, { useEffect, useRef, useState } from 'react';
import { TableSidebar } from './components/table-sidebar';
import { TableToolbar } from './components/table-toolbar';
import { DataTable } from './components/data-table';
import { FilterSheet } from './components/filter-sheet';
import { useTableData } from '../../hooks/useTableData';

export interface DataViewProps {
  convexUrl?: string;
  accessToken: string;
  baseUrl?: string;
  adminClient?: any;
  useMockData?: boolean;
  onError?: (error: string) => void;
}

export const DataView: React.FC<DataViewProps> = ({
  convexUrl,
  accessToken,
  baseUrl,
  adminClient,
  useMockData = false,
  onError,
}) => {
  // Use the hook once in the parent component
  const tableData = useTableData({
    convexUrl: convexUrl || '',
    accessToken,
    baseUrl: baseUrl || convexUrl || '',
    adminClient,
    useMockData,
    onError,
  });

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [visibleFields, setVisibleFields] = useState<string[]>([]);
  const [isColumnVisibilityOpen, setIsColumnVisibilityOpen] = useState(false);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);

  // Calculate all fields for the selected table
  const tableSchema = tableData.tables[tableData.selectedTable];
  const availableFields = tableSchema?.fields?.map(field => field.fieldName) || [];
  const allFields = ['_id', ...availableFields, '_creationTime'].filter((col, index, self) =>
    self.indexOf(col) === index
  );

  // Initialize visibleFields when table changes - show all fields by default
  useEffect(() => {
    if (tableData.selectedTable && allFields.length > 0) {
      // If visibleFields is empty or doesn't match current table's fields, reset to show all
      if (visibleFields.length === 0 || !visibleFields.some(f => allFields.includes(f))) {
        setVisibleFields([...allFields]);
      }
    }
    setSelectedDocumentIds([]);
  }, [tableData.selectedTable, allFields.length]);

  useEffect(() => {
    setSelectedDocumentIds((prev) =>
      prev.filter((id) => tableData.documents.some((doc) => doc._id === id)),
    );
  }, [tableData.documents]);

  // Track if we've initialized to prevent multiple fetches
  const hasInitialized = useRef(false);

  // Fetch tables on mount - only once
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      tableData.fetchTables();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  return (
    <>
      <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
        <TableSidebar
          tables={tableData.tables}
          selectedTable={tableData.selectedTable}
          setSelectedTable={tableData.setSelectedTable}
          isLoading={tableData.isLoading}
        />
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#0F1115', minWidth: 0, overflow: 'hidden' }}>
          <TableToolbar
            selectedTable={tableData.selectedTable}
            documentCount={tableData.documentCount}
            onFilterToggle={() => setIsFilterOpen(!isFilterOpen)}
            isFilterOpen={isFilterOpen}
            onColumnVisibilityToggle={() => {
              setIsColumnVisibilityOpen(!isColumnVisibilityOpen);
              // Also open filter panel if not already open
              if (!isFilterOpen) {
                setIsFilterOpen(true);
              }
            }}
            hiddenFieldsCount={allFields.length - visibleFields.length}
            selectedCount={selectedDocumentIds.length}
            onDeleteSelected={() => {
              console.log('Delete selected rows', selectedDocumentIds);
            }}
            onEditSelected={() => {
              console.log('Edit selected row', selectedDocumentIds);
            }}
          />
          
          <DataTable
            selectedTable={tableData.selectedTable}
            documents={tableData.documents}
            isLoading={tableData.isLoading}
            tables={tableData.tables}
            visibleFields={visibleFields}
            selectedDocumentIds={selectedDocumentIds}
            onSelectionChange={setSelectedDocumentIds}
          />
        </div>
      </div>

      <FilterSheet
        isOpen={isFilterOpen}
        onClose={() => {
          setIsFilterOpen(false);
          setIsColumnVisibilityOpen(false);
        }}
        filters={tableData.filters}
        setFilters={tableData.setFilters}
        sortConfig={tableData.sortConfig}
        setSortConfig={tableData.setSortConfig}
        selectedTable={tableData.selectedTable}
        tables={tableData.tables}
        visibleFields={visibleFields}
        onVisibleFieldsChange={setVisibleFields}
        openColumnVisibility={isColumnVisibilityOpen}
      />
    </>
  );
};

