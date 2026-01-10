import React from "react";
import { StyleSheet, View, Text, Platform } from "react-native";
import { HealthCard } from "./HealthCard";
import { MetricChart, type TimeSeriesDataPoint } from "./MetricChart";
import { BigMetric, type MetricHealth } from "./BigMetric";
import { useHealthMetrics } from "../hooks/useHealthMetrics";
import { useTheme } from "../../../contexts/ThemeContext";

interface FailureRateCardProps {
  /** Additional styles */
  style?: object;
}

/**
 * Determines health status based on failure rate percentage.
 */
function getFailureRateHealth(rate: number): MetricHealth {
  if (rate < 0.5) return "healthy";
  if (rate < 2) return "warning";
  return "error";
}

/**
 * Get chart color based on health
 */
function getChartColor(
  health: MetricHealth,
): "success" | "warning" | "error" | "brand" {
  switch (health) {
    case "healthy":
      return "success";
    case "warning":
      return "warning";
    case "error":
      return "error";
    default:
      return "brand";
  }
}

/**
 * Card displaying the failure rate metric with chart.
 *
 * PERFORMANCE: Memoized to prevent unnecessary re-renders when parent updates
 */
export const FailureRateCard = React.memo(function FailureRateCard({
  style,
}: FailureRateCardProps) {
  const { theme } = useTheme();
  const {
    failureRate,
    failureRateData,
    failureRateTrend,
    failureRateLoading,
    failureRateError,
  } = useHealthMetrics();

  const health =
    failureRate !== undefined ? getFailureRateHealth(failureRate) : undefined;

  const chartData = failureRateData || null;

  return (
    <HealthCard
      title="Failure Rate"
      tip="The failure rate of all your running functions, bucketed by minute."
      loading={failureRateLoading}
      error={failureRateError}
    >
      {chartData === null ? (
        <View style={styles.noDataContainer}>
          <Text
            style={[styles.noDataText, { color: theme.colors.textSecondary }]}
          >
            Data will appear here as your functions are called.
          </Text>
        </View>
      ) : chartData === undefined ? null : chartData.length > 0 ? (
        <View style={styles.chartContainer}>
          <View style={styles.metricRow}>
            <Text style={[styles.currentRate, { color: theme.colors.text }]}>
              {failureRate.toFixed(2)}%
            </Text>
            {failureRateTrend && (
              <Text
                style={[styles.trend, { color: theme.colors.textSecondary }]}
              >
                {failureRateTrend}
              </Text>
            )}
          </View>
          <MetricChart
            data={chartData}
            color={health ? getChartColor(health) : "brand"}
            height={100}
            formatValue={(v) => `${v.toFixed(0)}%`}
          />
        </View>
      ) : (
        failureRate !== undefined && (
          <BigMetric health={health!} metric={`${failureRate.toFixed(2)}%`}>
            No recent failures
          </BigMetric>
        )
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
  chartContainer: {
    width: "100%",
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 8,
    gap: 8,
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
  trend: {
    fontSize: 12,
  },
});
