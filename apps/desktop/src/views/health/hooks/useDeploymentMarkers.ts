/**
 * Hook for fetching deployment markers to display on health charts
 * Shows when code was deployed as vertical markers on the timeline
 *
 * Network calls are optimized with three-layer control:
 * 1. Route awareness - Only fetches when on /health route
 * 2. Idle detection - Pauses after 1 minute of user inactivity
 * 3. Visibility - Pauses when browser tab is hidden
 */
import { useMemo } from "react";
import { format } from "date-fns";
import { useDeployment } from "@/contexts/deployment-context";
import { useDeploymentAuditLogs } from "../../logs/hooks/useDeploymentAuditLogs";
import { useTeamMembers } from "@/views/logs/hooks/useTeamMembers";
import { useFetchingEnabled } from "@/hooks/useCombinedFetchingControl";
import type { DeploymentMarker } from "../types";

/**
 * Fetch deployment events from the last hour and format them as chart markers
 */
export function useDeploymentMarkers(): DeploymentMarker[] | undefined {
  const { adminClient, teamId, accessToken } = useDeployment();

  // Only fetch when on health route and user is active
  const isEnabled = useFetchingEnabled("/health");

  const { members } = useTeamMembers({
    accessToken,
    teamId,
    enabled: Boolean(teamId && accessToken) && isEnabled,
  });

  const startDate = useMemo(() => Date.now() - 3600 * 1000, []);

  const { events, isLoading } = useDeploymentAuditLogs({
    adminClient,
    fromTimestamp: startDate,
    enabled: Boolean(adminClient) && isEnabled,
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
