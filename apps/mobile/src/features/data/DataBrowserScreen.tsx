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
} from "react-native";
import { useDeployment } from "../../contexts/DeploymentContext";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import {
  useTables,
  useDocuments,
  getAllDocuments,
  hasMoreDocuments,
  sortDocuments,
} from "./hooks/useTableData";
import { useDataPreferences } from "./hooks/useDataPreferences";
import { DataHeader } from "./components/DataHeader";
import { ListView } from "./components/views/ListView";
import { TableView } from "./components/views/TableView";
import type { TableDocument, DataViewMode } from "./types";
import BottomSheet from "@gorhom/bottom-sheet";
import { TableSelectorSheet } from "./components/TableSelectorSheet";
import { DataFilterSheet } from "./components/DataFilterSheet";
import { DataSortSheet } from "./components/DataSortSheet";
import { DetailSheet } from "./components/DetailSheet";
import { ViewModeSheet } from "./components/ViewModeSheet";

export function DataBrowserScreen() {
  const { deployment } = useDeployment();
  const { session } = useAuth();
  const { theme } = useTheme();
  const [selectedDocumentIndex, setSelectedDocumentIndex] = useState<
    number | null
  >(null);
  const tableSheetRef = useRef<BottomSheet>(null);
  const filterSheetRef = useRef<BottomSheet>(null);
  const sortSheetRef = useRef<BottomSheet>(null);
  const viewModeSheetRef = useRef<BottomSheet>(null);
  const detailSheetRef = useRef<BottomSheet>(null);

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
      setSelectedDocumentIndex(null);
    },
    [setSelectedTable],
  );

  const handleViewModeToggle = useCallback(() => {
    setViewMode(viewMode === "list" ? "table" : "list");
  }, [viewMode, setViewMode]);

  const handleDocumentPress = useCallback(
    (document: TableDocument, index: number) => {
      setSelectedDocumentIndex(index);
      detailSheetRef.current?.snapToIndex(0);
    },
    [],
  );

  const handleCloseDetail = useCallback(() => {
    setSelectedDocumentIndex(null);
    detailSheetRef.current?.close();
  }, []);

  const handleNavigatePrevious = useCallback(() => {
    if (selectedDocumentIndex !== null && selectedDocumentIndex > 0) {
      setSelectedDocumentIndex(selectedDocumentIndex - 1);
    }
  }, [selectedDocumentIndex]);

  const handleNavigateNext = useCallback(() => {
    if (
      selectedDocumentIndex !== null &&
      selectedDocumentIndex < documents.length - 1
    ) {
      setSelectedDocumentIndex(selectedDocumentIndex + 1);
    }
  }, [selectedDocumentIndex, documents.length]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleFilterPress = useCallback(() => {
    filterSheetRef.current?.snapToIndex(0); // Open at first snap point (28% when empty)
  }, []);

  const handleSortPress = useCallback(() => {
    sortSheetRef.current?.snapToIndex(0);
  }, []);

  const handleViewModePress = useCallback(() => {
    viewModeSheetRef.current?.snapToIndex(0);
  }, []);

  const handleSelectViewMode = useCallback(
    (mode: DataViewMode) => {
      setViewMode(mode);
    },
    [setViewMode],
  );

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
            onPress={() => tableSheetRef.current?.expand()}
            activeOpacity={0.7}
          >
            <Text style={styles.selectButtonText}>Browse Tables</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (viewMode === "table") {
      return (
        <TableView
          documents={documents}
          schema={tables?.find((t) => t.name === selectedTable)?.schema}
          onDocumentPress={handleDocumentPress}
          onRefresh={handleRefresh}
          onLoadMore={handleLoadMore}
          isRefreshing={documentsLoading && !isFetchingNextPage}
          isLoadingMore={isFetchingNextPage}
          hasMore={hasMore}
        />
      );
    }

    return (
      <ListView
        documents={documents}
        onDocumentPress={handleDocumentPress}
        onRefresh={handleRefresh}
        onLoadMore={handleLoadMore}
        isRefreshing={documentsLoading && !isFetchingNextPage}
        isLoadingMore={isFetchingNextPage}
        hasMore={hasMore}
      />
    );
  };

  const selectedDocument =
    selectedDocumentIndex !== null ? documents[selectedDocumentIndex] : null;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Data header under native stack header */}
      <DataHeader
        tableName={selectedTable}
        viewMode={viewMode}
        onViewModeToggle={handleViewModeToggle}
        onViewModePress={handleViewModePress}
        onFilterPress={handleFilterPress}
        onSortPress={handleSortPress}
        onMenuPress={() => tableSheetRef.current?.expand()}
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
      <DataFilterSheet
        sheetRef={filterSheetRef}
        tableName={selectedTable}
        schema={tables?.find((t) => t.name === selectedTable)?.schema}
        filters={filters}
        onChangeFilters={setFilters}
      />

      {/* Sort Bottom Sheet */}
      <DataSortSheet
        sheetRef={sortSheetRef}
        tableName={selectedTable}
        schema={tables?.find((t) => t.name === selectedTable)?.schema}
        sortConfig={sortConfig}
        onChangeSortConfig={setSortConfig}
      />

      {/* View Mode Selector Bottom Sheet */}
      <ViewModeSheet
        sheetRef={viewModeSheetRef}
        currentViewMode={viewMode}
        onSelectViewMode={handleSelectViewMode}
      />

      {/* Document Detail Bottom Sheet */}
      <DetailSheet
        sheetRef={detailSheetRef}
        document={selectedDocument}
        onClose={handleCloseDetail}
        onNavigatePrevious={
          selectedDocumentIndex !== null && selectedDocumentIndex > 0
            ? handleNavigatePrevious
            : undefined
        }
        onNavigateNext={
          selectedDocumentIndex !== null &&
          selectedDocumentIndex < documents.length - 1
            ? handleNavigateNext
            : undefined
        }
        currentIndex={selectedDocumentIndex ?? undefined}
        totalCount={documents.length}
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
