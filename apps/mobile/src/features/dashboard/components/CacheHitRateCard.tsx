import React from "react";
import { StyleSheet, View, Text, Platform } from "react-native";
import { HealthCard } from "./HealthCard";
import { MetricChart } from "./MetricChart";
import { BigMetric, type MetricHealth } from "./BigMetric";
import { useHealthMetrics } from "../hooks/useHealthMetrics";
import { useTheme } from "../../../contexts/ThemeContext";

interface CacheHitRateCardProps {
  /** Additional styles */
  style?: object;
}

/**
 * Determines health status based on cache hit rate percentage.
 */
function getCacheHitRateHealth(rate: number): MetricHealth {
  if (rate > 90) return "healthy";
  if (rate > 70) return "warning";
  return "error";
}

/**
 * Card displaying the cache hit rate metric with chart.
 *
 * PERFORMANCE: Memoized to prevent unnecessary re-renders
 */
export const CacheHitRateCard = React.memo(function CacheHitRateCard({
  style,
}: CacheHitRateCardProps) {
  const { theme } = useTheme();
  const {
    cacheHitRate,
    cacheHitRateData,
    cacheHitRateTrend,
    cacheHitRateLoading,
    cacheHitRateError,
  } = useHealthMetrics();

  const health =
    cacheHitRate !== undefined
      ? getCacheHitRateHealth(cacheHitRate)
      : undefined;

  const chartData = cacheHitRateData || null;

  return (
    <HealthCard
      title="Cache Hit Rate"
      tip="Percentage of queries that were served from cache."
      loading={cacheHitRateLoading}
      error={cacheHitRateError}
    >
      {chartData === null ? (
        <View style={styles.noDataContainer}>
          <Text
            style={[styles.noDataText, { color: theme.colors.textSecondary }]}
          >
            Data will appear here as your queries are executed.
          </Text>
        </View>
      ) : chartData === undefined ? null : chartData.length > 0 ? (
        <View style={styles.chartContainer}>
          <View style={styles.metricRow}>
            <Text style={[styles.currentRate, { color: theme.colors.text }]}>
              {cacheHitRate.toFixed(1)}%
            </Text>
            {cacheHitRateTrend && (
              <Text
                style={[styles.trend, { color: theme.colors.textSecondary }]}
              >
                {cacheHitRateTrend}
              </Text>
            )}
          </View>
          <MetricChart
            data={chartData}
            color={
              health ? (health === "healthy" ? "success" : "warning") : "brand"
            }
            height={100}
            formatValue={(v) => `${v.toFixed(0)}%`}
          />
        </View>
      ) : (
        cacheHitRate !== undefined && (
          <BigMetric health={health!} metric={`${cacheHitRate.toFixed(1)}%`}>
            No cache data
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
