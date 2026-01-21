/**
 * Hook for fetching deployment markers to display on health charts
 * Shows when code was deployed as vertical markers on the timeline
 */
import { useMemo } from "react";
import { format } from "date-fns";
import { useDeployment } from "@/contexts/deployment-context";
import { useDeploymentAuditLogs } from "../../logs/hooks/useDeploymentAuditLogs";
import { useTeamMembers } from "@/views/logs/hooks/useTeamMembers";
import type { DeploymentMarker } from "../types";

/**
 * Fetch deployment events from the last hour and format them as chart markers
 */
export function useDeploymentMarkers(): DeploymentMarker[] | undefined {
  const { adminClient, teamId, accessToken } = useDeployment();
  const { members } = useTeamMembers({
    accessToken,
    teamId,
    enabled: Boolean(teamId && accessToken),
  });

  const startDate = useMemo(() => Date.now() - 3600 * 1000, []);

  const { events, isLoading } = useDeploymentAuditLogs({
    adminClient,
    fromTimestamp: startDate,
    enabled: Boolean(adminClient),
    teamMembers: members,
  });

  const markers = useMemo(() => {
    if (!events || isLoading) {
      return undefined;
    }

    const deploymentEvents = events.filter(
      (event) =>
        event.action === "push_config" ||
        event.action === "push_config_with_components",
    );

    return deploymentEvents.map((event) => ({
      time: format(new Date(event._creationTime), "h:mm a"),
      timestamp: event._creationTime,
    }));
  }, [events, isLoading]);

  return markers;
}
