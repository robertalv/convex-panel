/**
 * LogDetailSheet - Bottom sheet showing detailed log information  
 * Modern design with tabs for Execution, Request, Logs, and Raw data
 */

import React, { useState, useMemo } from "react";
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
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import * as Clipboard from "expo-clipboard";
import { useTheme } from "../../../contexts/ThemeContext";
import { Icon } from "../../../components/ui/Icon";
import { StatusBadge } from "./StatusBadge";
import { JsonSyntaxHighlighter } from "./JsonSyntaxHighlighter";
import type { LogEntry } from "../../../api/logs";

export interface LogDetailSheetProps {
  sheetRef: React.RefObject<BottomSheet>;
  log: LogEntry | null;
  onClose: () => void;
}

type TabType = "execution" | "request" | "logs" | "raw";

export function LogDetailSheet({
  sheetRef,
  log,
  onClose,
}: LogDetailSheetProps) {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>("execution");

  const snapPoints = useMemo(() => ["75%", "90%"], []);

  const isError = log?.status === "error" || log?.status === "failure";

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

  // Copy execution details
  const handleCopyExecutionDetails = async () => {
    if (!log) return;

    const text = `Function: ${log.function?.path || "N/A"}
Type: ${log.function?.type || "N/A"}
Status: ${log.status || "success"}
Cached: ${log.function?.cached ? "Yes" : "No"}
Execution Time: ${log.execution_time_ms !== undefined ? `${log.execution_time_ms.toFixed(2)}ms` : "N/A"}
Timestamp: ${new Date(log.timestamp).toLocaleString()}${log.error_message ? `\nError: ${log.error_message}` : ""}`;

    try {
      await Clipboard.setStringAsync(text);
      Alert.alert("Copied", "Execution details copied to clipboard");
    } catch (error) {
      Alert.alert("Error", "Failed to copy to clipboard");
    }
  };

  const handleClose = () => {
    sheetRef.current?.close();
  };

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={{ backgroundColor: theme.colors.surface }}
      handleIndicatorStyle={{ backgroundColor: theme.colors.border }}
    >
      {/* Header */}
      <View
        style={[
          styles.headerContainer,
          {
            borderBottomColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <Icon name="share" size={16} color={theme.colors.primary} />
            <Text
              style={[styles.headerButtonText, { color: theme.colors.primary }]}
            >
              Share
            </Text>
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Log Details
          </Text>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.headerCloseText,
                { color: theme.colors.textSecondary },
              ]}
            >
              Close
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View
        style={[
          styles.tabsContainer,
          {
            borderBottomColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
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
      <BottomSheetScrollView
        style={[styles.content, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.contentContainer}
      >
        {log ? (
          <>
            {activeTab === "execution" && <ExecutionTab log={log} theme={theme} />}
            {activeTab === "request" && <RequestTab log={log} theme={theme} />}
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
      </BottomSheetScrollView>

      {/* Footer with Copy Button */}
      {log && (
        <View
          style={[
            styles.footer,
            {
              borderTopColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.copyButton, { backgroundColor: theme.colors.text }]}
            onPress={handleCopyExecutionDetails}
            activeOpacity={0.8}
          >
            <Icon name="copy" size={18} color={theme.colors.background} />
            <Text
              style={[
                styles.copyButtonText,
                { color: theme.colors.background },
              ]}
            >
              Copy Execution Details
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </BottomSheet>
  );
}

// Tab Button Component
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
    <TouchableOpacity style={styles.tab} onPress={onPress} activeOpacity={0.6}>
      <Text
        style={[
          styles.tabText,
          {
            color: isActive ? theme.colors.text : theme.colors.textSecondary,
            fontWeight: isActive ? "600" : "500",
          },
        ]}
      >
        {label}
      </Text>
      {isActive && (
        <View
          style={[
            styles.tabIndicator,
            { backgroundColor: theme.colors.primary },
          ]}
        />
      )}
    </TouchableOpacity>
  );
}

// Execution Tab - Shows timing and performance metrics
function ExecutionTab({ log, theme }: { log: LogEntry; theme: any }) {
  const isError = log.status === "error" || log.status === "failure";

  const getStatusIconColor = () => {
    if (log.status === "success") return theme.colors.success;
    if (isError) return theme.colors.error;
    return theme.colors.warning;
  };

  const getStatusBgColor = () => {
    if (log.status === "success") return theme.colors.success + "30";
    if (isError) return theme.colors.error + "30";
    return theme.colors.warning + "30";
  };

  return (
    <View style={styles.tabContent}>
      {/* Summary Card */}
      <View
        style={[
          styles.summaryCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.summaryRow}>
          <View style={styles.summaryLeft}>
            <View
              style={[
                styles.statusIconContainer,
                { backgroundColor: getStatusBgColor() },
              ]}
            >
              <Icon
                name="activity"
                size={20}
                color={getStatusIconColor()}
              />
            </View>
            <View>
              <Text
                style={[
                  styles.summaryLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                STATUS
              </Text>
              <View style={styles.statusBadgeContainer}>
                <StatusBadge status={log.status || "success"} />
              </View>
            </View>
          </View>
          <View style={styles.summaryRight}>
            <Text
              style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}
            >
              DURATION
            </Text>
            <Text style={[styles.durationText, { color: theme.colors.text }]}>
              {log.execution_time_ms !== undefined
                ? `${Math.round(log.execution_time_ms)}ms`
                : "N/A"}
            </Text>
          </View>
        </View>
      </View>

      {/* Function Details */}
      <View>
        <Text
          style={[styles.sectionHeader, { color: theme.colors.textSecondary }]}
        >
          FUNCTION DETAILS
        </Text>
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: theme.colors.surface + "66",
              borderColor: theme.colors.border,
            },
          ]}
        >
          <InfoRow
            label="Path"
            value={log.function?.path || "N/A"}
            theme={theme}
            mono
          />
          <InfoRow
            label="Type"
            value={log.function?.type || "N/A"}
            theme={theme}
          />
          <InfoRow
            label="Cached"
            value={log.function?.cached ? "Yes" : "No"}
            theme={theme}
            highlight={log.function?.cached}
          />
        </View>
      </View>

      {/* Timing & Metadata */}
      <View>
        <Text
          style={[styles.sectionHeader, { color: theme.colors.textSecondary }]}
        >
          TIMING & METADATA
        </Text>
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: theme.colors.surface + "66",
              borderColor: theme.colors.border,
            },
          ]}
        >
          <InfoRow
            label="Request ID"
            value={log.function?.request_id || "N/A"}
            theme={theme}
            mono
          />
          <InfoRow
            label="Timestamp"
            value={new Date(log.timestamp).toLocaleString()}
            theme={theme}
          />
        </View>
      </View>

      {/* Error Section */}
      {log.error_message && (
        <View>
          <Text
            style={[
              styles.sectionHeader,
              { color: theme.colors.textSecondary },
            ]}
          >
            ERROR
          </Text>
          <View
            style={[
              styles.errorCard,
              {
                backgroundColor: theme.colors.error + "20",
                borderColor: theme.colors.error + "40",
                borderLeftColor: theme.colors.error,
              },
            ]}
          >
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {log.error_message}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

// Request Tab - Shows request metadata
function RequestTab({ log, theme }: { log: LogEntry; theme: any }) {
  return (
    <View style={styles.tabContent}>
      <View>
        <Text
          style={[styles.sectionHeader, { color: theme.colors.textSecondary }]}
        >
          REQUEST INFORMATION
        </Text>
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: theme.colors.surface + "66",
              borderColor: theme.colors.border,
            },
          ]}
        >
          <InfoRow
            label="Request ID"
            value={log.function?.request_id || "N/A"}
            theme={theme}
            mono
          />
          <InfoRow label="Topic" value={log.topic || "N/A"} theme={theme} />
          <InfoRow
            label="Log Level"
            value={log.log_level || "INFO"}
            theme={theme}
          />
        </View>
      </View>
    </View>
  );
}

// Logs Tab - Shows log messages
function LogsTab({ log, theme }: { log: LogEntry; theme: any }) {
  return (
    <View style={styles.tabContent}>
      <View>
        <Text
          style={[styles.sectionHeader, { color: theme.colors.textSecondary }]}
        >
          LOG OUTPUT
        </Text>
        <View
          style={[
            styles.logCard,
            {
              backgroundColor: theme.colors.surface + "66",
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.logText, { color: theme.colors.text }]}>
            {log.message || "No log message"}
          </Text>
        </View>
      </View>
    </View>
  );
}

// Raw Tab - Shows raw JSON
function RawTab({ log, theme }: { log: LogEntry; theme: any }) {
  const rawJson = JSON.stringify(log.raw || log, null, 2);

  return (
    <View style={styles.tabContent}>
      <View>
        <Text
          style={[styles.sectionHeader, { color: theme.colors.textSecondary }]}
        >
          RAW JSON
        </Text>
        <ScrollView
          horizontal
          style={[
            styles.rawContainer,
            {
              backgroundColor: theme.colors.surface + "66",
              borderColor: theme.colors.border,
            },
          ]}
        >
          <JsonSyntaxHighlighter json={rawJson} theme={theme} />
        </ScrollView>
      </View>
    </View>
  );
}

// Info Row Component
function InfoRow({
  label,
  value,
  theme,
  mono = false,
  highlight = false,
}: {
  label: string;
  value: string;
  theme: any;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <View style={[styles.infoRow, { borderBottomColor: theme.colors.border }]}>
      <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
        {label}
      </Text>
      <Text
        style={[
          styles.infoValue,
          { color: highlight ? theme.colors.text : theme.colors.textSecondary },
          mono && styles.infoValueMono,
          highlight && styles.infoValueHighlight,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  headerCloseText: {
    fontSize: 14,
    fontWeight: "600",
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingTop: 8,
    gap: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    paddingBottom: 12,
    position: "relative",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  tabContent: {
    gap: 24,
  },
  summaryCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statusIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 4,
  },
  statusBadgeContainer: {
    marginTop: 2,
  },
  summaryRight: {
    alignItems: "flex-end",
  },
  durationText: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  infoCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
  },
  infoValueMono: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
  },
  infoValueHighlight: {
    fontWeight: "700",
  },
  errorCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    borderLeftWidth: 4,
  },
  errorText: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
  },
  logCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  logText: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
  },
  rawContainer: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    maxHeight: 400,
  },
  footer: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  copyButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "600",
    opacity: 0.5,
  },
});
