/**
 * Document detail view - Full screen modal showing all document fields
 */

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { useTheme } from "../../../../contexts/ThemeContext";
import { Icon } from "../../../../components/ui/Icon";
import type { TableDocument } from "../../types";
import {
  formatConvexValue,
  formatFullTimestamp,
  formatFieldName,
} from "../../utils/formatters";

export interface DetailViewProps {
  document: TableDocument;
  onClose: () => void;
  onNavigatePrevious?: () => void;
  onNavigateNext?: () => void;
  currentIndex?: number;
  totalCount?: number;
}

export function DetailView({
  document,
  onClose,
  onNavigatePrevious,
  onNavigateNext,
  currentIndex,
  totalCount,
}: DetailViewProps) {
  const { theme } = useTheme();

  const handleCopyField = async (key: string, value: any) => {
    try {
      const stringValue =
        typeof value === "object"
          ? JSON.stringify(value, null, 2)
          : String(value);
      await Clipboard.setStringAsync(stringValue);
      Alert.alert("Copied", `${key} copied to clipboard`);
    } catch (error) {
      Alert.alert("Error", "Failed to copy to clipboard");
    }
  };

  const handleCopyAll = async () => {
    try {
      const jsonString = JSON.stringify(document, null, 2);
      await Clipboard.setStringAsync(jsonString);
      Alert.alert("Copied", "Document copied to clipboard");
    } catch (error) {
      Alert.alert("Error", "Failed to copy to clipboard");
    }
  };

  // Get all fields sorted (_id and _creationTime first)
  const systemFields: Array<[string, any]> = [];
  const userFields: Array<[string, any]> = [];

  Object.entries(document).forEach(([key, value]) => {
    if (key === "_id" || key === "_creationTime") {
      systemFields.push([key, value]);
    } else {
      userFields.push([key, value]);
    }
  });

  const allFields = [...systemFields, ...userFields];

  return (
    <View style={styles.container}>
      {/* Copy all button */}
      <TouchableOpacity
        style={[
          styles.copyAllButton,
          { backgroundColor: theme.colors.background },
        ]}
        onPress={handleCopyAll}
        activeOpacity={0.7}
      >
        <Icon name="code" size={16} color={theme.colors.textSecondary} />
        <Text
          style={[styles.copyAllText, { color: theme.colors.textSecondary }]}
        >
          Copy all as JSON
        </Text>
      </TouchableOpacity>

      {/* Fields */}
      <View style={styles.fieldsContainer}>
        {allFields.map(([key, value], index) => (
          <FieldRow
            key={key}
            fieldKey={key}
            value={value}
            onCopy={() => handleCopyField(key, value)}
            isSystemField={key === "_id" || key === "_creationTime"}
            isLast={index === allFields.length - 1}
          />
        ))}
      </View>
    </View>
  );
}

interface FieldRowProps {
  fieldKey: string;
  value: any;
  onCopy: () => void;
  isSystemField?: boolean;
  isLast?: boolean;
}

function FieldRow({
  fieldKey,
  value,
  onCopy,
  isSystemField = false,
  isLast = false,
}: FieldRowProps) {
  const { theme } = useTheme();

  // Format the value
  let displayValue: string;
  let valueColor: string;
  let isMultiline = false;

  if (fieldKey === "_creationTime" && typeof value === "number") {
    displayValue = formatFullTimestamp(value);
    valueColor = theme.colors.text;
  } else if (typeof value === "object" && value !== null) {
    displayValue = JSON.stringify(value, null, 2);
    valueColor = theme.colors.textSecondary;
    isMultiline = true;
  } else {
    const formatted = formatConvexValue(value, 1000);
    displayValue = formatted.display;
    valueColor = formatted.color;
  }

  return (
    <View
      style={[
        styles.fieldRow,
        {
          backgroundColor: theme.colors.background,
          borderBottomColor: theme.colors.border,
        },
        !isLast && styles.fieldRowBorder,
      ]}
    >
      <View style={styles.fieldRowInner}>
        {/* Left: field name + badge */}
        <View style={styles.fieldLeft}>
          <View style={styles.fieldKeyContainer}>
            <Text
              style={[
                styles.fieldKey,
                {
                  color: isSystemField
                    ? theme.colors.textSecondary
                    : theme.colors.text,
                },
              ]}
              numberOfLines={1}
            >
              {formatFieldName(fieldKey)}
            </Text>
            {isSystemField && (
              <View
                style={[
                  styles.systemBadge,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                <Text
                  style={[
                    styles.systemBadgeText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  System
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Right: value + copy button */}
        <View style={styles.fieldRight}>
          <Text
            style={[
              styles.fieldValue,
              { color: valueColor },
              isMultiline && styles.fieldValueMultiline,
            ]}
            selectable
            numberOfLines={isMultiline ? 3 : 1}
          >
            {displayValue}
          </Text>

          <TouchableOpacity
            style={styles.copyButton}
            onPress={onCopy}
            activeOpacity={0.7}
          >
            <Icon name="code" size={14} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  copyAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 8,
    gap: 6,
  },
  copyAllText: {
    fontSize: 14,
    fontWeight: "500",
  },
  fieldsContainer: {
    paddingHorizontal: 16,
  },
  fieldRow: {
    paddingVertical: 16,
  },
  fieldRowBorder: {
    borderBottomWidth: 1,
  },
  fieldRowInner: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  fieldLeft: {
    flex: 0.45,
    paddingRight: 8,
  },
  fieldRight: {
    flex: 0.55,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },
  fieldKeyContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  fieldKey: {
    fontSize: 14,
    fontWeight: "600",
  },
  systemBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  systemBadgeText: {
    fontSize: 10,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  copyButton: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
  },
  fieldValue: {
    fontSize: 15,
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
    lineHeight: 22,
  },
  fieldValueMultiline: {
    lineHeight: 20,
  },
});
