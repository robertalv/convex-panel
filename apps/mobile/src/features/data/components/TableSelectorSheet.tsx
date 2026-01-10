/**
 * Table Selector Bottom Sheet
 *
 * Bottom sheet for selecting a Convex table in the mobile data browser.
 * Mirrors the behavior of the desktop dashboard context selector but
 * scoped to tables only.
 */

import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  FlatList,
} from "react-native";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import type { TableItem } from "./TableList";
import { useTheme } from "../../../contexts/ThemeContext";
import { Icon } from "../../../components/ui/Icon";

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

  const snapPoints = useMemo(() => ["50%", "80%"], []);

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

  const handleSheetChanges = useCallback(
    (index: number) => {
      console.log("[TableSelectorSheet] Sheet index changed:", index);
      if (index === -1) {
        onClose?.();
      }
    },
    [onClose],
  );

  const handleSelectTableInternal = (tableName: string) => {
    console.log("[TableSelectorSheet] Table selected:", tableName);
    onSelectTable(tableName);
    sheetRef.current?.close();
  };

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: theme.colors.background }}
      handleIndicatorStyle={{ backgroundColor: theme.colors.border }}
    >
      <BottomSheetView style={styles.container}>
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              borderBottomColor: theme.colors.border,
              borderBottomWidth: 0,
              paddingBottom: 4,
            },
          ]}
        >
          <View style={styles.headerLeft} />
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Select Table
          </Text>
          <View style={styles.headerRight}>
            <Text style={[styles.count, { color: theme.colors.textSecondary }]}>
              {tables.length}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View
          style={[styles.content, { backgroundColor: theme.colors.background }]}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : tables.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text
                style={[styles.emptyText, { color: theme.colors.textSecondary }]}
              >
                No tables found
              </Text>
            </View>
          ) : (
            <FlatList
              data={tables}
              keyExtractor={(item: TableItem) => item.name}
              renderItem={({ item }: { item: TableItem }) => {
                const isSelected = item.name === selectedTable;
                return (
                  <TouchableOpacity
                    style={styles.item}
                    onPress={() => handleSelectTableInternal(item.name)}
                    activeOpacity={0.6}
                  >
                    <View
                      style={styles.tableIcon}
                    >
                      <Icon
                        name="table"
                        size={18}
                        color={theme.colors.textSecondary}
                      />
                    </View>
                    <View style={styles.itemContent}>
                      <Text
                        style={[
                          styles.itemTitle,
                          { color: theme.colors.text },
                        ]}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                      {item.schema?.indexes &&
                        item.schema.indexes.length > 0 && (
                          <Text
                            style={[
                              styles.itemMeta,
                              { color: theme.colors.textSecondary },
                            ]}
                          >
                            {item.schema.indexes.length}{" "}
                            {item.schema.indexes.length === 1
                              ? "index"
                              : "indexes"}
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
            />
          )}
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerLeft: {
    width: 40,
    alignItems: "flex-start",
  },
  headerRight: {
    width: 40,
    alignItems: "flex-end",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  count: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
  },
  content: {
    flex: 1,
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
