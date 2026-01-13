/**
 * View Mode Selector Bottom Sheet
 *
 * Bottom sheet for selecting List or Table view mode
 */

import React, { useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import type BottomSheet from "@gorhom/bottom-sheet";
import { useTheme } from "../../../contexts/ThemeContext";
import type { DataViewMode } from "../types";
import { Icon } from "../../../components/ui/Icon";
import { BaseSheet } from "../../../components/sheets/BaseSheet";

export interface ViewModeSheetProps {
  sheetRef: React.RefObject<BottomSheet>;
  currentViewMode: DataViewMode;
  onSelectViewMode: (mode: DataViewMode) => void;
}

type ViewModeOption = {
  mode: DataViewMode;
  icon: string;
  title: string;
  description?: string;
};

const VIEW_MODE_OPTIONS: ViewModeOption[] = [
  {
    mode: "list",
    icon: "list",
    title: "List",
  },
  {
    mode: "table",
    icon: "table",
    title: "Table",
  },
];

export function ViewModeSheet({
  sheetRef,
  currentViewMode,
  onSelectViewMode,
}: ViewModeSheetProps) {
  const { theme } = useTheme();

  const handleSelectMode = useCallback(
    (mode: DataViewMode) => {
      onSelectViewMode(mode);
      sheetRef.current?.close();
    },
    [onSelectViewMode, sheetRef],
  );

  const renderOption = useCallback(
    (option: ViewModeOption) => {
      const isSelected = currentViewMode === option.mode;
      return (
        <TouchableOpacity
          key={option.mode}
          style={styles.item}
          onPress={() => handleSelectMode(option.mode)}
          activeOpacity={0.6}
        >
          <View style={styles.leftContent}>
            <View
              style={[
                styles.viewIcon,
                {
                  backgroundColor: theme.dark
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.05)",
                },
              ]}
            >
              <Icon
                name={option.icon}
                size={18}
                color={theme.colors.textSecondary}
              />
            </View>
            <View style={styles.itemContent}>
              <Text
                style={[
                  styles.itemTitle,
                  {
                    color: isSelected
                      ? theme.colors.primary
                      : theme.colors.text,
                  },
                ]}
              >
                {option.title}
              </Text>
              {option.description && (
                <Text
                  style={[
                    styles.itemMeta,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {option.description}
                </Text>
              )}
            </View>
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
    },
    [currentViewMode, theme, handleSelectMode],
  );

  return (
    <BaseSheet sheetRef={sheetRef} size="small" title="Select View">
      <View
        style={[styles.content, { backgroundColor: theme.colors.background }]}
      >
        {VIEW_MODE_OPTIONS.map(renderOption)}
      </View>
    </BaseSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingVertical: 8,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  leftContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  viewIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "400",
  },
  itemMeta: {
    fontSize: 12,
    marginTop: 2,
  },
});
