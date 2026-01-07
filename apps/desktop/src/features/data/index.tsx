/**
 * DataView Feature
 * Main orchestrating component for the desktop data browser
 * Uses hooks and components from this feature, avoiding convex-panel dependencies
 */

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useDeployment } from "@/contexts/DeploymentContext";
import { useTheme } from "@/contexts/ThemeContext";
import { AlertCircle, X, PanelLeftOpen } from "lucide-react";

// Hooks
import { useTableData } from "./hooks/useTableData";
import { useComponents } from "./hooks/useComponents";
import { useTableExport } from "./hooks/useTableExport";
import { useIndexes } from "./hooks/useIndexes";

// Components
import { DataSidebar } from "./components/DataSidebar";
import { DataToolbar } from "./components/DataToolbar";
import { FilterPanel } from "./components/FilterPanel";
import { DocumentEditor } from "./components/DocumentEditor";
import { SchemaSheet } from "./components/SchemaSheet";
import { IndexesSheet } from "./components/IndexesSheet";

// Views
import { TableView } from "./components/views/TableView";
import { ListView } from "./components/views/ListView";
import { JsonView } from "./components/views/JsonView";

// Types
import type {
  DataViewMode,
  ExportFormat,
  SortConfig,
  FilterClause,
} from "./types";

// Utils
import { getViewMode, saveViewMode } from "./utils/storage";
import { cn } from "@/lib/utils";

// Sidebar config
const DEFAULT_SIDEBAR_WIDTH = 240;
const MIN_SIDEBAR_WIDTH = 180;
const MAX_SIDEBAR_WIDTH = 400;

/**
 * Resizable divider component
 */
function ResizeDivider({ onResize }: { onResize: (delta: number) => void }) {
  const isDragging = useRef(false);
  const startPos = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      startPos.current = e.clientX;

      const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging.current) return;
        const currentPos = e.clientX;
        const delta = currentPos - startPos.current;
        startPos.current = currentPos;
        onResize(delta);
      };

      const handleMouseUp = () => {
        isDragging.current = false;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [onResize],
  );

  return (
    <div
      className="w-1 cursor-col-resize transition-colors flex-shrink-0"
      style={{
        backgroundColor: "var(--color-border-base)",
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "var(--color-border-strong)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "var(--color-border-base)";
      }}
    />
  );
}

type SheetType = "add" | "edit" | "schema" | "indexes" | null;

interface SheetState {
  type: SheetType;
  documentId?: string;
  cloneData?: Record<string, any>;
}

/**
 * Main DataView component - orchestrates all sub-components
 */
function DataViewContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { deploymentUrl, authToken, useMockData, adminClient } =
    useDeployment();

  // View mode state
  const [viewMode, setViewMode] = useState<DataViewMode>(() => {
    return getViewMode() || "table";
  });

  // Filter panel visibility
  const [showFilters, setShowFilters] = useState(false);

  // Sheet state (for add/edit/schema/indexes)
  const [sheetState, setSheetState] = useState<SheetState>({ type: null });

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Visible fields state for column visibility
  const [visibleFields, setVisibleFields] = useState<string[]>([]);

  // Error state for display
  const [displayError, setDisplayError] = useState<string | null>(null);

  // Sidebar state
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Get initial table from URL
  const initialTable = searchParams.get("table");
  const initialDocId = searchParams.get("doc");

  // Components hook (for multi-component apps)
  const { componentNames, selectedComponentId, setSelectedComponent } =
    useComponents({
      adminClient,
      useMockData,
    });

  // Table data hook
  const {
    tables,
    selectedTable,
    setSelectedTable,
    documents,
    isLoading,
    error,
    documentCount,
    hasMore,
    isLoadingMore,
    filters,
    setFilters,
    sortConfig,
    setSortConfig,
    observerTarget,
    refreshData,
    addDocument,
    patchDocumentFields,
    deleteDocuments,
  } = useTableData({
    convexUrl: deploymentUrl || "",
    accessToken: authToken || "",
    adminClient,
    useMockData,
    componentId: selectedComponentId,
    onError: (err) => setDisplayError(err),
  });

  // Export hook
  const { isExporting, exportCurrentResults, exportFullTable } = useTableExport(
    {
      adminClient,
      componentId: selectedComponentId,
    },
  );

  // Indexes hook - fetch available indexes for the selected table
  const { indexes, isLoading: indexesLoading } = useIndexes({
    adminClient,
    tableName: selectedTable,
    componentId: selectedComponentId,
    enabled: !!selectedTable && showFilters,
  });

  // Handle table selection with URL sync
  const handleSelectTable = useCallback(
    (tableName: string) => {
      setSelectedTable(tableName);
      setSelectedIds([]);
      setSearchParams({ table: tableName });
    },
    [setSelectedTable, setSearchParams],
  );

  // Track if we've already synced from URL to prevent loops
  const hasInitializedFromUrl = useRef(false);
  const hasInitializedDocFilter = useRef(false);

  // Set initial table from URL on first load (only once when tables are available)
  useEffect(() => {
    if (
      !hasInitializedFromUrl.current &&
      initialTable &&
      tables[initialTable] &&
      selectedTable !== initialTable
    ) {
      hasInitializedFromUrl.current = true;
      handleSelectTable(initialTable);
    }
  }, [initialTable, tables, selectedTable, handleSelectTable]);

  // Apply doc filter from URL (for navigating from Health view to specific document)
  useEffect(() => {
    if (
      !hasInitializedDocFilter.current &&
      initialDocId &&
      selectedTable &&
      tables[selectedTable]
    ) {
      hasInitializedDocFilter.current = true;
      // Create a filter for the document ID
      const docFilter: FilterClause = {
        id: `doc-${Date.now()}`,
        field: "_id",
        op: "eq",
        value: initialDocId,
        enabled: true,
      };
      setFilters((prev) => ({
        ...prev,
        clauses: [docFilter, ...prev.clauses.filter((c) => c.field !== "_id")],
      }));
      // Show the filter panel so user can see the applied filter
      setShowFilters(true);
      // Clear the doc param from URL to avoid re-applying on refresh
      setSearchParams((params) => {
        const newParams = new URLSearchParams(params);
        newParams.delete("doc");
        return newParams;
      });
    }
  }, [initialDocId, selectedTable, tables, setFilters, setSearchParams]);

  // Handle view mode change
  const handleViewModeChange = useCallback((mode: DataViewMode) => {
    setViewMode(mode);
    saveViewMode(mode);
  }, []);

  // Handle sort (for clicking column headers - toggles through asc -> desc -> clear)
  const handleSort = useCallback(
    (field: string) => {
      setSortConfig((prev: SortConfig | null) => {
        if (prev?.field === field) {
          // Toggle direction or clear
          if (prev.direction === "asc") {
            return { field, direction: "desc" };
          } else {
            return null; // Clear sort
          }
        }
        return { field, direction: "asc" };
      });
    },
    [setSortConfig],
  );

  // Handle sort change from SortPanel (explicit field + direction)
  const handleSortChange = useCallback(
    (field: string, direction: "asc" | "desc") => {
      setSortConfig({ field, direction });
    },
    [setSortConfig],
  );

  // Clear sort
  const handleClearSort = useCallback(() => {
    setSortConfig(null);
  }, [setSortConfig]);

  // Check if there are active filters
  const hasActiveFilters = filters.clauses.filter((c) => c.enabled).length > 0;

  // Handle export
  // If there are active filters, export filtered results; otherwise export all
  const handleExport = useCallback(
    (format: ExportFormat) => {
      if (hasActiveFilters) {
        // Export current filtered results
        exportCurrentResults(documents, selectedTable, format);
      } else {
        // Export full table
        exportFullTable(selectedTable, format);
      }
    },
    [
      selectedTable,
      documents,
      hasActiveFilters,
      exportCurrentResults,
      exportFullTable,
    ],
  );

  // Handle add document
  const handleAddDocument = useCallback(
    async (doc: Record<string, any>) => {
      await addDocument(selectedTable, doc);
    },
    [selectedTable, addDocument],
  );

  // Handle edit document
  const handleEditDocument = useCallback(
    async (doc: Record<string, any>) => {
      if (!sheetState.documentId) return;
      await patchDocumentFields(selectedTable, [sheetState.documentId], doc);
    },
    [selectedTable, sheetState.documentId, patchDocumentFields],
  );

  // Handle delete document
  const handleDeleteDocument = useCallback(
    async (documentId: string) => {
      if (window.confirm("Are you sure you want to delete this document?")) {
        await deleteDocuments(selectedTable, [documentId]);
        setSelectedIds((prev) => prev.filter((id) => id !== documentId));
      }
    },
    [selectedTable, deleteDocuments],
  );

  // Handle clone document
  const handleCloneDocument = useCallback((doc: Record<string, any>) => {
    // Remove system fields and open add sheet with pre-filled data
    const { _id, _creationTime, ...cloneData } = doc;
    setSheetState({ type: "add", cloneData });
  }, []);

  // Handle opening edit sheet
  const handleOpenEdit = useCallback((documentId: string) => {
    setSheetState({ type: "edit", documentId });
  }, []);

  // Handle inline cell edit (for TableView)
  const handlePatchDocument = useCallback(
    async (documentId: string, fields: Record<string, any>) => {
      await patchDocumentFields(selectedTable, [documentId], fields);
      // Refresh to get updated data
      await refreshData();
    },
    [selectedTable, patchDocumentFields, refreshData],
  );

  // Handle bulk delete of selected documents
  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.length === 0) return;

    const confirmMessage =
      selectedIds.length === 1
        ? "Are you sure you want to delete this document?"
        : `Are you sure you want to delete ${selectedIds.length} documents?`;

    if (window.confirm(confirmMessage)) {
      await deleteDocuments(selectedTable, selectedIds);
      setSelectedIds([]);
    }
  }, [selectedTable, selectedIds, deleteDocuments]);

  // Handle edit of first selected document
  const handleEditSelected = useCallback(() => {
    if (selectedIds.length === 1) {
      setSheetState({ type: "edit", documentId: selectedIds[0] });
    }
  }, [selectedIds]);

  // Clear selection
  const handleClearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  // Get current schema for selected table
  const currentSchema = selectedTable ? tables[selectedTable] : undefined;

  // Compute all unique fields from documents and schema
  const allFields = useMemo(() => {
    const schemaFields = currentSchema?.fields?.map((f) => f.fieldName) || [];
    const docFields = new Set<string>();

    documents.forEach((doc) => {
      Object.keys(doc).forEach((key) => {
        // Skip system fields - we add them explicitly
        if (key !== "_id" && key !== "_creationTime") {
          docFields.add(key);
        }
      });
    });

    // Build ordered list: _id, schema fields (except system fields), doc fields, _creationTime
    const ordered = ["_id"];
    schemaFields.forEach((f) => {
      if (f !== "_id" && f !== "_creationTime" && !ordered.includes(f)) {
        ordered.push(f);
      }
    });
    docFields.forEach((f) => {
      if (!ordered.includes(f)) ordered.push(f);
    });
    ordered.push("_creationTime");

    return ordered;
  }, [documents, currentSchema]);

  // Build column metadata for sort panel (type labels)
  const columnMeta = useMemo(() => {
    const meta: Record<string, { typeLabel: string; optional: boolean }> = {};

    // Add system fields
    meta["_id"] = { typeLabel: "Id", optional: false };
    meta["_creationTime"] = { typeLabel: "number", optional: false };

    // Add schema fields
    if (currentSchema?.fields) {
      currentSchema.fields.forEach((field) => {
        if (field.fieldName !== "_id" && field.fieldName !== "_creationTime") {
          meta[field.fieldName] = {
            typeLabel: field.shape?.type || "any",
            optional: field.optional ?? false,
          };
        }
      });
    }

    // Add any fields from documents that aren't in schema
    allFields.forEach((field) => {
      if (!meta[field]) {
        meta[field] = { typeLabel: "unknown", optional: true };
      }
    });

    return meta;
  }, [currentSchema, allFields]);

  // Track previous table and allFields to detect real changes
  const prevSelectedTable = useRef(selectedTable);
  const prevAllFieldsRef = useRef<string[]>([]);
  const hasUserModifiedVisibility = useRef(false);

  // Reset visible fields when table changes
  useEffect(() => {
    if (prevSelectedTable.current !== selectedTable) {
      // Table changed - reset to show all fields
      setVisibleFields(allFields);
      prevSelectedTable.current = selectedTable;
      prevAllFieldsRef.current = allFields;
      hasUserModifiedVisibility.current = false;
    }
  }, [selectedTable, allFields]);

  // Handle new fields appearing (from documents loading)
  useEffect(() => {
    // Skip if this is the initial render or table just changed
    if (prevAllFieldsRef.current.length === 0) {
      prevAllFieldsRef.current = allFields;
      if (visibleFields.length === 0) {
        setVisibleFields(allFields);
      }
      return;
    }

    // Find truly new fields that weren't in the previous allFields
    const newFields = allFields.filter(
      (f) => !prevAllFieldsRef.current.includes(f),
    );

    // Only add new fields if there are any
    if (newFields.length > 0) {
      setVisibleFields((prev) => [...prev, ...newFields]);
    }

    prevAllFieldsRef.current = allFields;
  }, [allFields]);

  // Wrap setVisibleFields to track user modifications
  const handleVisibleFieldsChange = useCallback((fields: string[]) => {
    hasUserModifiedVisibility.current = true;
    setVisibleFields(fields);
  }, []);

  // Get document for editing
  const editingDocument = useMemo(() => {
    if (sheetState.type === "edit" && sheetState.documentId) {
      return documents.find((d) => d._id === sheetState.documentId) || null;
    }
    return null;
  }, [sheetState, documents]);

  // Initial document for add sheet (could be clone data)
  const initialAddDocument = useMemo(() => {
    if (sheetState.type === "add" && sheetState.cloneData) {
      return sheetState.cloneData;
    }
    return null;
  }, [sheetState]);

  // Client-side sorting of documents
  const sortedDocuments = useMemo(() => {
    if (!sortConfig) return documents;

    const { field, direction } = sortConfig;
    return [...documents].sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];

      // Handle null/undefined
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return direction === "asc" ? 1 : -1;
      if (bVal == null) return direction === "asc" ? -1 : 1;

      // Compare values
      let comparison = 0;
      if (typeof aVal === "number" && typeof bVal === "number") {
        comparison = aVal - bVal;
      } else if (typeof aVal === "string" && typeof bVal === "string") {
        comparison = aVal.localeCompare(bVal);
      } else if (typeof aVal === "boolean" && typeof bVal === "boolean") {
        comparison = aVal === bVal ? 0 : aVal ? 1 : -1;
      } else {
        // Fallback to string comparison
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return direction === "asc" ? comparison : -comparison;
    });
  }, [documents, sortConfig]);

  // Render the current view
  const renderView = () => {
    switch (viewMode) {
      case "list":
        return (
          <ListView
            documents={sortedDocuments}
            schema={currentSchema}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            observerTarget={observerTarget}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onEdit={handleOpenEdit}
            onClone={handleCloneDocument}
            onDelete={handleDeleteDocument}
            onPatchDocument={handlePatchDocument}
          />
        );
      case "json":
        return (
          <JsonView
            documents={sortedDocuments}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            observerTarget={observerTarget}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onEdit={handleOpenEdit}
            onClone={handleCloneDocument}
            onDelete={handleDeleteDocument}
            onPatchDocument={handlePatchDocument}
          />
        );
      case "table":
      default:
        return (
          <TableView
            documents={sortedDocuments}
            schema={currentSchema}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            observerTarget={observerTarget}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            sortConfig={sortConfig}
            onSort={handleSort}
            onEdit={handleOpenEdit}
            onClone={handleCloneDocument}
            onDelete={handleDeleteDocument}
            onPatchDocument={handlePatchDocument}
            visibleFields={visibleFields}
            tableName={selectedTable}
            onAddDocument={() => setSheetState({ type: "add" })}
          />
        );
    }
  };

  // Render the sheet content
  const renderSheet = () => {
    switch (sheetState.type) {
      case "add":
        return (
          <DocumentEditor
            mode="add"
            tableName={selectedTable}
            schema={currentSchema}
            initialDocument={initialAddDocument}
            onSave={handleAddDocument}
            onClose={() => setSheetState({ type: null })}
          />
        );
      case "edit":
        return (
          <DocumentEditor
            mode="edit"
            tableName={selectedTable}
            schema={currentSchema}
            initialDocument={editingDocument}
            onSave={handleEditDocument}
            onClose={() => setSheetState({ type: null })}
          />
        );
      case "schema":
        return (
          <SchemaSheet
            tableName={selectedTable}
            schema={currentSchema || null}
            onClose={() => setSheetState({ type: null })}
          />
        );
      case "indexes":
        return (
          <IndexesSheet
            tableName={selectedTable}
            adminClient={adminClient}
            componentId={selectedComponentId}
            onClose={() => setSheetState({ type: null })}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="flex h-full w-full overflow-hidden"
      style={{ backgroundColor: "var(--color-surface-base)" }}
    >
      {/* Sidebar toggle when collapsed */}
      {sidebarCollapsed && (
        <button
          onClick={() => setSidebarCollapsed(false)}
          className="flex items-center justify-center w-10 h-full transition-colors"
          style={{
            backgroundColor: "var(--color-surface-base)",
            borderRight: "1px solid var(--color-border-base)",
            color: "var(--color-text-subtle)",
          }}
          title="Show sidebar"
        >
          <PanelLeftOpen size={16} />
        </button>
      )}

      {/* Sidebar */}
      {!sidebarCollapsed && (
        <>
          <DataSidebar
            tables={tables}
            selectedTable={selectedTable}
            onSelectTable={handleSelectTable}
            isLoading={isLoading && Object.keys(tables).length === 0}
            width={sidebarWidth}
            selectedComponent={selectedComponentId}
            onComponentSelect={setSelectedComponent}
            components={componentNames}
          />
          <ResizeDivider
            onResize={(delta) => {
              setSidebarWidth((prev) => {
                const newWidth = prev + delta;
                return Math.max(
                  MIN_SIDEBAR_WIDTH,
                  Math.min(MAX_SIDEBAR_WIDTH, newWidth),
                );
              });
            }}
          />
        </>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Error banner */}
        {(error || displayError) && (
          <div
            className="flex items-center gap-2 px-3 py-2 text-xs"
            style={{
              backgroundColor: "var(--color-error-base-alpha)",
              color: "var(--color-error-base)",
              borderBottom: "1px solid var(--color-error-base)",
            }}
          >
            <AlertCircle size={14} />
            <span className="flex-1">{error || displayError}</span>
            <button
              type="button"
              onClick={() => setDisplayError(null)}
              className="p-0.5 rounded hover:bg-[var(--color-error-base)]"
              style={{ color: "var(--color-error-base)" }}
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Toolbar */}
        <DataToolbar
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
          filters={filters}
          onClearFilters={() => setFilters({ clauses: [] })}
          onAddDocument={() => setSheetState({ type: "add" })}
          onExport={handleExport}
          isExporting={isExporting}
          documentCount={documentCount}
          selectedTable={selectedTable}
          isLoading={isLoading}
          hasActiveFilters={hasActiveFilters}
          allFields={allFields}
          visibleFields={visibleFields}
          onVisibleFieldsChange={handleVisibleFieldsChange}
          selectedCount={selectedIds.length}
          onDeleteSelected={handleBulkDelete}
          onEditSelected={handleEditSelected}
          onClearSelection={handleClearSelection}
          sortConfig={sortConfig}
          onSortChange={handleSortChange}
          onClearSort={handleClearSort}
          columnMeta={columnMeta}
          onCollapseSidebar={() => setSidebarCollapsed(true)}
          sidebarCollapsed={sidebarCollapsed}
        />

        {/* Filter panel (collapsible) */}
        {showFilters && (
          <FilterPanel
            filters={filters}
            onFiltersChange={setFilters}
            schema={currentSchema}
            onClose={() => setShowFilters(false)}
            tableName={selectedTable}
            componentId={selectedComponentId}
            documentCount={documentCount}
            isLoading={isLoading}
            indexes={indexes}
            indexesLoading={indexesLoading}
            defaultDocument={documents[0] || {}}
            onOpenSchema={() => setSheetState({ type: "schema" })}
            onOpenIndexes={() => setSheetState({ type: "indexes" })}
          />
        )}

        {/* View content */}
        <div
          className={cn(
            "flex-1 min-h-0 overflow-hidden",
            showFilters && "border-t border-border-base",
          )}
        >
          {renderView()}
        </div>
      </div>

      {/* Sheet panel (slides in from right) */}
      {sheetState.type && (
        <div
          className="flex-shrink-0"
          style={{
            width: "400px",
            minWidth: "400px",
            maxWidth: "400px",
            height: "100%",
            borderLeft: "1px solid var(--color-border-base)",
            animation: "slideInRight 0.2s ease-out",
          }}
        >
          {renderSheet()}
        </div>
      )}

      {/* Keyframe animation */}
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * DataView wrapper with theme
 */
export function DataView() {
  const { resolvedTheme } = useTheme();

  return (
    <div className={`cp-theme-${resolvedTheme} h-full`}>
      <DataViewContent />
    </div>
  );
}

export default DataView;
