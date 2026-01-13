/**
 * LogDetailSheet - Bottom sheet showing detailed log information
 * Modern design with tabs for Execution, Request, Logs, and Raw data
 * Inspired by desktop LogDetailSheet with usage stats
 */

import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Share,
  Alert,
} from "react-native";
import type BottomSheet from "@gorhom/bottom-sheet";
import * as Clipboard from "expo-clipboard";
import { useTheme } from "../../../contexts/ThemeContext";
import { Icon } from "../../../components/ui/Icon";
import { BaseSheet } from "../../../components/sheets/BaseSheet";
import { filterSheetStyles } from "../../../components/sheets/filterSheetStyles";
import { JsonSyntaxHighlighter } from "./JsonSyntaxHighlighter";
import { FunctionCallTree } from "./FunctionCallTree";
import type { LogEntry } from "../../../api/logs";

export interface LogDetailSheetProps {
  sheetRef: React.RefObject<BottomSheet>;
  log: LogEntry | null;
  allLogs: LogEntry[];
  onClose: () => void;
}

type TabType = "execution" | "request" | "functions" | "logs" | "raw";

// Helper to format bytes
function formatBytes(bytes: number | undefined): string {
  if (bytes === undefined || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// Helper to format duration
function formatDuration(ms: number | undefined): string {
  if (ms === undefined) return "-";
  if (ms < 1) return "<1ms";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function LogDetailSheet({
  sheetRef,
  log,
  allLogs,
  onClose,
}: LogDetailSheetProps) {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>("execution");

  const isError = log?.status === "error" || log?.status === "failure";

  // Get usage stats from raw data if available
  const usageStats = useMemo(() => {
    if (!log?.raw) return null;
    return log.raw.usageStats || log.raw.usage_stats || null;
  }, [log]);

  // Filter logs that belong to the same request for the function call tree
  const relatedLogs = useMemo(() => {
    if (!log) return [];
    const requestId = log.function?.request_id || log.raw?.requestId;
    if (!requestId) return [log];
    return allLogs.filter((l) => {
      const lRequestId = l.function?.request_id || l.raw?.requestId;
      return lRequestId === requestId;
    });
  }, [log, allLogs]);

  // Share helper
  const handleShare = async () => {
    if (!log) return;

    try {
      const shareContent = `Log Details

Function: ${log.function?.path || "N/A"}
Type: ${log.function?.type || "N/A"}
Status: ${log.status || "success"}
Execution Time: ${log.execution_time_ms !== undefined ? `${log.execution_time_ms.toFixed(2)}ms` : "N/A"}
Timestamp: ${new Date(log.timestamp).toLocaleString()}

${log.error_message ? `Error: ${log.error_message}\n\n` : ""}Log Message:
${log.message || "No log message"}`;

      await Share.share({
        message: shareContent,
        title: "Log Details",
      });
    } catch (error) {
      Alert.alert("Error", "Failed to share log");
    }
  };

  // Copy to clipboard helper
  const handleCopy = useCallback(async (text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert("Copied", "Copied to clipboard");
    } catch (error) {
      Alert.alert("Error", "Failed to copy");
    }
  }, []);

  // Get function type label
  const getFunctionTypeLabel = () => {
    if (!log?.function?.type) return "";
    switch (log.function.type.toLowerCase()) {
      case "query":
        return "Query";
      case "mutation":
        return "Mutation";
      case "action":
        return "Action";
      case "httpaction":
        return "HTTP Action";
      default:
        return log.function.type;
    }
  };

  // Custom header left with share button
  const renderHeaderLeft = (
    <TouchableOpacity
      style={[styles.iconBtn, { backgroundColor: theme.colors.background }]}
      onPress={handleShare}
      activeOpacity={0.7}
    >
      <Icon name="share" size={18} color={theme.colors.textSecondary} />
    </TouchableOpacity>
  );

  // Custom header right with copy button
  const renderHeaderRight = (
    <TouchableOpacity
      style={[styles.iconBtn, { backgroundColor: theme.colors.background }]}
      onPress={() =>
        log && handleCopy(log.function?.request_id || log.raw?.requestId || "")
      }
      activeOpacity={0.7}
    >
      <Icon name="copy" size={18} color={theme.colors.textSecondary} />
    </TouchableOpacity>
  );

  // Function type badge for title
  const titleWithType = log?.function?.type ? (
    <View style={styles.titleContainer}>
      <Text
        style={[styles.functionType, { color: theme.colors.textSecondary }]}
      >
        {getFunctionTypeLabel()}
      </Text>
    </View>
  ) : null;

  return (
    <BaseSheet
      sheetRef={sheetRef}
      onClose={onClose}
      size="large"
      title={log?.function?.path || "Log Details"}
      headerLeft={renderHeaderLeft}
      headerRight={renderHeaderRight}
      scrollable
    >
      {/* Tabs - styled like desktop */}
      <View
        style={[
          styles.tabsContainer,
          {
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <TabButton
          label="Execution"
          isActive={activeTab === "execution"}
          onPress={() => setActiveTab("execution")}
          theme={theme}
        />
        <TabButton
          label="Request"
          isActive={activeTab === "request"}
          onPress={() => setActiveTab("request")}
          theme={theme}
        />
        <TabButton
          label="Functions"
          isActive={activeTab === "functions"}
          onPress={() => setActiveTab("functions")}
          theme={theme}
        />
        <TabButton
          label="Logs"
          isActive={activeTab === "logs"}
          onPress={() => setActiveTab("logs")}
          theme={theme}
        />
        <TabButton
          label="Raw"
          isActive={activeTab === "raw"}
          onPress={() => setActiveTab("raw")}
          theme={theme}
        />
      </View>

      {/* Tab Content */}
      <View style={styles.contentContainer}>
        {log ? (
          <>
            {activeTab === "execution" && (
              <ExecutionTab log={log} theme={theme} usageStats={usageStats} />
            )}
            {activeTab === "request" && (
              <RequestTab log={log} theme={theme} onCopy={handleCopy} />
            )}
            {activeTab === "functions" && (
              <FunctionsTab log={log} allLogs={relatedLogs} theme={theme} />
            )}
            {activeTab === "logs" && <LogsTab log={log} theme={theme} />}
            {activeTab === "raw" && <RawTab log={log} theme={theme} />}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text
              style={[
                styles.emptyStateText,
                { color: theme.colors.textSecondary },
              ]}
            >
              No log selected
            </Text>
          </View>
        )}
      </View>
    </BaseSheet>
  );
}

// Tab Button Component - styled exactly like FilterPillButton from BaseFilterSheet
function TabButton({
  label,
  isActive,
  onPress,
  theme,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
  theme: any;
}) {
  return (
    <TouchableOpacity
      style={[
        filterSheetStyles.pillButton,
        {
          backgroundColor: isActive
            ? theme.colors.primary + "20"
            : "transparent",
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          filterSheetStyles.pillText,
          {
            color: isActive ? theme.colors.primary : theme.colors.text,
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// Usage Stat Card Component - like desktop
function UsageStatCard({
  icon,
  label,
  value,
  subValue,
  theme,
}: {
  icon: string;
  label: string;
  value: string;
  subValue?: string;
  theme: any;
}) {
  return (
    <View style={[styles.usageCard, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.usageCardHeader}>
        <Icon name={icon} size={12} color={theme.colors.textSecondary} />
        <Text
          style={[styles.usageLabel, { color: theme.colors.textSecondary }]}
        >
          {label}
        </Text>
      </View>
      <Text style={[styles.usageValue, { color: theme.colors.text }]}>
        {value}
      </Text>
      {subValue && (
        <Text
          style={[styles.usageSubValue, { color: theme.colors.textTertiary }]}
        >
          {subValue}
        </Text>
      )}
    </View>
  );
}

// Execution Tab - Shows timing and performance metrics
function ExecutionTab({
  log,
  theme,
  usageStats,
}: {
  log: LogEntry;
  theme: any;
  usageStats: any;
}) {
  const isError = log.status === "error" || log.status === "failure";
  const isCached = log.function?.cached;

  const getStatusColor = () => {
    if (isError) return theme.colors.error;
    if (isCached) return theme.colors.warning || "#f59e0b";
    return theme.colors.success;
  };

  const getStatusLabel = () => {
    if (isError) return "Failed";
    if (isCached) return "Cached";
    return "Success";
  };

  return (
    <View style={styles.tabContent}>
      {/* Status Row */}
      <View style={styles.statusRow}>
        <View style={styles.statusLeft}>
          <Icon
            name={isError ? "x-circle" : isCached ? "zap" : "check-circle"}
            size={18}
            color={getStatusColor()}
          />
          <Text style={[styles.statusLabel, { color: getStatusColor() }]}>
            {getStatusLabel()}
          </Text>
        </View>
        {log.execution_time_ms !== undefined && (
          <Text
            style={[
              styles.durationSmall,
              { color: theme.colors.textSecondary },
            ]}
          >
            {formatDuration(log.execution_time_ms)}
          </Text>
        )}
      </View>

      {/* Error message */}
      {log.error_message && (
        <View
          style={[
            styles.errorBox,
            {
              backgroundColor: theme.colors.error + "15",
              borderColor: theme.colors.error,
            },
          ]}
        >
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {log.error_message}
          </Text>
        </View>
      )}

      {/* Timestamp & Duration Grid */}
      <View style={styles.gridRow}>
        <View style={styles.gridCell}>
          <Text
            style={[styles.gridLabel, { color: theme.colors.textSecondary }]}
          >
            Timestamp
          </Text>
          <Text style={[styles.gridValue, { color: theme.colors.text }]}>
            {new Date(log.timestamp).toLocaleString()}
          </Text>
        </View>
        <View style={styles.gridCell}>
          <Text
            style={[styles.gridLabel, { color: theme.colors.textSecondary }]}
          >
            Duration
          </Text>
          <Text style={[styles.gridValue, { color: theme.colors.text }]}>
            {formatDuration(log.execution_time_ms)}
          </Text>
        </View>
      </View>

      {/* Usage Statistics */}
      {usageStats && (
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}
          >
            Usage Statistics
          </Text>
          <View style={styles.usageGrid}>
            <UsageStatCard
              icon="database"
              label="Database Read"
              value={formatBytes(usageStats.database_read_bytes)}
              subValue={
                usageStats.database_read_documents
                  ? `${usageStats.database_read_documents} docs`
                  : undefined
              }
              theme={theme}
            />
            <UsageStatCard
              icon="database"
              label="Database Write"
              value={formatBytes(usageStats.database_write_bytes)}
              theme={theme}
            />
            <UsageStatCard
              icon="hard-drive"
              label="Storage Read"
              value={formatBytes(usageStats.storage_read_bytes)}
              theme={theme}
            />
            <UsageStatCard
              icon="hard-drive"
              label="Storage Write"
              value={formatBytes(usageStats.storage_write_bytes)}
              theme={theme}
            />
            {usageStats.memory_used_mb !== undefined && (
              <UsageStatCard
                icon="cpu"
                label="Memory"
                value={`${usageStats.memory_used_mb} MB`}
                theme={theme}
              />
            )}
          </View>
        </View>
      )}
    </View>
  );
}

// Request Tab - Shows request metadata with copy buttons
function RequestTab({
  log,
  theme,
  onCopy,
}: {
  log: LogEntry;
  theme: any;
  onCopy: (text: string) => void;
}) {
  const raw = log.raw || {};

  return (
    <View style={styles.tabContent}>
      <InfoRow
        label="Request ID"
        value={log.function?.request_id || raw.requestId}
        theme={theme}
        mono
        onCopy={onCopy}
      />
      <InfoRow
        label="Execution ID"
        value={raw.executionId}
        theme={theme}
        mono
        onCopy={onCopy}
      />
      <InfoRow
        label="Function"
        value={log.function?.path || raw.identifier}
        theme={theme}
        mono
        onCopy={onCopy}
      />
      {raw.componentPath && (
        <InfoRow label="Component" value={raw.componentPath} theme={theme} />
      )}
      <InfoRow label="Identity Type" value={raw.identityType} theme={theme} />
      {raw.caller && (
        <InfoRow label="Caller" value={raw.caller} theme={theme} />
      )}
      {raw.environment && (
        <InfoRow label="Environment" value={raw.environment} theme={theme} />
      )}
      {raw.returnBytes !== undefined && (
        <InfoRow
          label="Return Size"
          value={formatBytes(raw.returnBytes)}
          theme={theme}
        />
      )}
    </View>
  );
}

// Functions Tab - Shows function call tree
function FunctionsTab({
  log,
  allLogs,
  theme,
}: {
  log: LogEntry;
  allLogs: LogEntry[];
  theme: any;
}) {
  const raw = log.raw || {};
  const currentExecutionId = raw.executionId || log.function?.request_id || "";

  return (
    <View style={styles.tabContent}>
      <FunctionCallTree
        logs={allLogs}
        currentExecutionId={currentExecutionId}
        theme={theme}
      />
    </View>
  );
}

// Logs Tab - Shows log messages
function LogsTab({ log, theme }: { log: LogEntry; theme: any }) {
  return (
    <View style={styles.tabContent}>
      <View
        style={[
          styles.logBox,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text style={[styles.logText, { color: theme.colors.text }]}>
          {log.message || "No log message"}
        </Text>
      </View>
    </View>
  );
}

// Raw Tab - Shows raw JSON
function RawTab({ log, theme }: { log: LogEntry; theme: any }) {
  const rawJson = JSON.stringify(log.raw || log, null, 2);

  return (
    <View style={styles.tabContent}>
      <ScrollView
        horizontal
        style={[
          styles.rawContainer,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <JsonSyntaxHighlighter json={rawJson} theme={theme} />
      </ScrollView>
    </View>
  );
}

// Info Row Component with optional copy
function InfoRow({
  label,
  value,
  theme,
  mono = false,
  onCopy,
}: {
  label: string;
  value?: string;
  theme: any;
  mono?: boolean;
  onCopy?: (text: string) => void;
}) {
  if (!value) return null;

  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
        {label}
      </Text>
      <View style={styles.infoValueRow}>
        <Text
          style={[
            styles.infoValue,
            { color: theme.colors.text },
            mono && styles.mono,
          ]}
          numberOfLines={2}
        >
          {value}
        </Text>
        {onCopy && (
          <TouchableOpacity
            style={styles.copyBtn}
            onPress={() => onCopy(value)}
            activeOpacity={0.7}
          >
            <Icon name="copy" size={12} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerSubtitle: {
    fontSize: 12,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    alignItems: "center",
  },
  functionType: {
    fontSize: 12,
    fontWeight: "500",
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexWrap: "wrap",
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  tabContent: {
    gap: 16,
  },
  // Status row
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  durationSmall: {
    fontSize: 12,
  },
  // Error box
  errorBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
  },
  // Grid layout
  gridRow: {
    flexDirection: "row",
    gap: 16,
  },
  gridCell: {
    flex: 1,
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: "500",
    marginBottom: 4,
  },
  gridValue: {
    fontSize: 13,
  },
  // Section
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  // Usage stats grid
  usageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  usageCard: {
    width: "48%",
    padding: 10,
    borderRadius: 8,
  },
  usageCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  usageLabel: {
    fontSize: 10,
  },
  usageValue: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
  },
  usageSubValue: {
    fontSize: 10,
    marginTop: 2,
  },
  // Info row
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: "500",
    width: 100,
    flexShrink: 0,
  },
  infoValueRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },
  infoValue: {
    fontSize: 13,
    textAlign: "right",
    flex: 1,
  },
  mono: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
  },
  copyBtn: {
    padding: 4,
  },
  // Log box
  logBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  logText: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
  },
  // Raw container
  rawContainer: {
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    maxHeight: 400,
  },
  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: "500",
    opacity: 0.5,
  },
});
