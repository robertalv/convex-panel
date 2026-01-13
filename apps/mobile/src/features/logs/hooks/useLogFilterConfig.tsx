/**
 * useLogFilterConfig - Hook to generate BaseFilterSheet configuration for log filtering
 * Encapsulates all the domain-specific logic for filtering log entries.
 */

import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "../../../contexts/ThemeContext";
import { Icon } from "../../../components/ui/Icon";
import { filterSheetStyles } from "../../../components/sheets/filterSheetStyles";
import type { BaseFilterSheetConfig } from "../../../components/sheets/BaseFilterSheet";

// Types
export interface LogFilterClause {
  id: string;
  type: "functionType" | "status" | "logLevel";
  value: string;
  enabled: boolean;
}

export interface LogFilters {
  clauses: LogFilterClause[];
}

type FilterType = "functionType" | "status" | "logLevel" | null;

// Constants
const FUNCTION_TYPES = [
  { value: "query", label: "Query" },
  { value: "mutation", label: "Mutation" },
  { value: "action", label: "Action" },
];

const STATUSES = [
  { value: "success", label: "Success" },
  { value: "error", label: "Error" },
  { value: "failure", label: "Failure" },
];

const LOG_LEVELS = [
  { value: "DEBUG", label: "Debug" },
  { value: "INFO", label: "Info" },
  { value: "WARN", label: "Warning" },
  { value: "ERROR", label: "Error" },
];

export interface UseLogFilterConfigOptions {
  filters: LogFilters;
}

export interface UseLogFilterConfigResult {
  config: BaseFilterSheetConfig<LogFilterClause>;
}

export function useLogFilterConfig({
  filters,
}: UseLogFilterConfigOptions): UseLogFilterConfigResult {
  const { theme } = useTheme();

  const getFilterTypeLabel = (type: FilterType): string => {
    switch (type) {
      case "functionType":
        return "Function Type";
      case "status":
        return "Status";
      case "logLevel":
        return "Log Level";
      default:
        return "Filter";
    }
  };

  const getFilterValueLabel = (clause: LogFilterClause): string => {
    if (!clause.value) return "Select value";

    switch (clause.type) {
      case "functionType": {
        const type = FUNCTION_TYPES.find((t) => t.value === clause.value);
        return type?.label || clause.value;
      }
      case "status": {
        const status = STATUSES.find((s) => s.value === clause.value);
        return status?.label || clause.value;
      }
      case "logLevel": {
        const level = LOG_LEVELS.find((l) => l.value === clause.value);
        return level?.label || clause.value;
      }
      default:
        return clause.value;
    }
  };

  const getAvailableValues = (type: FilterType) => {
    switch (type) {
      case "functionType":
        return FUNCTION_TYPES;
      case "status":
        return STATUSES;
      case "logLevel":
        return LOG_LEVELS;
      default:
        return [];
    }
  };

  // Get function type badge text (Q/M/A)
  const getFunctionTypeBadge = (type: string): string => {
    const t = type.toLowerCase();
    if (t === "query") return "Q";
    if (t === "mutation") return "M";
    if (t === "action") return "A";
    return type.charAt(0).toUpperCase();
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    if (status === "success") return theme.colors.success || "#22c55e";
    if (status === "error" || status === "failure")
      return theme.colors.error || "#ef4444";
    return theme.colors.textSecondary;
  };

  // Get log level color
  const getLogLevelColor = (level: string): { bg: string; text: string } => {
    switch (level.toUpperCase()) {
      case "DEBUG":
        return {
          bg: theme.dark
            ? "rgba(59, 130, 246, 0.2)"
            : "rgba(59, 130, 246, 0.1)",
          text: theme.dark ? "#93c5fd" : "#3b82f6",
        };
      case "INFO":
        return {
          bg: theme.dark
            ? "rgba(156, 163, 175, 0.2)"
            : "rgba(156, 163, 175, 0.1)",
          text: theme.dark ? "#d1d5db" : "#6b7280",
        };
      case "WARN":
        return {
          bg: theme.dark
            ? "rgba(251, 191, 36, 0.2)"
            : "rgba(251, 191, 36, 0.1)",
          text: theme.dark ? "#fcd34d" : "#f59e0b",
        };
      case "ERROR":
        return {
          bg: theme.dark ? "rgba(239, 68, 68, 0.2)" : "rgba(239, 68, 68, 0.1)",
          text: theme.dark ? "#fca5a5" : "#ef4444",
        };
      default:
        return {
          bg: theme.colors.border + "80",
          text: theme.colors.text,
        };
    }
  };

  // BaseFilterSheet configuration
  const config: BaseFilterSheetConfig<LogFilterClause> = useMemo(
    () => ({
      overviewTitle: "Filters",
      selectTitle: "Select Filter Type",
      emptyTitle: "No filtering set up yet.",
      emptySubtitle: "Choose a filter type to get started",

      renderClauseRow: (
        clause,
        onEdit,
        onRemove,
        onUpdateClause,
        selectedClauseId,
        setSelectedClauseId,
      ) => (
        <View style={filterSheetStyles.clauseRow}>
          {/* Filter type pill */}
          <TouchableOpacity
            style={[
              filterSheetStyles.pillButton,
              { backgroundColor: theme.colors.surface },
            ]}
            activeOpacity={0.7}
            onPress={onEdit}
          >
            <Icon name="filter" size={14} color={theme.colors.textSecondary} />
            <Text
              style={[filterSheetStyles.pillText, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {getFilterTypeLabel(clause.type)}
            </Text>
            <Icon
              name="chevron-down"
              size={14}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>

          {/* "is" label */}
          <Text style={[styles.isLabel, { color: theme.colors.textSecondary }]}>
            is
          </Text>

          {/* Value selector pill */}
          <TouchableOpacity
            style={[
              filterSheetStyles.pillButton,
              { backgroundColor: theme.colors.surface },
            ]}
            activeOpacity={0.7}
            onPress={() => setSelectedClauseId(clause.id)}
          >
            <Text
              style={[filterSheetStyles.pillText, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {getFilterValueLabel(clause)}
            </Text>
            <Icon
              name="chevron-down"
              size={14}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>

          {/* Remove button */}
          <TouchableOpacity
            style={filterSheetStyles.moreButton}
            onPress={onRemove}
            activeOpacity={0.7}
          >
            <Icon name="delete" size={18} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      ),

      renderSelectMode: (onSelect, editingClauseId, editingPart) => {
        // If editing value, show available values for the selected filter type
        if (editingPart === "value" && editingClauseId) {
          const editingClause = filters.clauses.find(
            (c) => c.id === editingClauseId,
          );
          const availableValues = editingClause
            ? getAvailableValues(editingClause.type)
            : [];

          return (
            <View style={filterSheetStyles.body}>
              <View style={filterSheetStyles.fieldList}>
                {availableValues.map((item) => {
                  const isSelected = editingClause?.value === item.value;

                  // Render different indicators based on filter type
                  const renderIndicator = () => {
                    if (editingClause?.type === "functionType") {
                      // Function type badge (Q/M/A)
                      return (
                        <View
                          style={[
                            styles.functionTypeBadge,
                            {
                              backgroundColor: isSelected
                                ? theme.colors.error + "20"
                                : theme.colors.border + "80",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.functionTypeBadgeText,
                              {
                                color: isSelected
                                  ? theme.colors.error
                                  : theme.colors.text,
                              },
                            ]}
                          >
                            {getFunctionTypeBadge(item.value)}
                          </Text>
                        </View>
                      );
                    } else if (editingClause?.type === "status") {
                      // Status colored dot
                      return (
                        <View
                          style={[
                            styles.statusDot,
                            { backgroundColor: getStatusColor(item.value) },
                          ]}
                        />
                      );
                    } else if (editingClause?.type === "logLevel") {
                      // Log level colored badge
                      const levelColor = getLogLevelColor(item.value);
                      return (
                        <View
                          style={[
                            styles.logLevelBadge,
                            { backgroundColor: levelColor.bg },
                          ]}
                        >
                          <Text
                            style={[
                              styles.logLevelBadgeText,
                              { color: levelColor.text },
                            ]}
                          >
                            {item.value}
                          </Text>
                        </View>
                      );
                    }
                    // Default icon
                    return (
                      <View style={styles.fieldIcon}>
                        <Icon
                          name="filter"
                          size={18}
                          color={theme.colors.textSecondary}
                        />
                      </View>
                    );
                  };

                  return (
                    <TouchableOpacity
                      key={item.value}
                      style={filterSheetStyles.fieldRow}
                      onPress={() => {
                        onSelect({ value: item.value });
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.leftContent}>
                        {renderIndicator()}
                        <Text
                          style={[
                            filterSheetStyles.fieldName,
                            {
                              color: isSelected
                                ? theme.colors.primary
                                : theme.colors.text,
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {item.label}
                        </Text>
                      </View>
                      {isSelected && (
                        <Icon
                          name="checkmark-circle"
                          size={20}
                          color={theme.colors.primary}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        }

        // Otherwise, show filter types (for new clause or editing filter type)
        const filterTypes = [
          { type: "functionType" as FilterType, label: "Function Type" },
          { type: "status" as FilterType, label: "Status" },
          { type: "logLevel" as FilterType, label: "Log Level" },
        ];

        return (
          <View style={filterSheetStyles.body}>
            <View style={filterSheetStyles.fieldList}>
              {filterTypes.map((filter) => (
                <TouchableOpacity
                  key={filter.type}
                  style={filterSheetStyles.fieldRow}
                  onPress={() =>
                    onSelect({ type: filter.type, value: "", enabled: true })
                  }
                  activeOpacity={0.6}
                >
                  <View style={styles.leftContent}>
                    <View style={styles.fieldIcon}>
                      <Icon
                        name="filter"
                        size={18}
                        color={theme.colors.textSecondary}
                      />
                    </View>
                    <Text
                      style={[
                        filterSheetStyles.fieldName,
                        { color: theme.colors.text },
                      ]}
                      numberOfLines={1}
                    >
                      {filter.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      },
    }),
    [theme, filters.clauses],
  );

  return {
    config,
  };
}

const styles = StyleSheet.create({
  isLabel: {
    fontSize: 14,
    fontWeight: "400",
  },
  leftContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  fieldIcon: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  functionTypeBadge: {
    width: 20,
    height: 20,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  functionTypeBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  logLevelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  logLevelBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
});
