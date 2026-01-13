import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { useTheme } from "../../../contexts/ThemeContext";
import { Skeleton } from "../../../components/ui/Skeleton";

interface HealthCardProps {
  /** Card title */
  title: string;
  /** Tooltip/description text */
  tip?: string;
  /** Whether data is loading */
  loading: boolean;
  /** Error message to display */
  error: string | null;
  /** Card content */
  children: React.ReactNode;
  /** Optional action element in header */
  action?: React.ReactNode;
}

/**
 * Base health card component for mobile dashboard.
 * Displays title, loading state, error handling, and content.
 */
export function HealthCard({
  title,
  tip,
  loading,
  error,
  children,
  action,
}: HealthCardProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.title, { color: theme.colors.textSecondary }]}>
            {title.toUpperCase()}
          </Text>
          {tip && (
            <Text style={[styles.tip, { color: theme.colors.textSecondary }]}>
              {tip}
            </Text>
          )}
        </View>
        {action && <View>{action}</View>}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Skeleton width="40%" height={32} style={{ marginBottom: 12 }} />
            <Skeleton width="60%" height={16} style={{ marginBottom: 8 }} />
            <Skeleton width="80%" height={16} style={{ marginBottom: 8 }} />
            <Skeleton width="50%" height={16} />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {error}
            </Text>
          </View>
        ) : (
          children
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    minHeight: 40,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  tip: {
    fontSize: 9,
    marginTop: 2,
  },
  content: {
    padding: 12,
    minHeight: 60,
  },
  loadingContainer: {
    paddingVertical: 12,
    gap: 8,
  },
  errorContainer: {
    paddingVertical: 24,
    alignItems: "center",
  },
  errorText: {
    fontSize: 12,
    textAlign: "center",
  },
});
