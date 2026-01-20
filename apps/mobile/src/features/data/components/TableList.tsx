/**
 * Table list component - Shows list of tables in a drawer/sidebar
 */

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useTheme } from "../../../contexts/ThemeContext";

export interface TableItem {
  name: string;
  schema: any;
}

export interface TableListProps {
  tables: TableItem[];
  selectedTable: string | null;
  onSelectTable: (tableName: string) => void;
  isLoading?: boolean;
}

export function TableList({
  tables,
  selectedTable,
  onSelectTable,
  isLoading,
}: TableListProps) {
  const { theme } = useTheme();

  if (isLoading) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text
            style={[styles.loadingText, { color: theme.colors.textSecondary }]}
          >
            Loading tables...
          </Text>
        </View>
      </View>
    );
  }

  if (tables.length === 0) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.emptyContainer}>
          <Text
            style={[styles.emptyText, { color: theme.colors.textSecondary }]}
          >
            No tables found
          </Text>
          <Text
            style={[styles.emptySubtext, { color: theme.colors.textTertiary }]}
          >
            Create tables in your Convex schema
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Tables
        </Text>
        <Text
          style={[styles.headerCount, { color: theme.colors.textSecondary }]}
        >
          {tables.length}
        </Text>
      </View>

      <FlatList
        data={tables}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <TableListItem
            table={item}
            isSelected={item.name === selectedTable}
            onPress={() => onSelectTable(item.name)}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

interface TableListItemProps {
  table: TableItem;
  isSelected: boolean;
  onPress: () => void;
}

function TableListItem({ table, isSelected, onPress }: TableListItemProps) {
  const { theme } = useTheme();

  // Extract indexes from schema if available
  const indexes = table.schema?.indexes || [];

  return (
    <TouchableOpacity
      style={[
        styles.item,
        { backgroundColor: theme.colors.surface },
        isSelected && { backgroundColor: theme.colors.primary + "20" },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.itemContent}>
        <Text
          style={[
            styles.itemName,
            { color: theme.colors.text },
            isSelected && { color: theme.colors.primary, fontWeight: "600" },
          ]}
          numberOfLines={1}
        >
          {table.name}
        </Text>

        {indexes.length > 0 && (
          <Text style={[styles.itemMeta, { color: theme.colors.textTertiary }]}>
            {indexes.length} {indexes.length === 1 ? "index" : "indexes"}
          </Text>
        )}
      </View>

      {isSelected && (
        <View
          style={[
            styles.selectedIndicator,
            { backgroundColor: theme.colors.primary },
          ]}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  headerCount: {
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
  item: {
    marginHorizontal: 8,
    marginVertical: 2,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
    marginBottom: 2,
  },
  itemMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  selectedIndicator: {
    width: 3,
    height: 24,
    borderRadius: 2,
    marginLeft: 8,
  },
});
