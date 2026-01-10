import React, { useMemo } from "react";
import { StyleSheet, View, Text, Platform } from "react-native";
import { HealthCard } from "./HealthCard";
import { MetricChart } from "./MetricChart";
import {
  useFunctionActivity,
  type FunctionActivityData,
} from "../hooks/useFunctionActivity";
import { useTheme } from "../../../contexts/ThemeContext";

interface FunctionActivityCardProps {
  /** Additional styles */
  style?: object;
}

/**
 * Card displaying function activity by type over time.
 */
export const FunctionActivityCard = React.memo(function FunctionActivityCard({
  style,
}: FunctionActivityCardProps) {
  const { theme } = useTheme();
  const {
    data,
    series,
    currentRate,
    totalInvocations,
    maxValue,
    isLoading,
    error,
  } = useFunctionActivity();

  // Transform data for MetricChart (use combined total)
  const chartData = useMemo(() => {
    if (!data || !data.timestamps || data.timestamps.length === 0) return null;

    const combinedData = data.timestamps.map((timestamp, i) => ({
      time: timestamp * 1000, // Convert to milliseconds
      value:
        (data.queries?.[i] ?? 0) +
        (data.mutations?.[i] ?? 0) +
        (data.actions?.[i] ?? 0) +
        (data.scheduled?.[i] ?? 0) +
        (data.httpActions?.[i] ?? 0),
    }));

    return combinedData;
  }, [data]);

  return (
    <HealthCard
      title="Function Activity"
      tip="Invocations by type per minute."
      loading={isLoading}
      error={error}
    >
      {!data ? (
        <View style={styles.noDataContainer}>
          <Text
            style={[styles.noDataText, { color: theme.colors.textSecondary }]}
          >
            Data will appear here as your functions are called.
          </Text>
        </View>
      ) : data.timestamps.length === 0 ? (
        <View style={styles.noDataContainer}>
          <Text
            style={[styles.noDataText, { color: theme.colors.textSecondary }]}
          >
            No activity data available
          </Text>
        </View>
      ) : (
        <View style={styles.container}>
          {/* Current rate display */}
          <View style={styles.rateRow}>
            <Text style={[styles.currentRate, { color: theme.colors.text }]}>
              {currentRate}
            </Text>
            <Text
              style={[styles.rateLabel, { color: theme.colors.textSecondary }]}
            >
              invocations/min
            </Text>
            <Text
              style={[styles.totalLabel, { color: theme.colors.textSecondary }]}
            >
              {totalInvocations.toLocaleString()} total (1h)
            </Text>
          </View>

          {/* Chart */}
          {chartData && (
            <View style={styles.chartContainer}>
              <MetricChart
                data={chartData}
                color="brand"
                height={100}
                formatValue={(v) => v.toFixed(0)}
              />
            </View>
          )}

          {/* Series summary */}
          <View style={styles.seriesContainer}>
            {series.map((s, index) => (
              <View key={index} style={styles.seriesItem}>
                <View
                  style={[styles.seriesColor, { backgroundColor: s.color }]}
                />
                <Text
                  style={[
                    styles.seriesLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {s.name}
                </Text>
                <Text
                  style={[styles.seriesValue, { color: theme.colors.text }]}
                >
                  {s.data.reduce((sum, v) => sum + v, 0).toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </HealthCard>
  );
});

const styles = StyleSheet.create({
  noDataContainer: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  noDataText: {
    fontSize: 12,
    textAlign: "center",
  },
  container: {
    gap: 12,
  },
  rateRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    flexWrap: "wrap",
  },
  currentRate: {
    fontSize: 24,
    fontWeight: "bold",
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
  },
  rateLabel: {
    fontSize: 12,
  },
  totalLabel: {
    fontSize: 11,
    marginLeft: "auto",
  },
  chartContainer: {
    width: "100%",
  },
  seriesContainer: {
    gap: 8,
    marginTop: 8,
  },
  seriesItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  seriesColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  seriesLabel: {
    fontSize: 12,
    flex: 1,
  },
  seriesValue: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
  },
});
