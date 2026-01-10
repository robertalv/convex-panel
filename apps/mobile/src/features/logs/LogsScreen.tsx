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
  TouchableOpacity,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomSheet from "@gorhom/bottom-sheet";
import { useDeployment } from "../../contexts/DeploymentContext";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { Icon } from "../../components/ui/Icon";
import {
  useLogStream,
  filterLogsBySearch,
  filterLogsByFilters,
} from "./hooks/useLogStream";
import { LogCard } from "./components/LogCard";
import { LogTableHeader } from "./components/LogTableHeader";
import { LogDetailSheet } from "./components/LogDetailSheet";
import { LogFilterSheet, type LogFilters } from "./components/LogFilterSheet";
import { EmptyLogsState } from "./components/EmptyLogsState";
import type { LogEntry } from "../../api/logs";

export function LogsScreen() {
  const { deployment } = useDeployment();
  const { session } = useAuth();
  const { theme } = useTheme();
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
      edges={["top"]}
    >
      {/* Header with search and actions */}
      <View style={styles.topSection}>
        {/* Search and buttons row */}
        <View style={styles.controlsRow}>
          <View style={styles.searchWrapper}>
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

          <TouchableOpacity
            style={styles.iconButton}
            onPress={clearLogs}
            activeOpacity={0.7}
          >
            <Icon name="clear" size={18} color={theme.colors.error} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleOpenFilters}
            activeOpacity={0.7}
          >
            <View style={styles.iconButtonContainer}>
              <Icon
                name="filter"
                size={18}
                color={
                  hasActiveFilters ? theme.colors.primary : theme.colors.text
                }
              />
              {hasActiveFilters && activeFilterCount > 0 && (
                <View
                  style={[
                    styles.filterBadge,
                    {
                      backgroundColor: theme.colors.primary,
                      borderColor: theme.colors.background,
                    },
                  ]}
                >
                  <Text style={styles.filterBadgeText}>
                    {activeFilterCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={isPaused ? resume : pause}
            activeOpacity={0.7}
          >
            <Icon
              name={isPaused ? "toggle-off" : "toggle-on"}
              size={18}
              color={
                isPaused
                  ? theme.colors.textSecondary
                  : theme.colors.success || "#22c55e"
              }
            />
          </TouchableOpacity>
        </View>
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
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
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
        onClose={handleSheetClose}
      />

      {/* Log Filter Sheet */}
      <LogFilterSheet
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
  topSection: {
    paddingHorizontal: 4,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
  },
  logCount: {
    fontSize: 14,
    fontWeight: "500",
  },
  controlsRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginLeft: 8,
  },
  searchWrapper: {
    flex: 1,
  },
  searchInput: {
    fontSize: 14,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  iconButtonContainer: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
  },
  filterBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
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
