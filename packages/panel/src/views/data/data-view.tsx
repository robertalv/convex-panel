import React, { useEffect, useRef, useState, useMemo } from 'react';
import { TableSidebar } from './components/table-sidebar';
import { TableToolbar } from './components/table-toolbar';
import { DataTable } from './components/data-table';
import { FilterSheet } from './components/filter-sheet';
import { AddDocumentSheet } from './components/add-document-sheet';
import { useTableData } from '../../hooks/useTableData';
import { fetchComponents } from '../../utils/api';

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
  const [selectedComponent, setSelectedComponent] = useState<string | null>('app');
  const [components, setComponents] = useState<any[]>([]);
  const [isLoadingComponents, setIsLoadingComponents] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAddDocumentOpen, setIsAddDocumentOpen] = useState(false);
  const [visibleFields, setVisibleFields] = useState<string[]>([]);
  const [isColumnVisibilityOpen, setIsColumnVisibilityOpen] = useState(false);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);

  // Create a mapping from component name to component ID
  const componentNameToId = useMemo(() => {
    const map = new Map<string, string>();
    components.forEach((comp) => {
      if (comp.name && comp.id) {
        map.set(comp.name, comp.id);
      }
    });
    return map;
  }, [components]);

  // Get the actual component ID from the selected component name
  const selectedComponentId = useMemo(() => {
    if (selectedComponent === 'app' || selectedComponent === null) {
      return null;
    }
    const componentId = componentNameToId.get(selectedComponent) || null;
    return componentId;
  }, [selectedComponent, componentNameToId]);

  // Use the hook once in the parent component
  const tableData = useTableData({
    convexUrl: convexUrl || '',
    accessToken,
    baseUrl: baseUrl || convexUrl || '',
    adminClient,
    useMockData,
    onError,
    componentId: selectedComponentId,
  });

  const tableSchema = tableData.tables[tableData.selectedTable];
  const availableFields = tableSchema?.fields?.map(field => field.fieldName) || [];
  const allFields = useMemo(() => {
    const combined = ['_id', ...availableFields, '_creationTime'];
    return combined.filter((col, index, self) => self.indexOf(col) === index);
  }, [availableFields]);

  const hiddenFieldsCount = useMemo(() => {
    if (allFields.length === 0) return 0;
    const count = Math.max(0, allFields.length - visibleFields.length);
    return count;
  }, [allFields.length, visibleFields.length, visibleFields]);

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

  // Fetch components
  useEffect(() => {
    if (!adminClient || useMockData) {
      setComponents([]);
      return;
    }

    setIsLoadingComponents(true);
    fetchComponents(adminClient, useMockData)
      .then((comps) => {
        setComponents(comps);
      })
      .catch((error) => {
        console.error('Error fetching components:', error);
        setComponents([]);
      })
      .finally(() => {
        setIsLoadingComponents(false);
      });
  }, [adminClient, useMockData]);

  // Extract component names for the selector
  const componentNames = useMemo(() => {
    const names = ['app'];
    components.forEach((comp) => {
      if (comp.name && comp.name.trim() !== '') {
        names.push(comp.name);
      }
    });
    return names;
  }, [components]);

  // Fetch tables on mount and when component changes
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
    }
    // Refetch tables when component changes to get the correct table list
    tableData.fetchTables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedComponent]); // Refetch when component changes

  // Refetch table data when component changes (after tables are fetched)
  useEffect(() => {
    if (tableData.selectedTable && hasInitialized.current) {
      // Reset and refetch data for the current table with the new component
      tableData.fetchTableData(tableData.selectedTable, null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedComponent]);

  return (
    <>
      <div className="cp-data-container">
        <TableSidebar
          tables={tableData.tables}
          selectedTable={tableData.selectedTable}
          setSelectedTable={tableData.setSelectedTable}
          isLoading={tableData.isLoading}
          selectedComponent={selectedComponent}
          onComponentSelect={setSelectedComponent}
          availableComponents={componentNames}
        />

        <div className="cp-data-main">
          <TableToolbar
            selectedTable={tableData.selectedTable}
            documentCount={tableData.documentCount}
            onFilterToggle={() => setIsFilterOpen(!isFilterOpen)}
            isFilterOpen={isFilterOpen}
            onAddDocument={() => setIsAddDocumentOpen(true)}
            onColumnVisibilityToggle={() => {
              setIsColumnVisibilityOpen(!isColumnVisibilityOpen);
              // Also open filter panel if not already open
              if (!isFilterOpen) {
                setIsFilterOpen(true);
              }
            }}
            hiddenFieldsCount={hiddenFieldsCount}
            selectedCount={selectedDocumentIds.length}
            onDeleteSelected={() => {
              console.log('Delete selected rows', selectedDocumentIds);
            }}
            onEditSelected={() => {
              console.log('Edit selected row', selectedDocumentIds);
            }}
            filters={tableData.filters}
            sortConfig={tableData.sortConfig}
            onRemoveFilter={(index) => {
              const newClauses = [...(tableData.filters.clauses || [])];
              newClauses.splice(index, 1);
              tableData.setFilters({ clauses: newClauses });
            }}
            onClearFilters={() => {
              tableData.setFilters({ clauses: [] });
              tableData.setSortConfig(null);
            }}
            onRemoveSort={() => {
              tableData.setSortConfig(null);
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

      <AddDocumentSheet
        isOpen={isAddDocumentOpen}
        onClose={() => setIsAddDocumentOpen(false)}
        selectedTable={tableData.selectedTable}
        tableSchema={tableSchema}
        componentId={selectedComponentId}
        adminClient={adminClient}
        onDocumentAdded={() => {
          // Refetch table data after adding documents
          if (tableData.selectedTable) {
            tableData.fetchTableData(tableData.selectedTable, null);
          }
        }}
      />
    </>
  );
};

