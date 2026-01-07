import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import { PanelLeftOpen } from "lucide-react";
import { TableSidebar } from "./components/table-sidebar";
import { TableToolbar } from "./components/table-toolbar";
import { DataTable } from "./components/table/data-table";
import { FilterSheet } from "./components/filter-sheet";
import { AddDocumentSheet } from "./components/add-document-sheet";
import { EditDocumentSheet } from "./components/edit-document-sheet";
import { SchemaSheet } from "./components/schema-sheet";
import { IndexesView } from "./components/indexes-view";
import { MetricsView } from "./components/metrics-view";
import { ConfirmDialog } from "../../components/shared/confirm-dialog";
import { ClearTableConfirmation } from "./components/clear-table-confirmation";
import type { CustomQuery } from "../../types/functions";
import { useTableData } from "../../hooks/useTableData";
import { useComponents } from "../../hooks/useComponents";
import { useContainerRef } from "../../hooks/useContainerRef";
import { saveTableFilters, updateRecentlyViewedTable } from "../../utils/storage";
import { useSheetActionsSafe } from "../../contexts/sheet-context";
import { useShowGlobalRunner } from "../../lib/functionRunner";
import { deleteTable, deleteDocuments } from "../../utils/api/documents";
import { getAdminClientInfo } from "../../utils/adminClient";
import { toast } from "../../utils/toast";
import { useDataViewActions } from "../../contexts/data-view-context";

export interface DataViewProps {
  convexUrl?: string;
  accessToken: string;
  baseUrl?: string;
  adminClient?: any;
  useMockData?: boolean;
  onError?: (error: string) => void;
  teamSlug?: string;
  projectSlug?: string;
  /**
   * Render mode for the EditDocumentSheet:
   * - 'portal': Uses createPortal to render as overlay (default)
   * - 'inline': Renders inline as flex sibling for push-aside layouts (desktop)
   */
  sheetRenderMode?: "portal" | "inline";
  /**
   * Optional initial table to select when the view loads.
   * Useful for deep-linking from other views (e.g., Schema Visualizer).
   */
  initialTable?: string | null;
}

const DataViewComponent: React.FC<DataViewProps> = ({
  convexUrl,
  accessToken,
  adminClient,
  useMockData = false,
  onError,
  teamSlug,
  projectSlug,
  sheetRenderMode = "portal",
  initialTable,
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAddDocumentOpen, setIsAddDocumentOpen] = useState(false);
  const [isEditDocumentOpen, setIsEditDocumentOpen] = useState(false);
  const [wasEditSheetManuallyClosed, setWasEditSheetManuallyClosed] =
    useState(false);
  const [visibleFields, setVisibleFields] = useState<string[]>([]);
  const [isColumnVisibilityOpen, setIsColumnVisibilityOpen] = useState(false);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [isDeleteTableDialogOpen, setIsDeleteTableDialogOpen] = useState(false);
  const [isClearTableDialogOpen, setIsClearTableDialogOpen] = useState(false);
  const [isDeleteRowsDialogOpen, setIsDeleteRowsDialogOpen] = useState(false);
  const [rowsToDelete, setRowsToDelete] = useState<string[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { openSheet } = useSheetActionsSafe();
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
    convexUrl: convexUrl || "",
    accessToken,
    adminClient,
    useMockData,
    onError,
    componentId: selectedComponentId,
  });

  // Handle initialTable prop - select the table when provided and tables are loaded
  const initialTableAppliedRef = useRef<string | null>(null);
  useEffect(() => {
    if (
      initialTable &&
      Object.keys(tableData.tables).length > 0 &&
      tableData.tables[initialTable] &&
      initialTableAppliedRef.current !== initialTable
    ) {
      // Only apply once per unique initialTable value
      initialTableAppliedRef.current = initialTable;
      tableData.setSelectedTable(initialTable);
    }
  }, [initialTable, tableData.tables, tableData.setSelectedTable]);

  const { setDataViewContext } = useDataViewActions();
  const tableSchema = tableData.tables[tableData.selectedTable];
  const availableFields =
    tableSchema?.fields?.map((field) => field.fieldName) || [];

  const documentFields = useMemo(() => {
    const fieldsSet = new Set<string>();
    tableData.documents.forEach((doc) => {
      Object.keys(doc).forEach((key) => {
        if (key !== "_id" && key !== "_creationTime") {
          fieldsSet.add(key);
        }
      });
    });
    return Array.from(fieldsSet);
  }, [tableData.documents]);

  const allFields = useMemo(() => {
    const combined = [
      "_id",
      ...availableFields,
      ...documentFields,
      "_creationTime",
    ];
    return combined.filter((col, index, self) => self.indexOf(col) === index);
  }, [availableFields, documentFields]);

  // Track previous values to avoid infinite loops
  const prevTableRef = useRef<string | null>(null);
  const prevFieldsRef = useRef<string>("");

  // Update data view context for chatbot
  useEffect(() => {
    const currentTable = tableData.selectedTable;
    const currentFieldsString = JSON.stringify(allFields.sort());

    // Only update if table or fields actually changed
    if (
      currentTable !== prevTableRef.current ||
      currentFieldsString !== prevFieldsRef.current
    ) {
      if (currentTable && allFields.length > 0) {
        setDataViewContext(currentTable, allFields);
      } else {
        setDataViewContext(null, []);
      }

      prevTableRef.current = currentTable;
      prevFieldsRef.current = currentFieldsString;
    }
  }, [tableData.selectedTable, allFields, setDataViewContext]);

  const hiddenFieldsCount = useMemo(() => {
    if (allFields.length === 0) return 0;
    const count = Math.max(0, allFields.length - visibleFields.length);
    return count;
  }, [allFields.length, visibleFields.length, visibleFields]);

  const allRowsSelected = useMemo(() => {
    if (tableData.documents.length === 0) return false;
    return tableData.documents.every((doc) =>
      selectedDocumentIds.includes(doc._id),
    );
  }, [tableData.documents, selectedDocumentIds]);

  const isEditingAllAndMoreThanOne =
    allRowsSelected && selectedDocumentIds.length > 1;

  const lastTableRef = useRef<string | null>(null);
  const lastFieldsStringRef = useRef<string>("");
  const [dataViewRef, containerRef] = useContainerRef(".cp-main-content");

  const handleOpenAddDocument = useCallback(() => {
    if (!tableData.selectedTable) return;
    setIsAddDocumentOpen(true);
  }, [tableData.selectedTable]);

  // Memoize callbacks for DataTable to make React.memo effective
  // Use specific properties from tableData instead of the entire object
  const handleDocumentUpdate = useCallback(() => {
    if (tableData.selectedTable) {
      tableData.fetchTableData(tableData.selectedTable, null);
    }
  }, [tableData.selectedTable, tableData.fetchTableData]);

  const handleNavigateToTable = useCallback(
    (tableName: string, documentId: string) => {
      // Create filter to show only this document by _id
      const filter = {
        clauses: [
          {
            field: "_id",
            op: "eq" as const,
            value: documentId,
            enabled: true,
          },
        ],
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
    },
    [tableData.selectedTable, tableData.setFilters, tableData.setSelectedTable],
  );

  // Memoize sheet opening callbacks to prevent re-renders when these are passed as props
  const handleOpenSchema = useCallback(() => {
    openSheet({
      content: (
        <SchemaSheet
          tableName={tableData.selectedTable}
          tableSchema={tableSchema}
          documents={tableData.documents}
          adminClient={adminClient}
          componentId={selectedComponentId}
        />
      ),
      width: "600px",
    });
  }, [
    openSheet,
    tableData.selectedTable,
    tableSchema,
    tableData.documents,
    adminClient,
    selectedComponentId,
  ]);

  const handleOpenIndexes = useCallback(() => {
    openSheet({
      content: (
        <IndexesView
          tableName={tableData.selectedTable}
          adminClient={adminClient}
          componentId={selectedComponentId}
        />
      ),
      width: "600px",
    });
  }, [openSheet, tableData.selectedTable, adminClient, selectedComponentId]);

  const handleOpenMetrics = useCallback(() => {
    openSheet({
      content: (
        <MetricsView
          tableName={tableData.selectedTable}
          deploymentUrl={convexUrl}
          accessToken={accessToken}
          componentId={selectedComponentId}
        />
      ),
      width: "90vw",
    });
  }, [
    openSheet,
    tableData.selectedTable,
    convexUrl,
    accessToken,
    selectedComponentId,
  ]);

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
        const hadOnlySystemFields =
          visibleFields.length <= 2 &&
          visibleFields.every((f) => f === "_id" || f === "_creationTime");
        const nowHasMoreFields = allFields.length > 2;

        if (hadOnlySystemFields && nowHasMoreFields) {
          setVisibleFields([...allFields]);
        } else {
          // Otherwise, just add missing fields
          const missingFields = allFields.filter(
            (field) => !visibleFields.includes(field),
          );
          if (missingFields.length > 0) {
            setVisibleFields([
              ...new Set([...visibleFields, ...missingFields]),
            ]);
          }
        }
        lastFieldsStringRef.current = fieldsString;
      }
    } else if (
      currentTable &&
      allFields.length === 2 &&
      allFields.includes("_id") &&
      allFields.includes("_creationTime")
    ) {
      if (
        visibleFields.length === 0 ||
        !visibleFields.includes("_id") ||
        !visibleFields.includes("_creationTime")
      ) {
        setVisibleFields(["_id", "_creationTime"]);
      }
    }
  }, [tableData.selectedTable, allFields, visibleFields]);

  useEffect(() => {
    setSelectedDocumentIds((prev) =>
      prev.filter((id) => tableData.documents.some((doc) => doc._id === id)),
    );
  }, [tableData.documents]);

  const prevSelectedIdsRef = useRef<string[]>([]);

  useEffect(() => {
    const idsChanged =
      prevSelectedIdsRef.current.length !== selectedDocumentIds.length ||
      prevSelectedIdsRef.current.some(
        (id, idx) => id !== selectedDocumentIds[idx],
      );

    if (idsChanged) {
      prevSelectedIdsRef.current = selectedDocumentIds;
      setWasEditSheetManuallyClosed(false);
    }
  }, [selectedDocumentIds]);

  useEffect(() => {
    if (
      selectedDocumentIds.length > 0 &&
      !isEditDocumentOpen &&
      !wasEditSheetManuallyClosed
    ) {
      setIsEditDocumentOpen(true);
    } else if (selectedDocumentIds.length === 0 && isEditDocumentOpen) {
      setIsEditDocumentOpen(false);
      setWasEditSheetManuallyClosed(false);
    }
  }, [
    selectedDocumentIds.length,
    isEditDocumentOpen,
    wasEditSheetManuallyClosed,
  ]);

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

  useEffect(() => {
    const handleFunctionCompleted = (event: CustomEvent) => {
      const { success, udfType, componentId } = event.detail;

      if (success && (udfType === "mutation" || udfType === "action")) {
        const eventComponentId = componentId === "app" ? null : componentId;
        const currentComponentId =
          selectedComponentId === "app" ? null : selectedComponentId;

        if (
          eventComponentId === currentComponentId ||
          (eventComponentId === null && currentComponentId === null)
        ) {
          setTimeout(() => {
            tableData.fetchTables();
            if (tableData.selectedTable) {
              tableData.fetchTableData(tableData.selectedTable, null);
            }
          }, 100);
        }
      }
    };

    window.addEventListener(
      "convex-panel-function-completed",
      handleFunctionCompleted as EventListener,
    );

    return () => {
      window.removeEventListener(
        "convex-panel-function-completed",
        handleFunctionCompleted as EventListener,
      );
    };
  }, [tableData, selectedComponentId]);

  // Track recently viewed tables
  useEffect(() => {
    if (tableData.selectedTable) {
      updateRecentlyViewedTable(tableData.selectedTable);
    }
  }, [tableData.selectedTable]);

  const isInlineMode = sheetRenderMode === "inline";

  // Wrap content in flex container for inline mode
  const wrapperStyle = isInlineMode
    ? ({
        display: "flex",
        height: "100%",
        width: "100%",
        overflow: "hidden",
      } as const)
    : ({
        width: "100%",
        height: "100%",
        overflow: "hidden",
      } as const);

  const dataContainerStyle = isInlineMode
    ? ({
        flex: 1,
        minWidth: 0,
        display: "flex",
        overflow: "hidden",
      } as const)
    : ({
        width: "100%",
        minWidth: 0,
        overflow: "hidden",
      } as const);

  return (
    <div style={wrapperStyle}>
      <div
        className="cp-data-container"
        ref={dataViewRef}
        style={dataContainerStyle}
      >
        {!sidebarCollapsed && (
          <TableSidebar
            tables={tableData.tables}
            selectedTable={tableData.selectedTable}
            setSelectedTable={tableData.setSelectedTable}
            isLoading={tableData.isLoading}
            selectedComponent={selectedComponent}
            onComponentSelect={setSelectedComponent}
            availableComponents={componentNames}
            convexUrl={convexUrl}
            accessToken={accessToken}
            adminClient={adminClient}
            componentId={selectedComponentId}
            onTableCreated={() => {
              tableData.fetchTables();
            }}
          />
        )}

        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '100%',
              backgroundColor: 'var(--color-panel-bg)',
              border: 'none',
              borderRight: '1px solid var(--color-panel-border)',
              color: 'var(--color-panel-text-secondary)',
              cursor: 'pointer',
              padding: 0,
              transition: 'background-color 0.2s, color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-tertiary)';
              e.currentTarget.style.color = 'var(--color-panel-text)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-panel-bg)';
              e.currentTarget.style.color = 'var(--color-panel-text-secondary)';
            }}
            title="Show sidebar"
          >
            <PanelLeftOpen size={16} />
          </button>
        )}

        <div className="cp-data-main">
          <TableToolbar
            documentCount={tableData.documentCount}
            onFilterToggle={() => setIsFilterOpen(!isFilterOpen)}
            isFilterOpen={isFilterOpen}
            onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
            sidebarCollapsed={sidebarCollapsed}
            onAddDocument={handleOpenAddDocument}
            onColumnVisibilityToggle={() => {
              setIsColumnVisibilityOpen(!isColumnVisibilityOpen);
              if (!isFilterOpen) {
                setIsFilterOpen(true);
              }
            }}
            hiddenFieldsCount={hiddenFieldsCount}
            selectedCount={selectedDocumentIds.length}
            onDeleteSelected={() => {
              if (selectedDocumentIds.length === 0) return;

              if (isEditingAllAndMoreThanOne) {
                setIsClearTableDialogOpen(true);
              } else {
                setRowsToDelete([...selectedDocumentIds]);
                setIsDeleteRowsDialogOpen(true);
              }
            }}
            filters={tableData.filters}
            sortConfig={tableData.sortConfig}
            onRemoveFilter={(index) => {
              const newClauses = [...(tableData.filters.clauses || [])];
              newClauses.splice(index, 1);
              const newFilters = { clauses: newClauses };
              tableData.setFilters(newFilters);
            }}
            onClearFilters={async () => {
              const newFilters = { clauses: [] };

              tableData.setFilters(newFilters);
              tableData.setSortConfig(null);
            }}
            onRemoveSort={() => {
              tableData.setSortConfig(null);
            }}
            onCustomQuery={() => {
              const customQuery: CustomQuery = {
                type: "customQuery",
                table: tableData.selectedTable,
                componentId: selectedComponentId,
              };
              showGlobalRunner(customQuery, false, true); // Open in vertical mode
            }}
            onSchema={handleOpenSchema}
            onIndexes={handleOpenIndexes}
            onMetrics={handleOpenMetrics}
            onClearTable={() => {
              setIsClearTableDialogOpen(true);
            }}
            onDeleteTable={() => {
              setIsDeleteTableDialogOpen(true);
            }}
            tableName={tableData.selectedTable}
            tableSchema={tableSchema}
            availableFields={allFields}
            adminClient={adminClient}
            onNaturalLanguageQuery={async (filters, sortConfig) => {
              // Apply the converted filters and sort config
              tableData.setFilters(filters);
              if (sortConfig) {
                tableData.setSortConfig(sortConfig);
              } else {
                tableData.setSortConfig(null);
              }

              // Note: Limit is not directly supported by the current table data system
              // The limit would need to be handled at the query level
              // For now, we'll just apply filters and sort, and the user can see results

              // Refresh table data with new filters - wait for it to complete
              if (tableData.selectedTable) {
                await tableData.fetchTableData(tableData.selectedTable, null);
              }
            }}
            onNaturalLanguageQueryError={(error) => {
              onError?.(error);
              toast("error", error);
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
            onDocumentUpdate={handleDocumentUpdate}
            deploymentUrl={convexUrl}
            componentId={selectedComponentId}
            filters={tableData.filters}
            setFilters={tableData.setFilters}
            onAddDocument={handleOpenAddDocument}
            onNavigateToTable={handleNavigateToTable}
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
        container={isInlineMode ? undefined : containerRef}
        renderMode={sheetRenderMode}
      />

      <AddDocumentSheet
        isOpen={isAddDocumentOpen}
        onClose={() => setIsAddDocumentOpen(false)}
        selectedTable={tableData.selectedTable}
        tableSchema={tableSchema}
        componentId={selectedComponentId}
        adminClient={adminClient}
        onDocumentAdded={() => {
          if (tableData.selectedTable) {
            tableData.fetchTableData(tableData.selectedTable, null);
          }
        }}
        container={isInlineMode ? undefined : containerRef}
        renderMode={sheetRenderMode}
      />

      <EditDocumentSheet
        isOpen={isEditDocumentOpen}
        onClose={() => {
          setIsEditDocumentOpen(false);
          setWasEditSheetManuallyClosed(true);
        }}
        selectedDocumentIds={selectedDocumentIds}
        documents={tableData.documents}
        selectedTable={tableData.selectedTable}
        tables={tableData.tables}
        adminClient={adminClient}
        componentId={selectedComponentId}
        onDocumentUpdate={() => {
          if (tableData.selectedTable) {
            tableData.fetchTableData(tableData.selectedTable, null);
          }
        }}
        container={isInlineMode ? undefined : containerRef}
        renderMode={sheetRenderMode}
      />

      <ClearTableConfirmation
        isOpen={isClearTableDialogOpen}
        onClose={() => setIsClearTableDialogOpen(false)}
        onConfirm={async () => {
          if (tableData.selectedTable) {
            await tableData.fetchTableData(tableData.selectedTable, null);
          }
          setSelectedDocumentIds([]);
        }}
        tableName={tableData.selectedTable}
        numRows={tableData.documentCount}
        adminClient={adminClient}
        componentId={selectedComponentId}
        onError={onError}
      />

      <ConfirmDialog
        isOpen={isDeleteTableDialogOpen}
        onClose={() => setIsDeleteTableDialogOpen(false)}
        onConfirm={async () => {
          if (!tableData.selectedTable || !adminClient || !convexUrl) {
            return;
          }

          try {
            const clientInfo = getAdminClientInfo(adminClient, convexUrl);
            const finalAdminKey = accessToken || clientInfo.adminKey;

            if (!clientInfo.deploymentUrl || !finalAdminKey) {
              onError?.("Missing deployment URL or admin key");
              return;
            }

            const result = await deleteTable(
              clientInfo.deploymentUrl,
              finalAdminKey,
              [tableData.selectedTable],
              selectedComponentId,
            );

            if (!result.success) {
              onError?.(result.error || "Failed to delete table");
              return;
            }

            await tableData.fetchTables();
            const tableNames = Object.keys(tableData.tables);
            if (tableNames.length > 0) {
              tableData.setSelectedTable(tableNames[0]);
            } else {
              tableData.setSelectedTable("");
            }
          } catch (error: any) {
            console.error("Error deleting table:", error);
            onError?.(error?.message || "Failed to delete table");
          }
        }}
        title="Delete table"
        message={`Are you sure you want to permanently delete the table ${tableData.selectedTable}?`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={isDeleteRowsDialogOpen}
        onClose={() => {
          setIsDeleteRowsDialogOpen(false);
          setRowsToDelete([]);
        }}
        onConfirm={async () => {
          if (
            !tableData.selectedTable ||
            !adminClient ||
            rowsToDelete.length === 0
          ) {
            return;
          }

          try {
            const normalizedComponentId =
              selectedComponentId === "app" || selectedComponentId === null
                ? null
                : selectedComponentId;

            const result = await deleteDocuments(
              tableData.selectedTable,
              rowsToDelete,
              adminClient,
              normalizedComponentId,
            );

            if (result && typeof result === "object" && "success" in result) {
              if (!result.success) {
                toast("error", result.error || "Failed to delete documents");
                return;
              }
            }

            const count = rowsToDelete.length;
            toast(
              "success",
              `Deleted ${count} ${count === 1 ? "document" : "documents"}.`,
            );

            setSelectedDocumentIds([]);
            if (tableData.selectedTable) {
              tableData.fetchTableData(tableData.selectedTable, null);
            }
          } catch (error: any) {
            console.error("Error deleting documents:", error);
            toast("error", error?.message || "Failed to delete documents");
          } finally {
            setIsDeleteRowsDialogOpen(false);
            setRowsToDelete([]);
          }
        }}
        title={`Delete ${rowsToDelete.length.toLocaleString()} selected document${rowsToDelete.length > 1 ? "s" : ""}`}
        message="Are you sure you want to permanently delete these documents?"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  );
};

// Memoize DataView to prevent re-renders when parent re-renders
// but props haven't changed (e.g., when sheet state changes)
export const DataView = React.memo(DataViewComponent);
