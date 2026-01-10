import React from "react";
import { StyleSheet, View, Text, ScrollView } from "react-native";
import { HealthCard } from "./HealthCard";
import { useInsights } from "../hooks/useInsights";
import { useTheme } from "../../../contexts/ThemeContext";
import type { Insight } from "../../../api";

interface InsightsSummaryCardProps {
  /** Additional styles */
  style?: object;
}

/**
 * Get insight kind badge color
 */
function getInsightKindColor(kind: string, theme: any): string {
  if (kind.includes("Retried") || kind.includes("Failed"))
    return theme.colors.error;
  if (kind.includes("Limit")) return theme.colors.warning;
  if (kind.includes("Threshold")) return theme.colors.warning;
  return theme.colors.info;
}

/**
 * Get insight kind display name
 */
function getInsightKindDisplay(kind: string): string {
  if (kind === "occRetried") return "OCC Retried";
  if (kind === "occFailedPermanently") return "OCC Failed";
  if (kind === "bytesReadLimit") return "Bytes Read Limit";
  if (kind === "bytesReadThreshold") return "Bytes Read Threshold";
  if (kind === "documentsReadLimit") return "Documents Read Limit";
  if (kind === "documentsReadThreshold") return "Documents Read Threshold";
  return kind;
}

/**
 * Card displaying insights summary from BigBrain API.
 */
export const InsightsSummaryCard = React.memo(function InsightsSummaryCard({
  style,
}: InsightsSummaryCardProps) {
  const { theme } = useTheme();
  const { insights, isLoading, error } = useInsights();

  const insightCount = insights?.length ?? 0;

  return (
    <HealthCard
      title="Insights"
      tip="Recommendations and warnings from Convex BigBrain API."
      loading={isLoading}
      error={error}
    >
      {insightCount === 0 ? (
        <View style={styles.emptyContainer}>
          <Text
            style={[styles.emptyText, { color: theme.colors.textSecondary }]}
          >
            No insights available
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {insights.map((insight: Insight, index: number) => {
            const kindColor = getInsightKindColor(insight.kind, theme);
            const kindDisplay = getInsightKindDisplay(insight.kind);

            // Get details based on insight kind
            let details: any = null;
            if ("details" in insight) {
              details = insight.details;
            }

            return (
              <View
                key={`${insight.functionId}-${insight.kind}-${index}`}
                style={[
                  styles.insightItem,
                  index < insights.length - 1 && {
                    borderBottomColor: theme.colors.border,
                  },
                ]}
              >
                <View style={styles.insightHeader}>
                  <View
                    style={[
                      styles.kindBadge,
                      { backgroundColor: kindColor + "20" },
                    ]}
                  >
                    <Text style={[styles.kindBadgeText, { color: kindColor }]}>
                      {kindDisplay}
                    </Text>
                  </View>
                  <Text
                    style={[styles.functionName, { color: theme.colors.text }]}
                    numberOfLines={1}
                  >
                    {insight.componentPath || insight.functionId}
                  </Text>
                </View>
                {details && (
                  <View style={styles.insightBody}>
                    {"occCalls" in details && (
                      <Text
                        style={[
                          styles.detailText,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        {details.occCalls} OCC calls
                        {details.occTableName && ` on ${details.occTableName}`}
                      </Text>
                    )}
                    {"count" in details && (
                      <Text
                        style={[
                          styles.detailText,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        {details.count.toLocaleString()} occurrences
                      </Text>
                    )}
                    {"hourlyCounts" in details &&
                      details.hourlyCounts &&
                      details.hourlyCounts.length > 0 && (
                        <Text
                          style={[
                            styles.detailText,
                            { color: theme.colors.textSecondary },
                          ]}
                        >
                          {details.hourlyCounts.reduce(
                            (sum: number, h: { count: number }) =>
                              sum + h.count,
                            0,
                          )}{" "}
                          total events
                        </Text>
                      )}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </HealthCard>
  );
});

const styles = StyleSheet.create({
  emptyContainer: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 12,
    textAlign: "center",
  },
  list: {
    maxHeight: 300,
  },
  insightItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  insightHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  kindBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    minWidth: 60,
    alignItems: "center",
  },
  kindBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  functionName: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  insightBody: {
    marginTop: 4,
    gap: 4,
  },
  detailText: {
    fontSize: 12,
  },
});
