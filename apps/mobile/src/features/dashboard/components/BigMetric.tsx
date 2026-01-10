import React from "react";
import { StyleSheet, View, Text, Platform } from "react-native";
import { useTheme } from "../../../contexts/ThemeContext";

export type MetricHealth = "healthy" | "warning" | "error";

interface BigMetricProps {
  /** Health status of the metric */
  health: MetricHealth;
  /** The metric value to display */
  metric: string;
  /** Optional subtitle */
  children?: React.ReactNode;
}

/**
 * Large metric display component with health-based styling.
 */
export function BigMetric({ health, metric, children }: BigMetricProps) {
  const { theme } = useTheme();

  const healthColorMap = {
    healthy: theme.colors.success,
    warning: theme.colors.warning,
    error: theme.colors.error,
  };

  const color = healthColorMap[health];

  return (
    <View style={styles.container}>
      <Text style={[styles.metric, { color }]}>{metric}</Text>
      {children && (
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          {children}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  metric: {
    fontSize: 32,
    fontWeight: "bold",
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
  },
  subtitle: {
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
  },
});
