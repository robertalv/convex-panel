/**
 * BaseSortSheet - Bottom sheet component for sorting
 * Matches BaseFilterSheet structure and behavior
 *
 * Uses BaseSheet as the single source of truth for bottom sheet behavior.
 */

import React, { useCallback, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import type BottomSheet from "@gorhom/bottom-sheet";
import { useTheme } from "../../contexts/ThemeContext";
import { Icon } from "../ui/Icon";
import type {
  SortConfig,
  SortDirection,
  TableSchema,
} from "../../features/data/types";
import { filterSheetStyles } from "./filterSheetStyles";
import {
  getFieldTypeIcon,
  getFieldTypeColor,
} from "../../features/data/utils/fieldTypeIcons";
import { FilterPillButton } from "./BaseFilterSheet";
import { BaseSheet } from "./BaseSheet";

export interface BaseSortSheetConfig {
  // Title configuration
  overviewTitle: string;
  selectTitle: string;
  emptyTitle: string;
  emptySubtitle: string;

  // Field options
  availableFields: Array<{
    field: string;
    label: string;
    icon?: string;
  }>;

  // Helper to get field type
  getFieldType?: (fieldName: string) => string | null;
}

export interface BaseSortSheetProps {
  sheetRef: React.RefObject<BottomSheet>;
  sortConfig: SortConfig | null;
  onChangeSortConfig: (sortConfig: SortConfig | null) => void;
  config: BaseSortSheetConfig;
  schema?: TableSchema;
  tableName?: string | null;
  onSheetClose?: () => void;
}

type SheetMode = "overview" | "select";

export function BaseSortSheet({
  sheetRef,
  sortConfig,
  onChangeSortConfig,
  config,
  schema,
  tableName,
  onSheetClose,
}: BaseSortSheetProps) {
  const { theme } = useTheme();
  const [mode, setMode] = useState<SheetMode>("overview");

  // Maximum height for the sheet content
  const MAX_SHEET_HEIGHT = 500;

  const handleSheetChange = useCallback(
    (index: number) => {
      if (index === -1) {
        setMode("overview");
        onSheetClose?.();
      }
    },
    [onSheetClose],
  );

  // With dynamic sizing, the sheet automatically resizes when content changes

  const handleAddSort = useCallback(() => {
    setMode("select");
    // With dynamic sizing, the sheet will automatically resize when content changes
  }, []);

  const handleFieldSelect = useCallback(
    (field: string) => {
      const newSortConfig: SortConfig = {
        field,
        direction: sortConfig?.field === field ? sortConfig.direction : "desc",
      };
      onChangeSortConfig(newSortConfig);
      setMode("overview");
    },
    [sortConfig, onChangeSortConfig],
  );

  const handleToggleDirection = useCallback(() => {
    if (sortConfig) {
      onChangeSortConfig({
        ...sortConfig,
        direction: sortConfig.direction === "asc" ? "desc" : "asc",
      });
    }
  }, [sortConfig, onChangeSortConfig]);

  const handleEditSort = useCallback(() => {
    setMode("select");
    // With dynamic sizing, the sheet will automatically resize when content changes
  }, []);

  const handleRemoveSort = useCallback(() => {
    onChangeSortConfig(null);
  }, [onChangeSortConfig]);

  const handleDone = useCallback(() => {
    sheetRef.current?.close();
  }, [sheetRef]);

  const handleClearSort = useCallback(() => {
    onChangeSortConfig(null);
  }, [onChangeSortConfig]);

  const handleBack = useCallback(() => {
    setMode("overview");
    // With dynamic sizing, the sheet will automatically resize when content changes
  }, []);

  const renderOverview = () => {
    const hasSort = sortConfig !== null;

    return (
      <View style={{ padding: 16 }}>
        {!hasSort && (
          <>
            <View style={filterSheetStyles.emptyState}>
              <Text
                style={[
                  filterSheetStyles.emptyTitle,
                  { color: theme.colors.text },
                ]}
              >
                {config.emptyTitle}
              </Text>
              <Text
                style={[
                  filterSheetStyles.emptySubtitle,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {config.emptySubtitle}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                filterSheetStyles.addButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={handleAddSort}
              activeOpacity={0.8}
            >
              <Icon name="sort" size={18} color="#FFFFFF" />
              <Text style={filterSheetStyles.addButtonText}>Add sort</Text>
            </TouchableOpacity>
          </>
        )}

        {hasSort && (
          <>
            <View style={filterSheetStyles.clausesContainer}>
              {/* Order by label */}
              <View style={filterSheetStyles.whereLabel}>
                <Text
                  style={[
                    filterSheetStyles.whereLabelText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Order by
                </Text>
              </View>

              {/* Sort clause row */}
              <View style={filterSheetStyles.clauseRow}>
                <FilterPillButton
                  icon={(() => {
                    const fieldType =
                      config.getFieldType?.(sortConfig.field) ?? null;
                    return (
                      config.availableFields.find(
                        (f) => f.field === sortConfig.field,
                      )?.icon || getFieldTypeIcon(fieldType)
                    );
                  })()}
                  label={
                    config.availableFields.find(
                      (f) => f.field === sortConfig.field,
                    )?.label || sortConfig.field
                  }
                  onPress={handleEditSort}
                  theme={theme}
                />
                <FilterPillButton
                  icon={sortConfig.direction === "asc" ? "sortAsc" : "sortDesc"}
                  label={
                    sortConfig.direction === "asc" ? "Ascending" : "Descending"
                  }
                  onPress={handleToggleDirection}
                  theme={theme}
                />
                <View style={{ flex: 1 }} />
                <TouchableOpacity
                  style={filterSheetStyles.moreButton}
                  onPress={handleRemoveSort}
                  activeOpacity={0.7}
                >
                  <Icon name="delete" size={18} color={theme.colors.error} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={filterSheetStyles.actionButtons}>
              <TouchableOpacity
                style={[
                  filterSheetStyles.addButton,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={handleAddSort}
                activeOpacity={0.8}
              >
                <Icon name="sort" size={18} color="#FFFFFF" />
                <Text style={filterSheetStyles.addButtonText}>Add sort</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    );
  };

  const renderSelectMode = () => {
    return (
      <View style={filterSheetStyles.body}>
        <View style={filterSheetStyles.fieldList}>
          {config.availableFields.map((fieldOption) => {
            const isSelected = sortConfig?.field === fieldOption.field;
            const fieldType = config.getFieldType?.(fieldOption.field) ?? null;
            const iconName = fieldOption.icon || getFieldTypeIcon(fieldType);
            const iconColor = getFieldTypeColor(fieldType, theme);

            return (
              <TouchableOpacity
                key={fieldOption.field}
                style={filterSheetStyles.fieldRow}
                onPress={() => handleFieldSelect(fieldOption.field)}
                activeOpacity={0.6}
              >
                <View style={styles.leftContent}>
                  <View style={styles.fieldIcon}>
                    <Icon
                      name={iconName}
                      size={18}
                      color={theme.colors.textSecondary}
                    />
                  </View>
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
                    {fieldOption.label}
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
  };

  const title = mode === "overview" ? config.overviewTitle : config.selectTitle;

  // Header left: Back button in select mode, Clear in overview mode with sort
  const headerLeft =
    mode === "select" ? (
      <TouchableOpacity onPress={handleBack} activeOpacity={0.7}>
        <Icon
          name="chevron-back"
          size={20}
          color={theme.colors.textSecondary}
        />
      </TouchableOpacity>
    ) : sortConfig ? (
      <TouchableOpacity onPress={handleClearSort} activeOpacity={0.7}>
        <Text
          style={[
            filterSheetStyles.headerClear,
            { color: theme.colors.textSecondary },
          ]}
        >
          Clear
        </Text>
      </TouchableOpacity>
    ) : undefined;

  // Header right: Done/Apply button
  const headerRight = (
    <TouchableOpacity onPress={handleDone} activeOpacity={0.7}>
      <Text
        style={[filterSheetStyles.headerDone, { color: theme.colors.primary }]}
      >
        {mode === "overview" ? "Done" : "Apply"}
      </Text>
    </TouchableOpacity>
  );

  return (
    <BaseSheet
      sheetRef={sheetRef}
      size="dynamic"
      maxDynamicContentSize={MAX_SHEET_HEIGHT}
      scrollable
      title={title}
      headerLeft={headerLeft}
      headerRight={headerRight}
      onChange={handleSheetChange}
    >
      {/* Content */}
      {mode === "overview" ? renderOverview() : renderSelectMode()}
    </BaseSheet>
  );
}

const styles = {
  leftContent: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    flex: 1,
  },
  fieldIcon: {
    width: 28,
    height: 28,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
};
