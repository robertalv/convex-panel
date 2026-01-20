/**
 * Data browser header component - Shows table name, view mode toggle, filter button
 * Uses AppHeader for consistent styling
 */

import React, { useMemo } from "react";
import { AppHeader, type AppHeaderAction } from "../../../components/AppHeader";
import type { DataViewMode, FilterExpression, SortConfig } from "../types";

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
  onTablePress?: () => void;
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
  onTablePress,
  onMenuPress,
}: DataHeaderProps) {
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
      : tableName
        ? "No documents"
        : undefined;

  // Build actions array for AppHeader
  const actions = useMemo<AppHeaderAction[]>(() => {
    const actionList: AppHeaderAction[] = [
      {
        icon: "filter",
        onPress: onFilterPress,
        badge: hasActiveFilters && filterCount > 0 ? filterCount : undefined,
        isActive: hasActiveFilters,
      },
    ];

    if (onSortPress) {
      actionList.push({
        icon:
          hasActiveSort && activeSortConfig?.direction === "asc"
            ? "sortAsc"
            : hasActiveSort && activeSortConfig?.direction === "desc"
              ? "sortDesc"
              : "arrow-up-down",
        onPress: onSortPress,
        isActive: hasActiveSort,
      });
    }

    if (onMenuPress) {
      actionList.push({
        icon: "more-vertical",
        onPress: onMenuPress,
      });
    }

    return actionList;
  }, [
    onFilterPress,
    onSortPress,
    onMenuPress,
    hasActiveFilters,
    filterCount,
    hasActiveSort,
    activeSortConfig?.direction,
  ]);

  return (
    <AppHeader
      title={tableName || "Select table"}
      subtitle={subtitle}
      onTitlePress={onTablePress}
      showChevron={!!onTablePress}
      chevronDirection="down"
      actions={actions}
    />
  );
}
