/**
 * FunctionCallTree Component
 * Displays a hierarchical tree of function calls for a request
 * Based on dashboard-common's FunctionCallTree
 */

import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import type { LogEntry } from "../types";
import { formatDuration } from "../utils/formatters";
import { cn } from "@/lib/utils";

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
}

function buildExecutionTree(logs: LogEntry[]): ExecutionNode[] {
  const nodeMap = new Map<string, ExecutionNode>();
  const rootNodes: ExecutionNode[] = [];

  // Create nodes for all logs
  logs.forEach((log) => {
    const node: ExecutionNode = {
      executionId: log.executionId,
      functionName: log.functionName || "Unknown",
      startTime: log.startedAt,
      durationMs: log.durationMs,
      status: log.error ? "failure" : log.success ? "success" : "running",
      parentExecutionId: log.parentExecutionId,
      children: [],
      error: log.error,
      udfType: log.udfType,
    };
    nodeMap.set(log.executionId, node);
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
}: {
  node: ExecutionNode;
  level?: number;
  isCurrentLog: boolean;
}) {
  const StatusIcon =
    node.status === "success"
      ? CheckCircle2
      : node.status === "failure"
        ? XCircle
        : Loader2;

  const statusColor =
    node.status === "success"
      ? "var(--color-success-base)"
      : node.status === "failure"
        ? "rgb(239, 68, 68)"
        : "var(--color-text-muted)";

  const udfTypeLabel =
    node.udfType === "query"
      ? "Q"
      : node.udfType === "mutation"
        ? "M"
        : node.udfType === "action"
          ? "A"
          : "H";

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded text-xs font-mono transition-colors",
          isCurrentLog && "bg-[var(--color-brand-muted)]",
        )}
        style={{
          paddingLeft: `${12 + level * 24}px`,
          backgroundColor: isCurrentLog
            ? "var(--color-brand-muted)"
            : "transparent",
        }}
      >
        <StatusIcon
          size={14}
          style={{ color: statusColor }}
          className={node.status === "running" ? "animate-spin" : ""}
        />
        <span
          className="shrink-0 text-[10px] font-bold px-1 rounded"
          style={{
            backgroundColor: "var(--color-surface-raised)",
            color: "var(--color-text-muted)",
          }}
        >
          {udfTypeLabel}
        </span>
        <span style={{ color: "var(--color-text-base)" }}>
          {node.functionName}
        </span>
        {node.durationMs !== undefined && (
          <span style={{ color: "var(--color-text-muted)" }}>
            ({formatDuration(node.durationMs)})
          </span>
        )}
        {isCurrentLog && (
          <span
            style={{
              color: "var(--color-brand-base)",
              marginLeft: "auto",
            }}
          >
            📍
          </span>
        )}
      </div>

      {node.children.map((child) => (
        <ExecutionTreeNode
          key={child.executionId}
          node={child}
          level={level + 1}
          isCurrentLog={false}
        />
      ))}
    </div>
  );
}

export function FunctionCallTree({
  logs,
  currentExecutionId,
}: FunctionCallTreeProps) {
  const tree = buildExecutionTree(logs);

  if (tree.length === 0) {
    return (
      <div
        className="text-sm text-center py-8"
        style={{ color: "var(--color-text-muted)" }}
      >
        No function calls found
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div
        className="text-xs px-3 py-2 mb-2"
        style={{ color: "var(--color-text-muted)" }}
      >
        This is an outline of the functions called in this request.
      </div>
      {tree.map((node) => (
        <ExecutionTreeNode
          key={node.executionId}
          node={node}
          level={0}
          isCurrentLog={node.executionId === currentExecutionId}
        />
      ))}
    </div>
  );
}
