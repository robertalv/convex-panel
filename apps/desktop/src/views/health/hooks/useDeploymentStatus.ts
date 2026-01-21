import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { desktopFetch } from "@/utils/desktop";
import { useDeployment } from "@/contexts/deployment-context";
import { STALE_TIME, REFETCH_INTERVAL } from "@/contexts/query-context";
import { useVisibilityRefetch } from "@/hooks/useVisibilityRefetch";
import {
  callConvexQuery,
  SYSTEM_QUERIES,
} from "@convex-panel/shared/api";

interface DeploymentStatus {
  state: "running" | "paused" | "unknown";
  stateLoading: boolean;
  stateError: string | null;
  version: string | null;
  versionLoading: boolean;
  versionError: string | null;
  hasUpdate: boolean;
  latestVersion: string | null;
  lastPush: Date | null;
  lastPushLoading: boolean;
  lastPushError: string | null;
  isLoading: boolean;
  hasError: boolean;
  refetch: () => void;
  refetchState: () => void;
  refetchVersion: () => void;
  refetchLastPush: () => void;
}

export const deploymentStatusKeys = {
  all: ["deploymentStatus"] as const,
  state: (deploymentUrl: string) =>
    [...deploymentStatusKeys.all, "state", deploymentUrl] as const,
  version: (deploymentUrl: string) =>
    [...deploymentStatusKeys.all, "version", deploymentUrl] as const,
  lastPush: (deploymentUrl: string) =>
    [...deploymentStatusKeys.all, "lastPush", deploymentUrl] as const,
};

/**
 * Hook for fetching deployment status information.
 * Includes deployment state (running/paused), version, and last push event.
 * Uses React Query for caching and automatic refetching.
 */
export function useDeploymentStatus(): DeploymentStatus {
  const { deploymentUrl, authToken } = useDeployment();
  const queryClient = useQueryClient();
  
  const refetchInterval = useVisibilityRefetch(REFETCH_INTERVAL.health);

  const enabled = Boolean(deploymentUrl && authToken);

  const stateQuery = useQuery({
    queryKey: deploymentStatusKeys.state(deploymentUrl ?? ""),
    queryFn: async () => {
      const result = (await callConvexQuery(
        deploymentUrl!,
        authToken!,
        SYSTEM_QUERIES.DEPLOYMENT_STATE,
        {},
        desktopFetch,
      )) as { state: "running" | "paused" } | null;

      return result?.state ?? "unknown";
    },
    enabled,
    staleTime: STALE_TIME.health,
    refetchInterval,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const versionQuery = useQuery({
    queryKey: deploymentStatusKeys.version(deploymentUrl ?? ""),
    queryFn: async () => {
      const result = (await callConvexQuery(
        deploymentUrl!,
        authToken!,
        SYSTEM_QUERIES.GET_VERSION,
        {},
        desktopFetch,
      )) as string | null;

      return result || null;
    },
    enabled,
    staleTime: STALE_TIME.health,
    refetchOnMount: false,
  });

  const lastPushQuery = useQuery({
    queryKey: deploymentStatusKeys.lastPush(deploymentUrl ?? ""),
    queryFn: async () => {
      const result = (await callConvexQuery(
        deploymentUrl!,
        authToken!,
        SYSTEM_QUERIES.LAST_PUSH_EVENT,
        {},
        desktopFetch,
      )) as { _creationTime?: number } | null;

      if (result && result._creationTime) {
        return new Date(result._creationTime);
      }
      return null;
    },
    enabled,
    staleTime: STALE_TIME.health,
    refetchInterval,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const version = versionQuery.data ?? null;

  const [hasUpdate, setHasUpdate] = useState(false);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);

  useEffect(() => {
    if (!version) {
      setHasUpdate(false);
      setLatestVersion(null);
      return;
    }

    let isMounted = true;

    async function checkNpmVersion() {
      try {
        const response = await desktopFetch(
          "https://registry.npmjs.org/convex/latest",
          {},
        );
        if (!response.ok) return;

        const data = await response.json();
        if (!isMounted) return;

        setLatestVersion(data.version);

        if (version && data.version) {
          const currentParts = version.split(".").map(Number);
          const latestParts = data.version.split(".").map(Number);

          if (currentParts.length === 3 && latestParts.length === 3) {
            const isHigherMajor = latestParts[0] > currentParts[0];
            const isHigherMinor =
              latestParts[0] === currentParts[0] &&
              latestParts[1] > currentParts[1];
            const hasNewVersion = isHigherMajor || isHigherMinor;
            setHasUpdate(hasNewVersion);
          }
        }
      } catch {
        // Swallow errors - npm check is not critical
      }
    }

    void checkNpmVersion();

    return () => {
      isMounted = false;
    };
  }, [version]);

  const refetchState = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: deploymentStatusKeys.state(deploymentUrl ?? ""),
    });
  }, [queryClient, deploymentUrl]);

  const refetchVersion = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: deploymentStatusKeys.version(deploymentUrl ?? ""),
    });
  }, [queryClient, deploymentUrl]);

  const refetchLastPush = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: deploymentStatusKeys.lastPush(deploymentUrl ?? ""),
    });
  }, [queryClient, deploymentUrl]);

  const refetch = useCallback(() => {
    refetchState();
    refetchVersion();
    refetchLastPush();
  }, [refetchState, refetchVersion, refetchLastPush]);

  const isLoading =
    stateQuery.isLoading || versionQuery.isLoading || lastPushQuery.isLoading;

  const hasError = Boolean(
    stateQuery.error || versionQuery.error || lastPushQuery.error,
  );

  return {
    state: stateQuery.data ?? "unknown",
    stateLoading: stateQuery.isLoading,
    stateError: stateQuery.error?.message ?? null,
    version,
    versionLoading: versionQuery.isLoading,
    versionError: versionQuery.error?.message ?? null,
    hasUpdate,
    latestVersion,
    lastPush: lastPushQuery.data ?? null,
    lastPushLoading: lastPushQuery.isLoading,
    lastPushError: lastPushQuery.error?.message ?? null,
    isLoading,
    hasError,
    refetch,
    refetchState,
    refetchVersion,
    refetchLastPush,
  };
}
