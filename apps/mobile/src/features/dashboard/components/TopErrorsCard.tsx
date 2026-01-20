import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';


import { HealthCard } from './HealthCard';
import { useFunctionHealth, type FunctionStat } from '../hooks/useFunctionHealth';
import { useTheme } from '../../../contexts/ThemeContext';

interface TopErrorsCardProps {
  /** Maximum number of functions to display */
  maxItems?: number;
  /** Additional styles */
  style?: object;
}

/**
 * Get the type badge abbreviation for a function type.
 */
function getTypeBadge(type: string): string {
  const normalized = type.toLowerCase();
  if (normalized === 'query' || normalized === 'q') return 'Q';
  if (normalized === 'mutation' || normalized === 'm') return 'M';
  if (normalized === 'httpaction' || normalized === 'http' || normalized === 'h')
    return 'HTTP';
  return 'A';
}

/**
 * Get type badge color
 */
function getTypeBadgeColor(type: string, theme: any): string {
  const normalized = type.toLowerCase();
  if (normalized === 'query') return theme.colors.info;
  if (normalized === 'mutation') return theme.colors.success;
  if (normalized === 'action') return theme.colors.warning;
  if (normalized === 'httpaction') return '#8b5cf6';
  return theme.colors.textSecondary;
}

/**
 * Truncate error message
 */
function truncateError(error: string, maxLen: number = 60): string {
  if (error.length <= maxLen) return error;
  return error.substring(0, maxLen) + '...';
}

/**
 * Card displaying functions with the most errors.
 */
export const TopErrorsCard = React.memo(function TopErrorsCard({ maxItems = 5, style }: TopErrorsCardProps) {
  const { theme } = useTheme();
  const { topFailing, totalErrors, isLoading, error } = useFunctionHealth();

  // Filter and sort by error count
  const displayFunctions = useMemo(() => {
    if (!topFailing || !Array.isArray(topFailing)) return [];
    return [...topFailing]
      .filter((f) => f.errors > 0)
      .sort((a, b) => b.errors - a.errors)
      .slice(0, maxItems);
  }, [topFailing, maxItems]);

  const maxErrors = useMemo(() => {
    if (displayFunctions.length === 0) return 1;
    return Math.max(...displayFunctions.map((f) => f.errors));
  }, [displayFunctions]);

  return (
    <HealthCard
      title="Top Errors"
      tip={`Functions with the most errors. Total: ${totalErrors} errors.`}
      loading={isLoading}
      error={error}
    >
      {displayFunctions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text
            style={[styles.emptyText, { color: theme.colors.textSecondary }]}
          >
            No errors found
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {displayFunctions.map((func, index) => (
            <View
              key={`${func.name}-${index}`}
              style={[
                styles.item,
                index < displayFunctions.length - 1 && {
                  borderBottomColor: theme.colors.border,
                },
              ]}
            >
              <View style={styles.itemHeader}>
                <View style={styles.nameContainer}>
                  <View
                    style={[
                      styles.typeBadge,
                      {
                        backgroundColor:
                          getTypeBadgeColor(func.type, theme) + '20',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeBadgeText,
                        { color: getTypeBadgeColor(func.type, theme) },
                      ]}
                    >
                      {getTypeBadge(func.type)}
                    </Text>
                  </View>
                  <Text
                    style={[styles.functionName, { color: theme.colors.text }]}
                    numberOfLines={1}
                  >
                    {func.name}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.errorCount,
                    {
                      color:
                        func.failureRate > 50
                          ? theme.colors.error
                          : theme.colors.warning,
                    },
                  ]}
                >
                  {func.errors}
                </Text>
              </View>
              <View style={styles.itemBody}>
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      {
                        width: `${(func.errors / maxErrors) * 100}%`,
                        backgroundColor:
                          func.failureRate > 50
                            ? theme.colors.error
                            : theme.colors.warning,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.errorRate,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {func.failureRate.toFixed(1)}% failure rate
                </Text>
              </View>
              {func.lastError && (
                <Text
                  style={[
                    styles.lastError,
                    { color: theme.colors.textSecondary },
                  ]}
                  numberOfLines={2}
                >
                  {truncateError(func.lastError)}
                </Text>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </HealthCard>
  );
});

const styles = StyleSheet.create({
  emptyContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 12,
    textAlign: 'center',
  },
  list: {
    maxHeight: 300,
  },
  item: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  functionName: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  errorCount: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
  },
  itemBody: {
    marginTop: 4,
  },
  barContainer: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  bar: {
    height: '100%',
    borderRadius: 2,
  },
  errorRate: {
    fontSize: 11,
  },
  lastError: {
    fontSize: 11,
    marginTop: 4,
    fontStyle: 'italic',
  },
});

