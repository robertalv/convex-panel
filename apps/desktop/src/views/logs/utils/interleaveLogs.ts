/**
 * Interleaved Logs Utility
 * Merges execution logs and deployment events in chronological order
 * Based on dashboard-common's interleaveLogs
 */

import type { LogEntry } from "../types";
import type { DeploymentAuditLogEvent } from "../hooks/useDeploymentAuditLogs";

/**
 * Combined log type that can be either an execution log or deployment event
 */
export type InterleavedLog =
  | { kind: "ExecutionLog"; executionLog: LogEntry }
  | { kind: "DeploymentEvent"; deploymentEvent: DeploymentAuditLogEvent };

/**
 * Interleaves execution logs and deployment events by timestamp
 * @param executionLogs - Array of execution logs
 * @param deploymentEvents - Array of deployment events
 * @returns Array of interleaved logs sorted by timestamp (newest first)
 */
export function interleaveLogs(
  executionLogs: LogEntry[],
  deploymentEvents: DeploymentAuditLogEvent[],
): InterleavedLog[] {
  const result: InterleavedLog[] = [];
  const seenLogIds = new Set<string>();
  const seenEventIds = new Set<string>();

  // Convert logs to interleaved format with deduplication
  for (const log of executionLogs) {
    if (seenLogIds.has(log.id)) {
      console.warn(`[interleaveLogs] Skipping duplicate log ID: ${log.id}`);
      continue;
    }
    seenLogIds.add(log.id);
    result.push({
      kind: "ExecutionLog",
      executionLog: log,
    });
  }

  // Convert events to interleaved format with deduplication
  for (const event of deploymentEvents) {
    if (seenEventIds.has(event._id)) {
      console.warn(
        `[interleaveLogs] Skipping duplicate event ID: ${event._id}`,
      );
      continue;
    }
    seenEventIds.add(event._id);
    result.push({
      kind: "DeploymentEvent",
      deploymentEvent: event,
    });
  }

  // Sort by timestamp (newest first)
  result.sort((a, b) => {
    const aTime =
      a.kind === "ExecutionLog"
        ? a.executionLog.timestamp
        : a.deploymentEvent._creationTime;
    const bTime =
      b.kind === "ExecutionLog"
        ? b.executionLog.timestamp
        : b.deploymentEvent._creationTime;
    return bTime - aTime; // Descending order (newest first)
  });

  return result;
}

/**
 * Gets the timestamp from an interleaved log
 * @param log - The interleaved log entry
 * @returns The timestamp in milliseconds
 */
export function getInterleavedLogTimestamp(log: InterleavedLog): number {
  return log.kind === "ExecutionLog"
    ? log.executionLog.timestamp
    : log.deploymentEvent._creationTime;
}

/**
 * Gets a unique key for an interleaved log (for React keys)
 * @param log - The interleaved log entry
 * @returns A unique string key
 */
export function getInterleavedLogKey(log: InterleavedLog): string {
  return log.kind === "ExecutionLog"
    ? `log-${log.executionLog.id}`
    : `event-${log.deploymentEvent._id}`;
}
