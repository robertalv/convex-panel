/**
 * Table Selector Bottom Sheet
 *
 * Bottom sheet for selecting a Convex table in the mobile data browser.
 * Mirrors the behavior of the desktop dashboard context selector but
 * scoped to tables only.
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from "react-native";
import type BottomSheet from "@gorhom/bottom-sheet";
import { BottomSheetFlatList, BottomSheetView } from "@gorhom/bottom-sheet";
import type { TableItem } from "./TableList";
import { useTheme } from "../../../contexts/ThemeContext";
import { Icon } from "../../../components/ui/Icon";
import { BaseSheet } from "../../../components/sheets/BaseSheet";

export interface TableSelectorSheetProps {
  sheetRef: React.RefObject<BottomSheet>;
  tables: TableItem[];
  selectedTable: string | null;
  isLoading?: boolean;
  onSelectTable: (tableName: string) => void;
  onClose?: () => void;
}

export function TableSelectorSheet({
  sheetRef,
  tables,
  selectedTable,
  isLoading = false,
  onSelectTable,
  onClose,
}: TableSelectorSheetProps) {
  const { theme } = useTheme();

  const handleSelectTableInternal = (tableName: string) => {
    console.log("[TableSelectorSheet] Table selected:", tableName);
    onSelectTable(tableName);
    sheetRef.current?.close();
  };

  // Custom header right showing table count
  const headerRight = (
    <Text style={[styles.count, { color: theme.colors.textSecondary }]}>
      {tables.length}
    </Text>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
        No tables found
      </Text>
    </View>
  );

  return (
    <BaseSheet
      sheetRef={sheetRef}
      onClose={onClose}
      size="list"
      itemCount={tables.length}
      isLoading={isLoading}
      title="Select Table"
      headerRight={headerRight}
      rawContent
    >
      {isLoading ? (
        <BottomSheetView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        </BottomSheetView>
      ) : (
        <BottomSheetFlatList
          data={tables}
          keyExtractor={(item: TableItem) => item.name}
          ListEmptyComponent={renderEmpty}
          renderItem={({ item }: { item: TableItem }) => {
            const isSelected = item.name === selectedTable;
            return (
              <TouchableOpacity
                style={styles.item}
                onPress={() => handleSelectTableInternal(item.name)}
                activeOpacity={0.6}
              >
                <View style={styles.tableIcon}>
                  <Icon
                    name="table"
                    size={18}
                    color={theme.colors.textSecondary}
                  />
                </View>
                <View style={styles.itemContent}>
                  <Text
                    style={[styles.itemTitle, { color: theme.colors.text }]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  {item.schema?.indexes && item.schema.indexes.length > 0 && (
                    <Text
                      style={[
                        styles.itemMeta,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {item.schema.indexes.length}{" "}
                      {item.schema.indexes.length === 1 ? "index" : "indexes"}
                    </Text>
                  )}
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
          }}
          contentContainerStyle={styles.listContent}
          style={{ backgroundColor: theme.colors.background }}
        />
      )}
    </BaseSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  count: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
  },
  listContent: {
    paddingVertical: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 4,
  },
  tableIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "400",
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
  },
  itemMeta: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
  },
});
