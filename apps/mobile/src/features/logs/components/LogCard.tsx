/**
 * LogCard component - Displays individual log entry in table row format
 * Matches desktop design from dashboard-common/features/logs/components/LogListItem.tsx
 */

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { useTheme } from "../../../contexts/ThemeContext";
import type { LogEntry } from "../../../api/logs";

export interface LogCardProps {
  log: LogEntry;
  onPress?: () => void;
}

/**
 * Format timestamp to match desktop: "Jan 08, 12:29:00.848"
 */
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const month = date.toLocaleString("en-US", { month: "short" });
  const day = date.getDate().toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  const ms = date.getMilliseconds().toString().padStart(3, "0");
  return `${month} ${day}, ${hours}:${minutes}:${seconds}.${ms}`;
}

/**
 * Get function type badge (Q/M/A)
 */
function getFunctionTypeBadge(type?: string): string {
  if (!type) return "";
  const t = type.toLowerCase();
  if (t === "query") return "Q";
  if (t === "mutation") return "M";
  if (t === "action") return "A";
  return type.charAt(0).toUpperCase();
}

/**
 * Format execution time in ms
 */
function formatExecutionTime(ms?: number): string {
  if (ms === undefined || ms === null || ms <= 0) return "";
  return `${Math.round(ms)}ms`;
}

export function LogCard({ log, onPress }: LogCardProps) {
  const { theme } = useTheme();
  const isError = log.status === "error" || log.status === "failure";
  const requestIdShort = log.function?.request_id?.substring(0, 4) || "";

  return (
    <TouchableOpacity
      style={[
        styles.row,
        {
          backgroundColor: isError
            ? theme.colors.error + "15" // Light red background for errors
            : theme.colors.background,
          borderBottomColor: theme.colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      {/* Timestamp column */}
      <View style={styles.timestampCol}>
        <Text
          style={[styles.timestamp, { color: theme.colors.text }]}
          numberOfLines={1}
        >
          {formatTimestamp(log.timestamp)}
        </Text>
      </View>

      {/* ID column */}
      <View style={styles.idCol}>
        {requestIdShort && (
          <View
            style={[
              styles.idBadge,
              {
                backgroundColor: theme.colors.border,
                borderColor: isError ? theme.colors.error : theme.colors.border,
              },
            ]}
          >
            <Text
              style={[styles.idText, { color: theme.colors.textSecondary }]}
            >
              {requestIdShort}
            </Text>
          </View>
        )}
      </View>

      {/* Status column */}
      <View style={styles.statusCol}>
        <Text
          style={[
            styles.statusText,
            {
              color: isError ? theme.colors.error : theme.colors.success,
            },
          ]}
        >
          {log.status || "success"}
        </Text>
        <Text
          style={[styles.executionTime, { color: theme.colors.textSecondary }]}
        >
          {log.function?.cached
            ? "(cached)"
            : formatExecutionTime(log.execution_time_ms)}
        </Text>
      </View>

      {/* Function column */}
      <View style={styles.functionCol}>
        <View
          style={[
            styles.typeBadge,
            {
              backgroundColor: isError
                ? theme.colors.error + "20"
                : theme.colors.border + "80",
            },
          ]}
        >
          <Text
            style={[
              styles.typeText,
              { color: isError ? theme.colors.error : theme.colors.text },
            ]}
          >
            {getFunctionTypeBadge(log.function?.type)}
          </Text>
        </View>
        <Text
          style={[styles.functionPath, { color: theme.colors.text }]}
          numberOfLines={1}
        >
          {log.function?.path || ""}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 36,
  },
  timestampCol: {
    width: 130,
    marginRight: 8,
  },
  timestamp: {
    fontSize: 11,
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
  },
  idCol: {
    width: 44,
    marginRight: 8,
    alignItems: "flex-start",
  },
  idBadge: {
    borderRadius: 3,
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 1,
    alignSelf: "flex-start",
  },
  idText: {
    fontSize: 9,
    fontWeight: "600",
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
  },
  statusCol: {
    width: 80,
    marginRight: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  executionTime: {
    fontSize: 10,
  },
  functionCol: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  typeBadge: {
    width: 18,
    height: 18,
    borderRadius: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  typeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  functionPath: {
    fontSize: 11,
    flex: 1,
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
  },
});
