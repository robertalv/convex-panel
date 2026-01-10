/**
 * BaseSortSheet - Bottom sheet component for sorting
 * Matches BaseFilterSheet structure and behavior
 */

import React, { useCallback, useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useTheme } from "../../contexts/ThemeContext";
import { Icon } from "../ui/Icon";
import type { SortConfig, SortDirection, TableSchema } from "../../features/data/types";
import { filterSheetStyles } from "./filterSheetStyles";
import { getFieldTypeIcon, getFieldTypeColor } from "../../features/data/utils/fieldTypeIcons";
import { FilterPillButton } from "./BaseFilterSheet";

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
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Dynamic snap points based on sort config (same calculation as BaseFilterSheet)
  const snapPoints = useMemo(() => {
    const baseHeight = 25;
    const heightPerSort = 8;
    const sortCount = sortConfig ? 1 : 0;
    const dynamicHeight = Math.min(
      baseHeight + sortCount * heightPerSort,
      70,
    );
    return [`${dynamicHeight}%`, "70%"];
  }, [sortConfig]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    [],
  );

  const handleSheetChange = useCallback(
    (index: number) => {
      setIsSheetOpen(index !== -1);
      if (index === -1) {
        setMode("overview");
        onSheetClose?.();
      } else if (index === 0 && mode === "select") {
        setMode("overview");
      }
    },
    [mode, onSheetClose],
  );

  // Adjust sheet height when sort config changes (only if sheet is already open)
  useEffect(() => {
    if (isSheetOpen && mode === "overview") {
      sheetRef.current?.snapToIndex(0);
    }
  }, [sortConfig, mode, isSheetOpen, sheetRef]);

  const handleAddSort = useCallback(() => {
    setMode("select");
    sheetRef.current?.snapToIndex(1);
  }, [sheetRef]);

  const handleFieldSelect = useCallback((field: string) => {
    const newSortConfig: SortConfig = {
      field,
      direction: sortConfig?.field === field ? sortConfig.direction : "desc",
    };
    onChangeSortConfig(newSortConfig);
    setMode("overview");
  }, [sortConfig, onChangeSortConfig]);

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
    sheetRef.current?.snapToIndex(1);
  }, [sheetRef]);

  const handleRemoveSort = useCallback(() => {
    onChangeSortConfig(null);
  }, [onChangeSortConfig]);

  const handleDone = useCallback(() => {
    sheetRef.current?.close();
  }, [sheetRef]);

  const handleClearSort = useCallback(() => {
    onChangeSortConfig(null);
  }, [onChangeSortConfig]);

  const renderOverview = () => {
    const hasSort = sortConfig !== null;

    return (
      <View style={filterSheetStyles.body}>
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
                    const fieldType = config.getFieldType?.(sortConfig.field) ?? null;
                    return config.availableFields.find(f => f.field === sortConfig.field)?.icon || getFieldTypeIcon(fieldType);
                  })()}
                  label={config.availableFields.find(f => f.field === sortConfig.field)?.label || sortConfig.field}
                  onPress={handleEditSort}
                  theme={theme}
                />
                <FilterPillButton
                  icon={sortConfig.direction === "asc" ? "sortAsc" : "sortDesc"}
                  label={sortConfig.direction === "asc" ? "Ascending" : "Descending"}
                  onPress={handleToggleDirection}
                  theme={theme}
                />
                <TouchableOpacity
                  style={filterSheetStyles.moreButton}
                  onPress={handleRemoveSort}
                  activeOpacity={0.7}
                >
                  <Icon
                    name="close"
                    size={18}
                    color={theme.colors.textSecondary}
                  />
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
                  <View
                    style={styles.fieldIcon}
                  >
                    <Icon name={iconName} size={18} color={theme.colors.textSecondary} />
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

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      onChange={handleSheetChange}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{
        backgroundColor: theme.colors.surface,
      }}
      handleIndicatorStyle={{
        backgroundColor: theme.colors.border,
      }}
    >
      <BottomSheetView style={filterSheetStyles.container}>
        {/* Header */}
        <View style={filterSheetStyles.header}>
          <View style={filterSheetStyles.headerSide}>
            {mode === "select" ? (
              <TouchableOpacity
                onPress={() => {
                  setMode("overview");
                  sheetRef.current?.snapToIndex(0);
                }}
                activeOpacity={0.7}
              >
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
            ) : null}
          </View>

          <Text
            style={[
              filterSheetStyles.headerTitle,
              { color: theme.colors.text },
            ]}
          >
            {title}
          </Text>

          <TouchableOpacity
            style={filterSheetStyles.headerSide}
            onPress={handleDone}
            activeOpacity={0.7}
          >
            <Text
              style={[
                filterSheetStyles.headerDone,
                { color: theme.colors.primary },
              ]}
            >
              {mode === "overview" ? "Done" : "Apply"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {mode === "overview" ? renderOverview() : renderSelectMode()}
      </BottomSheetView>
    </BottomSheet>
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
