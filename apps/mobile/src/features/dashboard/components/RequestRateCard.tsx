import React from "react";
import { StyleSheet, View, Text, Platform } from "react-native";
import { HealthCard } from "./HealthCard";
import { MetricChart } from "./MetricChart";
import { BigMetric } from "./BigMetric";
import { useHealthMetrics } from "../hooks/useHealthMetrics";
import { useTheme } from "../../../contexts/ThemeContext";

interface RequestRateCardProps {
  /** Additional styles */
  style?: object;
}

/**
 * Format request rate to human readable string.
 */
function formatRate(rate: number): string {
  if (rate < 1) return `${(rate * 60).toFixed(1)}/min`;
  if (rate < 60) return `${rate.toFixed(1)}/sec`;
  return `${(rate / 60).toFixed(1)}/min`;
}

/**
 * Card displaying the request rate metric with chart.
 */
export const RequestRateCard = React.memo(function RequestRateCard({
  style,
}: RequestRateCardProps) {
  const { theme } = useTheme();
  const {
    requestRate,
    requestRateData,
    requestRateTrend,
    requestRateLoading,
    requestRateError,
  } = useHealthMetrics();

  const chartData = requestRateData || null;

  return (
    <HealthCard
      title="Request Rate"
      tip="Number of function invocations per second, bucketed by minute."
      loading={requestRateLoading}
      error={requestRateError}
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
              {formatRate(requestRate)}
            </Text>
            {requestRateTrend && (
              <Text
                style={[styles.trend, { color: theme.colors.textSecondary }]}
              >
                {requestRateTrend}
              </Text>
            )}
          </View>
          <MetricChart
            data={chartData}
            color="brand"
            height={100}
            formatValue={(v) => v.toFixed(0)}
          />
        </View>
      ) : (
        requestRate !== undefined && (
          <BigMetric health="healthy" metric={formatRate(requestRate)}>
            No requests yet
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
