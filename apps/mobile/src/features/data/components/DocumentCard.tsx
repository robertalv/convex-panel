/**
 * Document card component - Shows document preview in list view
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { useTheme } from "../../../contexts/ThemeContext";
import type { TableDocument } from "../types";
import {
  formatConvexValue,
  formatId,
  formatTimestamp,
  getDocumentPreviewFields,
} from "../utils/formatters";

export interface DocumentCardProps {
  document: TableDocument;
  onPress: () => void;
}

export function DocumentCard({ document, onPress }: DocumentCardProps) {
  const { theme } = useTheme();
  const previewFields = getDocumentPreviewFields(document);

  // Get _id and _creationTime
  const id = document._id as string;
  const creationTime = document._creationTime as number;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header: ID and timestamp */}
      <View style={styles.header}>
        <Text
          style={[styles.id, { color: theme.colors.primary }]}
          numberOfLines={1}
        >
          {formatId(id)}
        </Text>
        <Text style={[styles.timestamp, { color: theme.colors.textTertiary }]}>
          {formatTimestamp(creationTime)}
        </Text>
      </View>

      {/* Preview fields */}
      <View style={styles.fields}>
        {previewFields.map(({ key, value }) => {
          const formatted = formatConvexValue(value, 40);
          return (
            <View key={key} style={styles.field}>
              <Text
                style={[styles.fieldKey, { color: theme.colors.textSecondary }]}
                numberOfLines={1}
              >
                {key}:
              </Text>
              <Text
                style={[
                  styles.fieldValue,
                  { color: formatted.color },
                  formatted.type === "string" && styles.fieldValueString,
                ]}
                numberOfLines={2}
              >
                {formatted.display}
              </Text>
            </View>
          );
        })}

        {previewFields.length === 0 && (
          <Text
            style={[styles.emptyText, { color: theme.colors.textTertiary }]}
          >
            No additional fields
          </Text>
        )}
      </View>

      {/* Footer indicator */}
      <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
        <Text style={[styles.footerText, { color: theme.colors.textTertiary }]}>
          Tap to view details
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  id: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
    marginRight: 12,
  },
  timestamp: {
    fontSize: 12,
  },
  fields: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  field: {
    marginTop: 8,
  },
  fieldKey: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 2,
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
  },
  fieldValue: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
  },
  fieldValueString: {
    fontStyle: "normal",
  },
  emptyText: {
    fontSize: 13,
    fontStyle: "italic",
    marginTop: 4,
  },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
  },
  footerText: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
