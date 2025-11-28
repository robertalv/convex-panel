import React, { useEffect, useRef, useState, useMemo } from 'react';
import { TableSidebar } from './components/table-sidebar';
import { TableToolbar } from './components/table-toolbar';
import { DataTable } from './components/table/data-table';
import { FilterSheet } from './components/filter-sheet';
import { AddDocumentSheet } from './components/add-document-sheet';
import { SchemaView } from './components/schema-view';
import { IndexesView } from './components/indexes-view';
import { MetricsView } from './components/metrics-view';
import { CustomQuery } from '../../components/function-runner/function-runner';
import { useTableData } from '../../hooks/useTableData';
import { fetchComponents } from '../../utils/api';
import { saveTableFilters } from '../../utils/storage';
import { useSheetSafe } from '../../contexts/sheet-context';
import { useShowGlobalRunner } from '../../lib/functionRunner';

export interface DataViewProps {
  convexUrl?: string;
  accessToken: string;
  baseUrl?: string;
  adminClient?: any;
  useMockData?: boolean;
  onError?: (error: string) => void;
  teamSlug?: string;
  projectSlug?: string;
}

export const DataView: React.FC<DataViewProps> = ({
  convexUrl,
  accessToken,
  baseUrl,
  adminClient,
  useMockData = false,
  onError,
  teamSlug,
  projectSlug,
}) => {
  const [selectedComponent, setSelectedComponent] = useState<string | null>('app');
  const [components, setComponents] = useState<any[]>([]);
  const [isLoadingComponents, setIsLoadingComponents] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAddDocumentOpen, setIsAddDocumentOpen] = useState(false);
  const [visibleFields, setVisibleFields] = useState<string[]>([]);
  const [isColumnVisibilityOpen, setIsColumnVisibilityOpen] = useState(false);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const { openSheet } = useSheetSafe();
  const showGlobalRunner = useShowGlobalRunner();

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

  // Track the last table and fields to prevent unnecessary updates
  const lastTableRef = useRef<string | null>(null);
  const lastFieldsStringRef = useRef<string>('');

  // Initialize visibleFields when table changes - show all fields by default
  useEffect(() => {
    const currentTable = tableData.selectedTable;
    const fieldsString = JSON.stringify([...allFields].sort());
    
    // Only update if table changed or fields actually changed (by content, not reference)
    const tableChanged = currentTable !== lastTableRef.current;
    const fieldsChanged = fieldsString !== lastFieldsStringRef.current;
    
    if (currentTable && allFields.length > 0) {
      // When table changes, always reset to show all fields
      // When fields change (e.g., schema loads), check if visibleFields is missing any fields
      // and add them (but don't remove fields user may have hidden)
      if (tableChanged) {
        // Table changed: always reset to show all fields
        setVisibleFields([...allFields]);
        lastTableRef.current = currentTable;
        lastFieldsStringRef.current = fieldsString;
        setSelectedDocumentIds([]);
      } else if (fieldsChanged) {
        // Fields changed (e.g., schema loaded): add any missing fields to visibleFields
        const missingFields = allFields.filter(field => !visibleFields.includes(field));
        if (missingFields.length > 0) {
          // Add missing fields while preserving existing visibleFields
          setVisibleFields([...new Set([...visibleFields, ...missingFields])]);
        }
        lastFieldsStringRef.current = fieldsString;
      }
    }
  }, [tableData.selectedTable, allFields]);

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
              // TODO: Implement delete selected rows
            }}
            onEditSelected={() => {
              // TODO: Implement edit selected rows
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
            onCustomQuery={() => {
              const customQuery: CustomQuery = {
                type: 'customQuery',
                table: tableData.selectedTable,
                componentId: selectedComponentId,
              };
              showGlobalRunner(customQuery, 'click');
            }}
            onSchema={() => {
              openSheet({
                title: `Schema for table ${tableData.selectedTable}`,
                content: (
                  <SchemaView
                    tableName={tableData.selectedTable}
                    tableSchema={tableSchema}
                  />
                ),
                width: '600px',
              });
            }}
            onIndexes={() => {
              openSheet({
                title: `Indexes for table ${tableData.selectedTable}`,
                content: (
                  <IndexesView
                    tableName={tableData.selectedTable}
                    tableSchema={tableSchema}
                    adminClient={adminClient}
                    componentId={selectedComponentId}
                  />
                ),
                width: '600px',
              });
            }}
            onMetrics={() => {
              openSheet({
                title: `${tableData.selectedTable} Metrics`,
                content: (
                  <MetricsView
                    tableName={tableData.selectedTable}
                    deploymentUrl={convexUrl}
                    accessToken={accessToken}
                    componentId={selectedComponentId}
                  />
                ),
                width: '90vw',
              });
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
            adminClient={adminClient}
            onDocumentUpdate={() => {
              // Refresh table data after update
              if (tableData.selectedTable) {
                tableData.fetchTableData(tableData.selectedTable, null);
              }
            }}
            deploymentUrl={convexUrl}
            componentId={selectedComponentId}
            filters={tableData.filters}
            setFilters={tableData.setFilters}
            onNavigateToTable={(tableName: string, documentId: string) => {
              // Create filter to show only this document by _id
              const filter = {
                clauses: [{
                  field: '_id',
                  op: 'eq' as const,
                  value: documentId,
                  enabled: true,
                }],
              };
              
              // Save filter to localStorage first
              saveTableFilters(tableName, filter);
              
              // If we're already on this table, just apply the filter directly
              if (tableData.selectedTable === tableName) {
                tableData.setFilters(filter);
                return;
              }
              
              // Set the selected table - this will trigger effects that may reset filters
              tableData.setSelectedTable(tableName);
              
              // Set the filter after a delay to ensure table change effects complete
              // The useTableData hook has an effect that resets filters when table changes,
              // then loads from localStorage. We need to wait for that to complete.
              setTimeout(() => {
                tableData.setFilters(filter);
              }, 150);
            }}
            accessToken={accessToken}
            teamSlug={teamSlug}
            projectSlug={projectSlug}
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

