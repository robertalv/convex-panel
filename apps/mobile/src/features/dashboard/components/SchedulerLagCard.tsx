import React from "react";
import { StyleSheet, View, Text, Platform } from "react-native";
import { HealthCard } from "./HealthCard";
import { MetricChart } from "./MetricChart";
import { BigMetric, type MetricHealth } from "./BigMetric";
import { useHealthMetrics } from "../hooks/useHealthMetrics";
import { useTheme } from "../../../contexts/ThemeContext";

interface SchedulerLagCardProps {
  /** Additional styles */
  style?: object;
}

/**
 * Format milliseconds to human readable string.
 */
function formatLag(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Determines health status based on scheduler lag.
 */
function getSchedulerLagHealth(lag: number): MetricHealth {
  if (lag < 1000) return "healthy";
  if (lag < 5000) return "warning";
  return "error";
}

/**
 * Card displaying the scheduler lag metric with chart.
 */
export const SchedulerLagCard = React.memo(function SchedulerLagCard({
  style,
}: SchedulerLagCardProps) {
  const { theme } = useTheme();
  const {
    schedulerLag,
    schedulerLagData,
    schedulerLagTrend,
    schedulerLagLoading,
    schedulerLagError,
  } = useHealthMetrics();

  const health =
    schedulerLag !== undefined
      ? getSchedulerLagHealth(schedulerLag)
      : undefined;

  const chartData = schedulerLagData || null;

  return (
    <HealthCard
      title="Scheduler Lag"
      tip="Time delay between when scheduled functions should run and when they actually run."
      loading={schedulerLagLoading}
      error={schedulerLagError}
    >
      {chartData === null ? (
        <View style={styles.noDataContainer}>
          <Text
            style={[styles.noDataText, { color: theme.colors.textSecondary }]}
          >
            Data will appear here as scheduled functions run.
          </Text>
        </View>
      ) : chartData === undefined ? null : chartData.length > 0 ? (
        <View style={styles.chartContainer}>
          <View style={styles.metricRow}>
            <Text style={[styles.currentLag, { color: theme.colors.text }]}>
              {formatLag(schedulerLag)}
            </Text>
            {schedulerLagTrend && (
              <Text
                style={[styles.trend, { color: theme.colors.textSecondary }]}
              >
                {schedulerLagTrend}
              </Text>
            )}
          </View>
          <MetricChart
            data={chartData}
            color={
              health
                ? health === "healthy"
                  ? "success"
                  : health === "warning"
                    ? "warning"
                    : "error"
                : "brand"
            }
            height={100}
            formatValue={(v) => formatLag(v)}
          />
        </View>
      ) : (
        schedulerLag !== undefined && (
          <BigMetric health={health!} metric={formatLag(schedulerLag)}>
            No lag data
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
  currentLag: {
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
