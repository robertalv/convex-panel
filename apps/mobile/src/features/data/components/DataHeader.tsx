/**
 * Data browser header component - Shows table name, view mode toggle, filter button
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../contexts/ThemeContext";
import type { DataViewMode, FilterExpression, SortConfig } from "../types";
import { Icon } from "../../../components/ui/Icon";

export interface DataHeaderProps {
  tableName: string | null;
  viewMode: DataViewMode;
  onViewModeToggle: () => void;
  onViewModePress?: () => void;
  onFilterPress: () => void;
  onSortPress?: () => void;
  activeFilters: FilterExpression[];
  activeSortConfig?: SortConfig | null;
  documentCount?: number;
  onMenuPress?: () => void;
}

export function DataHeader({
  tableName,
  viewMode,
  onViewModeToggle,
  onViewModePress,
  onFilterPress,
  onSortPress,
  activeFilters,
  activeSortConfig,
  documentCount,
  onMenuPress,
}: DataHeaderProps) {
  const { theme } = useTheme();
  // Check if there are actual filter clauses (not just empty filter expressions)
  const hasActiveFilters =
    activeFilters.length > 0 &&
    activeFilters.some((filter) => filter.clauses && filter.clauses.length > 0);

  // Calculate total filter count (sum of all clauses across all filters)
  const filterCount = activeFilters.reduce(
    (total, filter) => total + (filter.clauses?.length || 0),
    0,
  );

  const hasActiveSort =
    activeSortConfig !== null && activeSortConfig !== undefined;

  const subtitle =
    tableName && documentCount !== undefined && documentCount > 0
      ? `${documentCount.toLocaleString()} ${
          documentCount === 1 ? "document" : "documents"
        }`
      : "";

  return (
    <SafeAreaView
      edges={["top"]}
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
        },
      ]}
    >
      {/* Header row - visually matches DeploymentHeader */}
      <TouchableOpacity
        style={styles.content}
        onPress={() => {
          console.log("[DataHeader] Menu button pressed");
          onMenuPress?.();
        }}
        activeOpacity={0.7}
      >
        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Text
              style={[styles.title, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {tableName || "Select table"}
            </Text>
            <Icon
              name="chevron-down"
              size={20}
              color={theme.colors.textSecondary}
            />
          </View>
          {subtitle !== "" && (
            <Text
              style={[styles.subtitle, { color: theme.colors.textSecondary }]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>

        {/* Header actions: filter and sort buttons */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onFilterPress}
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
              {hasActiveFilters && filterCount > 0 && (
                <View
                  style={[
                    styles.filterBadge,
                    {
                      backgroundColor: theme.colors.primary,
                      borderColor: theme.colors.background,
                    },
                  ]}
                >
                  <Text style={styles.filterBadgeText}>{filterCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={onSortPress}
            activeOpacity={0.7}
          >
            <Icon
              name={
                hasActiveSort
                  ? activeSortConfig?.direction === "asc"
                    ? "sortAsc"
                    : "sortDesc"
                  : "arrow-up-down"
              }
              size={18}
              color={hasActiveSort ? theme.colors.primary : theme.colors.text}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 0,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingVertical: 8,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 8,
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
  viewModeToggle: {
    flexDirection: "row",
    borderRadius: 8,
    padding: 2,
    marginRight: 8,
  },
  viewModeButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 60,
    alignItems: "center",
  },
  viewModeText: {
    fontSize: 13,
    fontWeight: "500",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: "auto",
  },
  filterText: {
    fontSize: 13,
    fontWeight: "500",
    marginLeft: 6,
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
    borderColor: "transparent",
  },
  filterBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
});
