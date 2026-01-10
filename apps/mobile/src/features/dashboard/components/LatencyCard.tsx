import React from "react";
import { StyleSheet, View, Text, Platform } from "react-native";
import { HealthCard } from "./HealthCard";
import { useHealthMetrics } from "../hooks/useHealthMetrics";
import { useTheme } from "../../../contexts/ThemeContext";

interface LatencyCardProps {
  /** Additional styles */
  style?: object;
}

/**
 * Format milliseconds to human readable string.
 */
function formatLatency(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}µs`;
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

interface PercentileBadgeProps {
  label: string;
  value: number;
  highlight?: boolean;
}

function PercentileBadge({ label, value, highlight }: PercentileBadgeProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: highlight
            ? theme.colors.surface
            : theme.colors.background,
          borderColor: highlight ? theme.colors.primary : theme.colors.border,
        },
      ]}
    >
      <Text style={[styles.badgeLabel, { color: theme.colors.textSecondary }]}>
        {label}
      </Text>
      <Text
        style={[
          styles.badgeValue,
          {
            color: highlight ? theme.colors.primary : theme.colors.text,
          },
        ]}
      >
        {formatLatency(value)}
      </Text>
    </View>
  );
}

/**
 * Card displaying latency percentiles (p50, p95, p99).
 */
export const LatencyCard = React.memo(function LatencyCard({
  style,
}: LatencyCardProps) {
  const { theme } = useTheme();
  const { latencyPercentiles, latencyLoading, latencyError } =
    useHealthMetrics();

  return (
    <HealthCard
      title="Latency"
      tip="Function execution time percentiles."
      loading={latencyLoading}
      error={latencyError}
    >
      {latencyPercentiles ? (
        <View style={styles.percentilesContainer}>
          <PercentileBadge label="p50" value={latencyPercentiles.p50} />
          <PercentileBadge
            label="p95"
            value={latencyPercentiles.p95}
            highlight
          />
          <PercentileBadge label="p99" value={latencyPercentiles.p99} />
        </View>
      ) : (
        <View style={styles.noDataContainer}>
          <Text
            style={[styles.noDataText, { color: theme.colors.textSecondary }]}
          >
            No latency data available
          </Text>
        </View>
      )}
    </HealthCard>
  );
});

const styles = StyleSheet.create({
  percentilesContainer: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  badge: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 4,
  },
  badgeValue: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
  },
  noDataContainer: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  noDataText: {
    fontSize: 12,
    textAlign: "center",
  },
});
