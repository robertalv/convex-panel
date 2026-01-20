/**
 * Table view component - grid layout for documents (mobile)
 *
 * Lightweight adaptation of the desktop TableView for React Native:
 * - Horizontal scroll for many columns
 * - Vertical list for rows with infinite scroll
 * - Simple header row with field names
 */

import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from "react-native";
import { useTheme } from "../../../../contexts/ThemeContext";
import type { TableDocument, TableSchema } from "../../types";
import {
  formatValue,
  getValueColor,
  formatTimestamp,
  TIMESTAMP_COLOR,
} from "../../utils/formatters";

// Build column metadata from schema (matches desktop)
function buildColumnMeta(
  schema?: TableSchema,
): Record<
  string,
  { typeLabel: string; optional: boolean; linkTable?: string }
> {
  const meta: Record<
    string,
    { typeLabel: string; optional: boolean; linkTable?: string }
  > = {
    _id: { typeLabel: "id", optional: false },
    _creationTime: { typeLabel: "timestamp", optional: false },
  };

  schema?.fields?.forEach((field) => {
    let typeLabel = field.shape?.type ?? "string";
    let linkTable: string | undefined;

    if (field.shape?.type === "Id" && field.shape.tableName) {
      typeLabel = `id<${field.shape.tableName}>`;
      linkTable = field.shape.tableName;
    }

    meta[field.fieldName] = {
      typeLabel,
      optional: field.optional ?? false,
      linkTable,
    };
  });

  return meta;
}

export interface MobileTableViewProps {
  documents: TableDocument[];
  schema?: TableSchema;
  onDocumentPress?: (document: TableDocument, index: number) => void;
  onCellPress?: (
    document: TableDocument,
    fieldName: string,
    value: any,
  ) => void;
  selectedCell?: { documentId: string; fieldName: string } | null;
  onRefresh?: () => void;
  onLoadMore?: () => void;
  isRefreshing?: boolean;
  isLoadingMore?: boolean;
  hasMore?: boolean;
}

const COLUMN_WIDTH = 180;

export function TableView({
  documents,
  schema,
  onDocumentPress,
  onCellPress,
  selectedCell,
  onRefresh,
  onLoadMore,
  isRefreshing = false,
  isLoadingMore = false,
  hasMore = false,
}: MobileTableViewProps) {
  const { theme } = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  // Build ordered list of fields similar to desktop:
  // _id, schema fields (excluding system), dynamic doc fields, _creationTime
  const columns = useMemo(() => {
    const schemaFields = schema?.fields?.map((f) => f.fieldName) ?? [];
    const docFields = new Set<string>();

    documents.forEach((doc) => {
      Object.keys(doc).forEach((key) => {
        if (key !== "_id" && key !== "_creationTime") {
          docFields.add(key);
        }
      });
    });

    const ordered: string[] = ["_id"];
    schemaFields.forEach((f) => {
      if (f !== "_id" && f !== "_creationTime" && !ordered.includes(f)) {
        ordered.push(f);
      }
    });
    docFields.forEach((f) => {
      if (!ordered.includes(f)) ordered.push(f);
    });
    ordered.push("_creationTime");

    return ordered;
  }, [documents, schema]);

  // Calculate column width - either fill screen or use fixed width
  const columnWidth = useMemo(() => {
    const MIN_COLUMN_WIDTH = 180;
    const minTableWidth = columns.length * MIN_COLUMN_WIDTH;

    // If the table would be narrower than screen, expand columns to fill
    if (minTableWidth < screenWidth) {
      return screenWidth / columns.length;
    }

    return MIN_COLUMN_WIDTH;
  }, [columns.length, screenWidth]);

  // Total table width based on calculated column width
  const tableWidth = useMemo(
    () => Math.max(columns.length * columnWidth, screenWidth),
    [columns.length, columnWidth, screenWidth],
  );

  const columnMeta = useMemo(() => buildColumnMeta(schema), [schema]);

  const renderEmpty = () => {
    if (isRefreshing) return null;

    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          No documents found
        </Text>
        <Text
          style={[styles.emptySubtext, { color: theme.colors.textTertiary }]}
        >
          {onRefresh ? "Pull to refresh" : "Try adjusting your filters"}
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;

    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text
          style={[styles.footerText, { color: theme.colors.textSecondary }]}
        >
          Loading more...
        </Text>
      </View>
    );
  };

  const handleEndReached = () => {
    if (hasMore && !isLoadingMore && onLoadMore) {
      onLoadMore();
    }
  };

  const renderHeaderRow = () => {
    return (
      <View
        style={[
          styles.headerRow,
          {
            borderBottomColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
            width: tableWidth,
          },
        ]}
      >
        {columns.map((column) => {
          const meta = columnMeta[column];
          return (
            <View
              key={column}
              style={[
                styles.headerCell,
                {
                  width: columnWidth,
                  borderRightColor: theme.colors.border,
                },
              ]}
            >
              <View style={styles.headerContent}>
                <Text
                  style={[styles.headerText, { color: theme.colors.text }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {column}
                </Text>
                {meta && (
                  <>
                    <Text style={{ marginHorizontal: 3 }}> </Text>
                    <Text
                      style={[
                        styles.headerType,
                        { color: theme.colors.textSecondary },
                      ]}
                      numberOfLines={1}
                    >
                      {meta.typeLabel}
                      {meta.optional && "?"}
                    </Text>
                  </>
                )}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderRow = ({
    item,
    index,
  }: {
    item: TableDocument;
    index: number;
  }) => {
    return (
      <View
        style={[
          styles.row,
          {
            borderBottomColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
            width: tableWidth,
          },
        ]}
      >
        {columns.map((column) => {
          const value = (item as any)[column];
          const meta = columnMeta[column];
          const isIdColumn = column === "_id" || meta?.linkTable !== undefined;
          const isDateColumn =
            column === "_creationTime" || meta?.typeLabel === "timestamp";
          const isUnset = value === null || value === undefined;

          // Determine display value and color
          let displayValue: string;
          let cellColor: string;

          if (isUnset) {
            displayValue = value === null ? "null" : "No field";
            cellColor = theme.colors.textTertiary;
          } else if (isDateColumn && typeof value === "number") {
            displayValue = formatTimestamp(value);
            cellColor = TIMESTAMP_COLOR;
          } else {
            displayValue = formatValue(value, 50);
            const valueColor = getValueColor(value, isIdColumn);
            // Use theme color for strings/objects if valueColor is white
            cellColor =
              valueColor === "#FFFFFF"
                ? theme.colors.text
                : valueColor === "#8B8B8B"
                  ? theme.colors.textTertiary
                  : valueColor;
          }

          // Check if this cell is selected
          const isSelected =
            selectedCell &&
            selectedCell.documentId === item._id &&
            selectedCell.fieldName === column;

          // System fields are not editable
          const isSystemField = column === "_id" || column === "_creationTime";

          return (
            <TouchableOpacity
              key={column}
              style={[
                styles.cell,
                {
                  width: columnWidth,
                  borderRightWidth: 1,
                  borderRightColor: isSelected
                    ? "rgba(59, 130, 246, 1)" // blue-500 when selected
                    : theme.colors.border,
                  backgroundColor: isSelected
                    ? "rgba(59, 130, 246, 0.2)" // blue-500 with 20% opacity
                    : isUnset
                      ? theme.dark
                        ? "rgba(128, 128, 128, 0.1)"
                        : "rgba(128, 128, 128, 0.05)"
                      : "transparent",
                },
                isSelected && {
                  borderTopWidth: 1,
                  borderBottomWidth: 1,
                  borderLeftWidth: 1,
                  borderColor: "rgba(59, 130, 246, 1)", // blue-500
                },
              ]}
              activeOpacity={isSystemField ? 1 : 0.7}
              disabled={isSystemField}
              onPress={() => {
                if (onCellPress && !isSystemField) {
                  onCellPress(item, column, value);
                }
              }}
            >
              <Text
                style={[
                  styles.cellText,
                  {
                    color: cellColor,
                    fontStyle: isUnset ? "italic" : "normal",
                  },
                ]}
                numberOfLines={1}
              >
                {displayValue}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <ScrollView horizontal bounces showsHorizontalScrollIndicator={true}>
      <View
        style={{
          width: tableWidth,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
        }}
      >
        {renderHeaderRow()}
        <FlatList
          data={documents}
          keyExtractor={(item, index) => `${item._id}-${index}`}
          renderItem={renderRow}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.primary}
                colors={[theme.colors.primary]}
              />
            ) : undefined
          }
          contentContainerStyle={[
            styles.listContent,
            documents.length === 0 && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={true}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  horizontalContent: {
    flexGrow: 1,
  },
  listContent: {
    paddingBottom: 16,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  headerRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  headerCell: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRightWidth: 1,
    minHeight: 36,
    justifyContent: "center",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "nowrap",
  },
  headerText: {
    fontSize: 12,
    fontWeight: "500",
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
  },
  headerType: {
    fontSize: 10,
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  cell: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: "center",
    borderRightWidth: 1,
  },
  cellText: {
    fontSize: 11,
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 14,
    marginLeft: 8,
  },
});
