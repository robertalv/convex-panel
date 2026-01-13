/**
 * Main Data Browser screen
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Keyboard,
} from "react-native";
import { useDeployment } from "../../contexts/DeploymentContext";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useSheet } from "../../contexts/SheetContext";
import {
  useTables,
  useDocuments,
  getAllDocuments,
  hasMoreDocuments,
  sortDocuments,
} from "./hooks/useTableData";
import { useDataPreferences } from "./hooks/useDataPreferences";
import { DataHeader } from "./components/DataHeader";
import { TableView } from "./components/views/TableView";
import type { TableDocument, DataViewMode } from "./types";
import BottomSheet from "@gorhom/bottom-sheet";
import { TableSelectorSheet } from "./components/TableSelectorSheet";
import { BaseFilterSheet } from "../../components/sheets/BaseFilterSheet";
import { BaseSortSheet } from "../../components/sheets/BaseSortSheet";
import { useDataFilterConfig } from "./hooks/useDataFilterConfig";
import { useDataSortConfig } from "./hooks/useDataSortConfig";
import { CellEditSheet } from "./components/CellEditSheet";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { patchDocumentFields } from "../../api/data";
import { dataQueryKeys } from "./hooks/useTableData";
import type { TableSchema, FilterExpression, SortConfig } from "./types";

// Inline wrapper components using the hooks and base sheets

interface DataFilterSheetWrapperProps {
  sheetRef: React.RefObject<BottomSheet>;
  schema?: TableSchema;
  filters: FilterExpression[];
  onChangeFilters: (filters: FilterExpression[]) => void;
}

function DataFilterSheetWrapper({
  sheetRef,
  schema,
  filters,
  onChangeFilters,
}: DataFilterSheetWrapperProps) {
  const { config, activeFilters, handleFiltersChange } = useDataFilterConfig({
    schema,
    filters,
    onChangeFilters,
  });

  return (
    <BaseFilterSheet
      sheetRef={sheetRef}
      filters={activeFilters}
      onChangeFilters={handleFiltersChange}
      config={config}
    />
  );
}

interface DataSortSheetWrapperProps {
  sheetRef: React.RefObject<BottomSheet>;
  schema?: TableSchema;
  sortConfig: SortConfig | null;
  onChangeSortConfig: (sortConfig: SortConfig | null) => void;
  tableName: string | null;
}

function DataSortSheetWrapper({
  sheetRef,
  schema,
  sortConfig,
  onChangeSortConfig,
  tableName,
}: DataSortSheetWrapperProps) {
  const { config } = useDataSortConfig({ schema });

  return (
    <BaseSortSheet
      sheetRef={sheetRef}
      sortConfig={sortConfig}
      onChangeSortConfig={onChangeSortConfig}
      config={config}
      schema={schema}
      tableName={tableName}
    />
  );
}

export function DataBrowserScreen() {
  const { deployment } = useDeployment();
  const { session } = useAuth();
  const { theme } = useTheme();
  const { openSheet } = useSheet();
  const queryClient = useQueryClient();
  const [editingCell, setEditingCell] = useState<{
    document: TableDocument;
    fieldName: string;
    value: any;
  } | null>(null);
  const tableSheetRef = useRef<BottomSheet>(null);
  const filterSheetRef = useRef<BottomSheet>(null);
  const sortSheetRef = useRef<BottomSheet>(null);
  const cellEditSheetRef = useRef<BottomSheet>(null);

  // Preferences
  const {
    selectedTable,
    viewMode,
    filters,
    sortConfig,
    isLoading: preferencesLoading,
    setSelectedTable,
    setViewMode,
    setFilters,
    setSortConfig,
  } = useDataPreferences();

  // Data fetching
  // Use deployment.url or construct from name if not available
  const deploymentUrl = deployment
    ? (deployment.url ?? `https://${deployment.name}.convex.cloud`)
    : null;
  const accessToken = session?.accessToken;

  const {
    data: tables,
    isLoading: tablesLoading,
    error: tablesError,
  } = useTables(deploymentUrl, accessToken);

  // Use persisted filters from preferences
  const normalizedFilters = filters;

  console.log("[DataBrowserScreen] Current filters state", {
    filters,
    normalizedFilters,
    clausesCount: normalizedFilters[0]?.clauses?.length || 0,
  });

  const documentsQuery = useDocuments(
    deploymentUrl,
    selectedTable,
    normalizedFilters,
    sortConfig, // Pass sort config to query
    50,
    accessToken,
  );
  const documentsData = documentsQuery.data;
  const documentsLoading = documentsQuery.isLoading;
  const isFetchingNextPage = documentsQuery.isFetchingNextPage;
  const hasNextPage = documentsQuery.hasNextPage;
  const fetchNextPage = documentsQuery.fetchNextPage;
  const refetch = documentsQuery.refetch;
  const documentsError = documentsQuery.error;

  // Get all documents and apply client-side sorting
  const rawDocuments = getAllDocuments(documentsData);
  const documents = sortDocuments(rawDocuments, sortConfig);
  const hasMore = hasMoreDocuments(documentsData);

  // Mutation for patching document fields
  const patchMutation = useMutation({
    mutationFn: async ({
      documentId,
      fields,
    }: {
      documentId: string;
      fields: Record<string, any>;
    }) => {
      if (!deploymentUrl || !accessToken || !selectedTable) {
        throw new Error("Missing required parameters");
      }
      await patchDocumentFields(
        deploymentUrl,
        accessToken,
        selectedTable,
        [documentId],
        fields,
      );
    },
    onSuccess: () => {
      // Invalidate and refetch documents
      queryClient.invalidateQueries({
        queryKey: dataQueryKeys.documentsWithFilters(
          deploymentUrl || "",
          selectedTable || "",
          normalizedFilters,
          sortConfig,
        ),
      });
    },
    onError: (error) => {
      Alert.alert(
        "Save Failed",
        error instanceof Error ? error.message : "Failed to save changes",
      );
    },
  });

  // Auto-select a default table when tables are loaded, similar to desktop
  useEffect(() => {
    if (
      !selectedTable &&
      tables &&
      tables.length > 0 &&
      !tablesLoading &&
      !preferencesLoading
    ) {
      // Choose the first available table; system tables are already filtered out
      console.log("[DataBrowser] Auto-selecting first table:", tables[0].name);
      setSelectedTable(tables[0].name);
    }
  }, [
    selectedTable,
    tables,
    tablesLoading,
    preferencesLoading,
    setSelectedTable,
  ]);

  // Debug logging for tables state
  useEffect(() => {
    console.log("[DataBrowser] Tables state:", {
      deployment: deployment
        ? {
            id: deployment.id,
            name: deployment.name,
            url: deployment.url,
          }
        : null,
      deploymentUrl,
      tablesLoading,
      tablesError: tablesError?.message,
      tablesCount: tables?.length || 0,
      tableNames: tables?.map((t) => t.name),
      selectedTable,
    });
  }, [
    deployment,
    deploymentUrl,
    tables,
    tablesLoading,
    tablesError,
    selectedTable,
  ]);

  // Handlers
  const handleSelectTable = useCallback(
    (tableName: string) => {
      setSelectedTable(tableName);
    },
    [setSelectedTable],
  );

  const handleViewModeToggle = useCallback(() => {
    setViewMode(viewMode === "list" ? "table" : "list");
  }, [viewMode, setViewMode]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleCellPress = useCallback(
    (document: TableDocument, fieldName: string, value: any) => {
      console.log("[DataBrowserScreen] Cell pressed:", { fieldName, value });
      // Don't dismiss keyboard here - we want it open for editing
      // The CellEditSheet has autoFocus which will open the keyboard
      setEditingCell({ document, fieldName, value });
      cellEditSheetRef.current?.snapToIndex(0);
    },
    [],
  );

  const handleCellSave = useCallback(
    async (newValue: string) => {
      if (!editingCell) return;

      console.log("[DataBrowserScreen] Cell save:", { newValue, editingCell });

      try {
        // Parse value based on original type (similar to desktop implementation)
        let parsedValue: any = newValue;
        const originalValue = editingCell.value;

        if (newValue === "" || newValue === "unset") {
          parsedValue = undefined;
        } else if (newValue === "null") {
          parsedValue = null;
        } else if (typeof originalValue === "string") {
          // If original was a string, keep the input as a string directly
          parsedValue = newValue;
        } else if (
          typeof originalValue === "object" &&
          originalValue !== null
        ) {
          try {
            parsedValue = JSON.parse(newValue);
          } catch {
            // Keep as string if JSON parse fails
            parsedValue = newValue;
          }
        } else if (typeof originalValue === "number") {
          const numValue = parseFloat(newValue);
          if (!isNaN(numValue)) {
            parsedValue = numValue;
          }
        } else if (typeof originalValue === "boolean") {
          if (newValue.toLowerCase() === "true") {
            parsedValue = true;
          } else if (newValue.toLowerCase() === "false") {
            parsedValue = false;
          }
        }

        // Only save if value changed
        const valueChanged =
          JSON.stringify(parsedValue) !== JSON.stringify(originalValue);

        if (valueChanged) {
          await patchMutation.mutateAsync({
            documentId: editingCell.document._id,
            fields: { [editingCell.fieldName]: parsedValue },
          });
        }

        // Clear editing state
        setEditingCell(null);
      } catch (error) {
        console.error("[DataBrowserScreen] Save error:", error);
        Alert.alert(
          "Save Failed",
          error instanceof Error ? error.message : "Failed to save changes",
        );
      }
    },
    [editingCell, patchMutation],
  );

  const handleCloseCellEdit = useCallback(() => {
    setEditingCell(null);
  }, []);

  const handleFilterPress = useCallback(() => {
    Keyboard.dismiss();
    filterSheetRef.current?.snapToIndex(0); // Open at first snap point (28% when empty)
  }, []);

  const handleSortPress = useCallback(() => {
    Keyboard.dismiss();
    sortSheetRef.current?.snapToIndex(0);
  }, []);

  const handleTableSelectorPress = useCallback(() => {
    Keyboard.dismiss();
    tableSheetRef.current?.snapToIndex(0);
  }, []);

  const handleMenuPress = useCallback(() => {
    Keyboard.dismiss();
    openSheet("menu");
  }, [openSheet]);

  // Error states
  const renderContent = () => {
    if (tablesError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={{ color: theme.colors.error }}>
            Failed to load tables
          </Text>
        </View>
      );
    }

    if (!deployment) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={{ color: theme.colors.textSecondary }}>
            No deployment selected
          </Text>
          <Text style={{ color: theme.colors.textTertiary, marginTop: 8 }}>
            Select a deployment to browse data
          </Text>
        </View>
      );
    }

    // Show empty state if tables are loaded but there are no tables
    if (!tablesLoading && tables && tables.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={{ color: theme.colors.textSecondary }}>
            No tables found
          </Text>
          <Text style={{ color: theme.colors.textTertiary, marginTop: 8 }}>
            Create tables in your Convex schema
          </Text>
        </View>
      );
    }

    // Show loading state only while tables are loading
    if (tablesLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text
            style={[styles.loadingText, { color: theme.colors.textSecondary }]}
          >
            Loading tables...
          </Text>
        </View>
      );
    }

    if (!selectedTable) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={{ color: theme.colors.textSecondary }}>
            Select a table to view documents
          </Text>
          <TouchableOpacity
            style={[
              styles.selectButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={handleMenuPress}
            activeOpacity={0.7}
          >
            <Text style={styles.selectButtonText}>Browse Tables</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Always use table view
    return (
      <TableView
        documents={documents}
        schema={tables?.find((t) => t.name === selectedTable)?.schema}
        onCellPress={handleCellPress}
        selectedCell={
          editingCell
            ? {
                documentId: editingCell.document._id,
                fieldName: editingCell.fieldName,
              }
            : null
        }
        onRefresh={handleRefresh}
        onLoadMore={handleLoadMore}
        isRefreshing={documentsLoading && !isFetchingNextPage}
        isLoadingMore={isFetchingNextPage}
        hasMore={hasMore}
      />
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Data header under native stack header */}
      <DataHeader
        tableName={selectedTable}
        viewMode="table"
        onViewModeToggle={handleViewModeToggle}
        onFilterPress={handleFilterPress}
        onSortPress={handleSortPress}
        onTablePress={handleTableSelectorPress}
        onMenuPress={handleMenuPress}
        activeFilters={normalizedFilters}
        activeSortConfig={sortConfig}
        documentCount={documents.length}
      />

      {/* Main content */}
      {renderContent()}

      {/* Table Selector Bottom Sheet */}
      <TableSelectorSheet
        sheetRef={tableSheetRef}
        tables={tables || []}
        selectedTable={selectedTable}
        isLoading={tablesLoading || preferencesLoading}
        onSelectTable={handleSelectTable}
      />

      {/* Filters Bottom Sheet */}
      <DataFilterSheetWrapper
        sheetRef={filterSheetRef}
        schema={tables?.find((t) => t.name === selectedTable)?.schema}
        filters={filters}
        onChangeFilters={setFilters}
      />

      {/* Sort Bottom Sheet */}
      <DataSortSheetWrapper
        sheetRef={sortSheetRef}
        schema={tables?.find((t) => t.name === selectedTable)?.schema}
        sortConfig={sortConfig}
        onChangeSortConfig={setSortConfig}
        tableName={selectedTable}
      />

      {/* Cell Edit Bottom Sheet */}
      <CellEditSheet
        sheetRef={cellEditSheetRef}
        fieldName={editingCell?.fieldName ?? null}
        value={editingCell?.value}
        onSave={handleCellSave}
        onClose={handleCloseCellEdit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  selectButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  selectButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
});
