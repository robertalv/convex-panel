/**
 * Interleaved Logs Utility
 * Merges execution logs and deployment events in chronological order
 * Ported from dashboard-common to match production behavior exactly
 */

import type { LogEntry } from "../types";
import type { DeploymentAuditLogEvent } from "../hooks/useDeploymentAuditLogs";

/**
 * Combined log type that can be an execution log, deployment event, or cleared logs marker
 */
export type InterleavedLog =
  | {
      kind: "ExecutionLog";
      executionLog: LogEntry;
    }
  | {
      kind: "DeploymentEvent";
      deploymentEvent: DeploymentAuditLogEvent;
    }
  | {
      kind: "ClearedLogs";
      timestamp: number;
    };

/**
 * Get timestamp from InterleavedLog
 */
export function getTimestamp(log: InterleavedLog): number {
  if (!log) {
    return 0;
  }
  switch (log.kind) {
    case "ExecutionLog":
      return log.executionLog.timestamp;
    case "DeploymentEvent":
      return log.deploymentEvent._creationTime;
    case "ClearedLogs":
      return log.timestamp;
    default:
      return 0;
  }
}

/**
 * Get a unique key for an InterleavedLog for React rendering
 * Uses kind, timestamp, and id (if available) to ensure uniqueness
 */
export function getLogKey(log: InterleavedLog): string {
  if (!log) {
    return "";
  }
  const timestamp = getTimestamp(log);
  if (log.kind === "ExecutionLog") {
    return `${log.kind}-${timestamp}-${log.executionLog.id}`;
  }
  if (log.kind === "DeploymentEvent") {
    return `${log.kind}-${timestamp}-${log.deploymentEvent._id}`;
  }
  return `${log.kind}-${timestamp}`;
}

/**
 * Given two arrays of logs sorted from least recent to most recent, interleave
 * them based on time with support for cleared logs markers.
 *
 * @param executionLogs - Array of execution logs (LogEntry)
 * @param deploymentAuditLogEvents - Array of deployment events
 * @param clearedLogs - Array of timestamps marking when logs were cleared
 * @returns Array of interleaved logs
 */
export function interleaveLogs(
  executionLogs: LogEntry[],
  deploymentAuditLogEvents: DeploymentAuditLogEvent[],
  clearedLogs: number[],
): InterleavedLog[] {
  const result: InterleavedLog[] = [];

  const logIterator = executionLogs[Symbol.iterator]();
  const deploymentEventIterator = deploymentAuditLogEvents[Symbol.iterator]();
  const latestCleared =
    clearedLogs.length > 0 ? clearedLogs[clearedLogs.length - 1] : undefined;

  // Add cleared logs marker at the beginning if logs were cleared
  if (latestCleared !== undefined) {
    result.push({
      kind: "ClearedLogs",
      timestamp: latestCleared,
    });
  }

  let executionLog: LogEntry | undefined = logIterator.next().value;
  let deploymentEvent: DeploymentAuditLogEvent | undefined =
    deploymentEventIterator.next().value;

  // Interleave logs and events by timestamp, filtering out logs/events before the cleared timestamp
  while (executionLog !== undefined || deploymentEvent !== undefined) {
    if (
      executionLog &&
      (deploymentEvent === undefined ||
        executionLog.timestamp < deploymentEvent._creationTime)
    ) {
      // Only include logs after the cleared timestamp
      if (
        latestCleared === undefined ||
        executionLog.timestamp > latestCleared
      ) {
        result.push({ kind: "ExecutionLog", executionLog: executionLog });
      }
      executionLog = logIterator.next().value;
    } else if (deploymentEvent) {
      // Only include events after the cleared timestamp
      if (
        latestCleared === undefined ||
        deploymentEvent._creationTime > latestCleared
      ) {
        result.push({
          kind: "DeploymentEvent",
          deploymentEvent,
        });
      }
      deploymentEvent = deploymentEventIterator.next().value;
    }
  }
  return result;
}

// Legacy function names for backward compatibility
export const getInterleavedLogTimestamp = getTimestamp;
export const getInterleavedLogKey = getLogKey;
