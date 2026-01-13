/**
 * useDeploymentAuditLogs Hook
 * Fetches and processes deployment audit log events
 * Based on dashboard-common's useDeploymentAuditLog
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type { ConvexReactClient } from "convex/react";

export interface DeploymentAuditLogEvent {
  _id: string;
  _creationTime: number;
  member_id: bigint | null;
  memberName: string;
  action: DeploymentAction;
  metadata?: Record<string, any>;
}

export type DeploymentAction =
  | "create_environment_variable"
  | "update_environment_variable"
  | "delete_environment_variable"
  | "replace_environment_variable"
  | "update_canonical_url"
  | "delete_canonical_url"
  | "push_config"
  | "push_config_with_components"
  | "change_deployment_state"
  | "build_indexes"
  | "clear_tables"
  | "snapshot_import";

const VALID_ACTIONS: DeploymentAction[] = [
  "create_environment_variable",
  "update_environment_variable",
  "delete_environment_variable",
  "replace_environment_variable",
  "update_canonical_url",
  "delete_canonical_url",
  "push_config",
  "push_config_with_components",
  "change_deployment_state",
  "build_indexes",
  "clear_tables",
  "snapshot_import",
];

interface UseDeploymentAuditLogsOptions {
  adminClient: ConvexReactClient | null;
  fromTimestamp?: number;
  enabled?: boolean;
}

function getMemberName(event: any): string {
  if (event.member_id === null || event.member_id === undefined) {
    return "Convex";
  }
  // For now, we don't have team member data, so just return "Team Member"
  // This can be enhanced later with actual team member lookup
  return "Team Member";
}

function processDeploymentAuditLogEvent(
  event: any,
): DeploymentAuditLogEvent | null {
  if (!VALID_ACTIONS.includes(event.action)) {
    return null;
  }

  return {
    _id: event._id,
    _creationTime: event._creationTime,
    member_id: event.member_id,
    memberName: getMemberName(event),
    action: event.action,
    metadata: event.metadata,
  };
}

export function useDeploymentAuditLogs({
  adminClient,
  fromTimestamp = 0,
  enabled = true,
}: UseDeploymentAuditLogsOptions) {
  const [events, setEvents] = useState<DeploymentAuditLogEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);

  const fetchEvents = useCallback(async () => {
    if (!adminClient || !enabled) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Query the _deployment_audit_log system table
      const result = await adminClient.query(
        "_system/frontend/listDeploymentEventsFromTime" as any,
        {
          fromTimestamp,
        },
      );

      if (!isMountedRef.current) return;

      const rawEvents = (result || []) as any[];
      const processedEvents = rawEvents
        .map(processDeploymentAuditLogEvent)
        .filter((e): e is DeploymentAuditLogEvent => e !== null)
        .filter((e) => e.action !== "build_indexes") // Filter out redundant build_indexes
        .reverse(); // Most recent first

      setEvents(processedEvents);
    } catch (err) {
      if (!isMountedRef.current) return;
      console.error("Failed to fetch deployment audit logs:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to fetch audit logs"),
      );
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [adminClient, fromTimestamp, enabled]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchEvents();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchEvents]);

  // Poll for new events every 5 seconds
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      fetchEvents();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchEvents, enabled]);

  return {
    events,
    isLoading,
    error,
    refetch: fetchEvents,
  };
}
