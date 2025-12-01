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
import { useComponents } from '../../hooks/useComponents';
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
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAddDocumentOpen, setIsAddDocumentOpen] = useState(false);
  const [visibleFields, setVisibleFields] = useState<string[]>([]);
  const [isColumnVisibilityOpen, setIsColumnVisibilityOpen] = useState(false);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const { openSheet } = useSheetSafe();
  const showGlobalRunner = useShowGlobalRunner();

  const {
    componentNames,
    selectedComponentId,
    selectedComponent,
    setSelectedComponent,
  } = useComponents({
    adminClient,
    useMockData,
  });

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

  const lastTableRef = useRef<string | null>(null);
  const lastFieldsStringRef = useRef<string>('');

  const handleOpenAddDocument = () => {
    if (!tableData.selectedTable) return;
    setIsAddDocumentOpen(true);
  };

  useEffect(() => {
    const currentTable = tableData.selectedTable;
    const fieldsString = JSON.stringify([...allFields].sort());
    
    const tableChanged = currentTable !== lastTableRef.current;
    const fieldsChanged = fieldsString !== lastFieldsStringRef.current;
    
    if (currentTable && allFields.length > 0) {
      if (tableChanged) {
        setVisibleFields([...allFields]);
        lastTableRef.current = currentTable;
        lastFieldsStringRef.current = fieldsString;
        setSelectedDocumentIds([]);
      } else if (fieldsChanged) {
        const missingFields = allFields.filter(field => !visibleFields.includes(field));
        if (missingFields.length > 0) {
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

  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
    }
    tableData.fetchTables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedComponent]);

  useEffect(() => {
    if (tableData.selectedTable && hasInitialized.current) {
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
            onAddDocument={handleOpenAddDocument}
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
            onAddDocument={handleOpenAddDocument}
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

