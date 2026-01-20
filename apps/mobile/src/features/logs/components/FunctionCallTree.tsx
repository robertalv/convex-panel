/**
 * FunctionCallTree Component
 * Displays a hierarchical tree of function calls for a request
 * Based on desktop's FunctionCallTree
 */

import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { Icon } from "../../../components/ui/Icon";
import type { LogEntry } from "../../../api/logs";

interface ExecutionNode {
  executionId: string;
  functionName: string;
  startTime: number;
  durationMs?: number;
  status: "success" | "failure" | "running";
  parentExecutionId?: string | null;
  children: ExecutionNode[];
  error?: string;
  udfType: string;
}

interface FunctionCallTreeProps {
  logs: LogEntry[];
  currentExecutionId: string;
  theme: any;
}

// Helper to format duration
function formatDuration(ms: number | undefined): string {
  if (ms === undefined) return "-";
  if (ms < 1) return "<1ms";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function buildExecutionTree(logs: LogEntry[]): ExecutionNode[] {
  const nodeMap = new Map<string, ExecutionNode>();
  const rootNodes: ExecutionNode[] = [];

  // Create nodes for all logs
  logs.forEach((log) => {
    const raw = log.raw || {};
    const executionId = raw.executionId || log.function?.request_id || "";

    if (!executionId) return;

    const node: ExecutionNode = {
      executionId,
      functionName: log.function?.path || raw.identifier || "Unknown",
      startTime: new Date(log.timestamp).getTime(),
      durationMs: log.execution_time_ms,
      status:
        log.status === "error" || log.status === "failure"
          ? "failure"
          : log.status === "success" || raw.success
            ? "success"
            : "running",
      parentExecutionId: raw.parentExecutionId,
      children: [],
      error: log.error_message,
      udfType: log.function?.type || raw.udfType || "unknown",
    };
    nodeMap.set(executionId, node);
  });

  // Build tree hierarchy
  nodeMap.forEach((node) => {
    if (!node.parentExecutionId) {
      rootNodes.push(node);
    } else {
      const parent = nodeMap.get(node.parentExecutionId);
      if (parent) {
        parent.children.push(node);
      } else {
        // Orphaned node - add to root
        rootNodes.push(node);
      }
    }
  });

  // Sort by startTime
  const sortNodes = (nodes: ExecutionNode[]) => {
    nodes.sort((a, b) => a.startTime - b.startTime);
    nodes.forEach((node) => sortNodes(node.children));
  };
  sortNodes(rootNodes);

  return rootNodes;
}

function ExecutionTreeNode({
  node,
  level = 0,
  isCurrentLog,
  theme,
}: {
  node: ExecutionNode;
  level?: number;
  isCurrentLog: boolean;
  theme: any;
}) {
  const getStatusIcon = () => {
    if (node.status === "success") return "check-circle";
    if (node.status === "failure") return "x-circle";
    return "loader";
  };

  const getStatusColor = () => {
    if (node.status === "success") return theme.colors.success;
    if (node.status === "failure") return theme.colors.error;
    return theme.colors.textSecondary;
  };

  const getTypeBadge = (type: string) => {
    const t = type?.toLowerCase() || "";
    if (t === "query") return "Q";
    if (t === "mutation") return "M";
    if (t === "action") return "A";
    if (t === "httpaction" || t === "http") return "H";
    return t.charAt(0).toUpperCase();
  };

  const getTypeColor = (type: string) => {
    const t = type?.toLowerCase() || "";
    if (t === "query") return "#3b82f6"; // blue
    if (t === "mutation") return "#8b5cf6"; // purple
    if (t === "action") return "#f59e0b"; // amber
    return theme.colors.textSecondary;
  };

  return (
    <View>
      <View
        style={[
          styles.nodeRow,
          {
            paddingLeft: 12 + level * 20,
            backgroundColor: isCurrentLog
              ? theme.colors.primary + "15"
              : "transparent",
          },
        ]}
      >
        <Icon name={getStatusIcon()} size={14} color={getStatusColor()} />

        <View
          style={[
            styles.typeBadge,
            { backgroundColor: getTypeColor(node.udfType) + "20" },
          ]}
        >
          <Text
            style={[
              styles.typeBadgeText,
              { color: getTypeColor(node.udfType) },
            ]}
          >
            {getTypeBadge(node.udfType)}
          </Text>
        </View>

        <Text
          style={[styles.functionName, { color: theme.colors.text }]}
          numberOfLines={1}
        >
          {node.functionName}
        </Text>

        {node.durationMs !== undefined && (
          <Text
            style={[styles.duration, { color: theme.colors.textSecondary }]}
          >
            ({formatDuration(node.durationMs)})
          </Text>
        )}

        {isCurrentLog && (
          <Text
            style={[styles.currentIndicator, { color: theme.colors.primary }]}
          >
            ↑
          </Text>
        )}
      </View>

      {node.children.map((child) => (
        <ExecutionTreeNode
          key={child.executionId}
          node={child}
          level={level + 1}
          isCurrentLog={false}
          theme={theme}
        />
      ))}
    </View>
  );
}

export function FunctionCallTree({
  logs,
  currentExecutionId,
  theme,
}: FunctionCallTreeProps) {
  const tree = buildExecutionTree(logs);

  if (tree.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          No function calls found
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
        This is an outline of the functions called in this request.
      </Text>
      {tree.map((node) => (
        <ExecutionTreeNode
          key={node.executionId}
          node={node}
          level={0}
          isCurrentLog={node.executionId === currentExecutionId}
          theme={theme}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  description: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
  nodeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingRight: 12,
    borderRadius: 6,
  },
  typeBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  functionName: {
    fontSize: 12,
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
    flex: 1,
  },
  duration: {
    fontSize: 11,
  },
  currentIndicator: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
  },
});
