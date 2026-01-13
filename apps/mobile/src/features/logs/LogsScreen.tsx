/**
 * Main Logs screen - Displays real-time function execution logs
 * Matches desktop design from dashboard-common/features/logs
 */

import React, { useState, useMemo, useRef, useCallback } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  TextInput,
  Text,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomSheet from "@gorhom/bottom-sheet";
import { useDeployment } from "../../contexts/DeploymentContext";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useSheet } from "../../contexts/SheetContext";
import { AppHeader } from "../../components/AppHeader";
import {
  useLogStream,
  filterLogsBySearch,
  filterLogsByFilters,
} from "./hooks/useLogStream";
import { LogCard } from "./components/LogCard";
import { LogTableHeader } from "./components/LogTableHeader";
import { LogDetailSheet } from "./components/LogDetailSheet";
import { BaseFilterSheet } from "../../components/sheets/BaseFilterSheet";
import {
  useLogFilterConfig,
  type LogFilters,
  type LogFilterClause,
} from "./hooks/useLogFilterConfig";
import { EmptyLogsState } from "./components/EmptyLogsState";
import type { LogEntry } from "../../api/logs";

// Inline wrapper component using the hook and base sheet

interface LogFilterSheetWrapperProps {
  sheetRef: React.RefObject<BottomSheet>;
  filters: LogFilters;
  onChangeFilters: (filters: LogFilters) => void;
}

function LogFilterSheetWrapper({
  sheetRef,
  filters,
  onChangeFilters,
}: LogFilterSheetWrapperProps) {
  const { config } = useLogFilterConfig({ filters });

  return (
    <BaseFilterSheet
      sheetRef={sheetRef}
      filters={filters}
      onChangeFilters={onChangeFilters}
      config={config}
    />
  );
}

export function LogsScreen() {
  const { deployment } = useDeployment();
  const { session } = useAuth();
  const { theme } = useTheme();
  const { openSheet } = useSheet();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [filters, setFilters] = useState<LogFilters>({
    clauses: [],
  });
  const detailSheetRef = useRef<BottomSheet>(null);
  const filterSheetRef = useRef<BottomSheet>(null);

  // Get deployment URL and access token
  const deploymentUrl = deployment
    ? (deployment.url ?? `https://${deployment.name}.convex.cloud`)
    : null;
  const accessToken = session?.accessToken;

  // Stream logs with auto-refresh
  const {
    logs,
    isLoading,
    error,
    isPaused,
    pause,
    resume,
    clearLogs,
    refetch,
  } = useLogStream(deploymentUrl, accessToken);

  // Filter logs by search query and filters
  const filteredLogs = useMemo(() => {
    console.log("[LogsScreen] Filtering logs:", {
      totalLogs: logs.length,
      searchQuery,
      filters,
    });

    let result = logs;

    // Apply search filter
    result = filterLogsBySearch(result, searchQuery);

    // Apply clause-based filters
    result = filterLogsByFilters(result, filters);

    console.log("[LogsScreen] Filtered result:", result.length);

    return result;
  }, [logs, searchQuery, filters]);

  // Handle log selection
  const handleLogPress = useCallback((log: LogEntry) => {
    setSelectedLog(log);
    detailSheetRef.current?.snapToIndex(0);
  }, []);

  // Handle sheet close
  const handleSheetClose = useCallback(() => {
    setSelectedLog(null);
  }, []);

  // Render individual log card
  const renderLogItem = ({ item }: { item: LogEntry }) => (
    <LogCard log={item} onPress={() => handleLogPress(item)} />
  );

  // Generate unique key for each log
  const keyExtractor = (item: LogEntry, index: number) =>
    `${item.timestamp}-${item.function?.request_id || index}`;

  // Handle pull to refresh
  const handleRefresh = () => {
    refetch();
  };

  // Open filter sheet
  const handleOpenFilters = () => {
    Keyboard.dismiss();
    filterSheetRef.current?.snapToIndex(0);
  };

  // Check if filters are active (only count clauses with values)
  const activeFilterCount = filters.clauses.filter(
    (clause) => clause.enabled && clause.value,
  ).length;
  const hasActiveFilters = activeFilterCount > 0;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={[]}
    >
      {/* Header */}
      <AppHeader
        title="Logs"
        actions={[
          {
            icon: "clear",
            onPress: clearLogs,
            color: theme.colors.error,
          },
          {
            icon: "filter",
            onPress: handleOpenFilters,
            color: hasActiveFilters ? theme.colors.primary : theme.colors.text,
            badge: hasActiveFilters ? activeFilterCount : undefined,
          },
          {
            icon: isPaused ? "toggle-off" : "toggle-on",
            onPress: isPaused ? resume : pause,
            color: isPaused
              ? theme.colors.textSecondary
              : theme.colors.success || "#22c55e",
          },
          {
            icon: "more-vertical",
            onPress: () => {
              Keyboard.dismiss();
              openSheet("menu");
            },
          },
        ]}
      />

      {/* Search bar */}
      <View style={styles.searchSection}>
        <TextInput
          style={[
            styles.searchInput,
            {
              color: theme.colors.text,
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
          placeholder="Filter logs..."
          placeholderTextColor={theme.colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Error message */}
      {error && (
        <View
          style={[
            styles.errorContainer,
            { backgroundColor: theme.colors.error + "10" },
          ]}
        >
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {error.message}
          </Text>
        </View>
      )}

      {/* No deployment selected */}
      {!deployment && (
        <View style={styles.emptyContainer}>
          <Text
            style={[styles.emptyText, { color: theme.colors.textSecondary }]}
          >
            No deployment selected
          </Text>
          <Text
            style={[styles.emptySubtext, { color: theme.colors.textTertiary }]}
          >
            Select a deployment to view logs
          </Text>
        </View>
      )}

      {/* Table header */}
      {deployment && <LogTableHeader />}

      {/* Logs table */}
      {deployment && (
        <FlatList
          data={filteredLogs}
          renderItem={renderLogItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={
            filteredLogs.length === 0 ? styles.emptyListContent : undefined
          }
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            !isLoading && !error ? (
              <EmptyLogsState isLoading={false} />
            ) : isLoading && filteredLogs.length === 0 ? (
              <EmptyLogsState isLoading={true} />
            ) : null
          }
          // Performance optimizations
          removeClippedSubviews={true}
          maxToRenderPerBatch={20}
          updateCellsBatchingPeriod={50}
          windowSize={10}
        />
      )}

      {/* Log Detail Sheet */}
      <LogDetailSheet
        sheetRef={detailSheetRef}
        log={selectedLog}
        allLogs={logs}
        onClose={handleSheetClose}
      />

      {/* Log Filter Sheet */}
      <LogFilterSheetWrapper
        sheetRef={filterSheetRef}
        filters={filters}
        onChangeFilters={setFilters}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    marginTop: -12,
  },
  searchInput: {
    fontSize: 14,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  errorContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 13,
    fontWeight: "500",
  },
  emptyListContent: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
