/**
 * LogTableHeader component - Table header with column labels
 * Matches desktop design
 */

import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { useTheme } from "../../../contexts/ThemeContext";

export function LogTableHeader() {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.border,
        },
      ]}
    >
      {/* Timestamp column */}
      <View style={styles.timestampCol}>
        <Text
          style={[styles.headerText, { color: theme.colors.textSecondary }]}
        >
          Timestamp
        </Text>
      </View>

      {/* ID column */}
      <View style={styles.idCol}>
        <Text
          style={[styles.headerText, { color: theme.colors.textSecondary }]}
        >
          ID
        </Text>
      </View>

      {/* Status column */}
      <View style={styles.statusCol}>
        <Text
          style={[styles.headerText, { color: theme.colors.textSecondary }]}
        >
          Status
        </Text>
      </View>

      {/* Function column */}
      <View style={styles.functionCol}>
        <Text
          style={[styles.headerText, { color: theme.colors.textSecondary }]}
        >
          Function
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  timestampCol: {
    width: 130,
    marginRight: 8,
  },
  idCol: {
    width: 44,
    marginRight: 8,
  },
  statusCol: {
    width: 80,
    marginRight: 8,
  },
  functionCol: {
    flex: 1,
  },
  headerText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
  },
});
