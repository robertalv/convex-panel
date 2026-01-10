/**
 * EmptyLogsState component - Displays when no logs are available
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../../contexts/ThemeContext";

export interface EmptyLogsStateProps {
  isLoading?: boolean;
}

export function EmptyLogsState({ isLoading }: EmptyLogsStateProps) {
  const { theme } = useTheme();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Loading logs...
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Please wait while we fetch your deployment logs
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.emoji, { color: theme.colors.textSecondary }]}>
        📋
      </Text>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        No logs yet
      </Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Logs will appear here as your functions execute
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
