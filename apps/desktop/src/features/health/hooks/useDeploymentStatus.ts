import { useState, useEffect, useCallback } from "react";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { useDeployment } from "@/contexts/DeploymentContext";
import {
  callConvexQuery,
  SYSTEM_QUERIES,
  type FetchFn,
} from "@convex-panel/shared/api";

// Use Tauri's fetch for CORS-free HTTP requests
const desktopFetch: FetchFn = (input, init) => tauriFetch(input, init);

interface DeploymentStatus {
  // Deployment state
  state: "running" | "paused" | "unknown";
  stateLoading: boolean;
  stateError: string | null;

  // Version info
  version: string | null;
  versionLoading: boolean;
  versionError: string | null;

  // NPM update info
  hasUpdate: boolean;
  latestVersion: string | null;

  // Last push event
  lastPush: Date | null;
  lastPushLoading: boolean;
  lastPushError: string | null;

  // Global state
  isLoading: boolean;
  hasError: boolean;

  // Actions
  refetch: () => void;
  refetchState: () => void;
  refetchVersion: () => void;
  refetchLastPush: () => void;
}

/**
 * Hook for fetching deployment status information.
 * Includes deployment state (running/paused), version, and last push event.
 * Uses real API data only - no mock data.
 */
export function useDeploymentStatus(): DeploymentStatus {
  const { deploymentUrl, authToken } = useDeployment();

  // Deployment state
  const [state, setState] = useState<"running" | "paused" | "unknown">(
    "unknown",
  );
  const [stateLoading, setStateLoading] = useState(true);
  const [stateError, setStateError] = useState<string | null>(null);

  // Version
  const [version, setVersion] = useState<string | null>(null);
  const [versionLoading, setVersionLoading] = useState(true);
  const [versionError, setVersionError] = useState<string | null>(null);

  // NPM update check
  const [hasUpdate, setHasUpdate] = useState(false);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);

  // Last push
  const [lastPush, setLastPush] = useState<Date | null>(null);
  const [lastPushLoading, setLastPushLoading] = useState(true);
  const [lastPushError, setLastPushError] = useState<string | null>(null);

  // Fetch deployment state
  const refetchState = useCallback(async () => {
    if (!deploymentUrl || !authToken) {
      setStateLoading(false);
      return;
    }

    setStateLoading(true);
    setStateError(null);

    try {
      const result = (await callConvexQuery(
        deploymentUrl,
        authToken,
        SYSTEM_QUERIES.DEPLOYMENT_STATE,
        {},
        desktopFetch,
      )) as { state: "running" | "paused" } | null;

      if (result && result.state) {
        setState(result.state);
      } else {
        setState("unknown");
      }
    } catch (err) {
      console.error("[DeploymentStatus] State fetch error:", err);
      setStateError(
        err instanceof Error ? err.message : "Failed to fetch state",
      );
      setState("unknown");
    } finally {
      setStateLoading(false);
    }
  }, [deploymentUrl, authToken]);

  // Fetch version
  const refetchVersion = useCallback(async () => {
    if (!deploymentUrl || !authToken) {
      setVersionLoading(false);
      return;
    }

    setVersionLoading(true);
    setVersionError(null);

    try {
      const result = (await callConvexQuery(
        deploymentUrl,
        authToken,
        SYSTEM_QUERIES.GET_VERSION,
        {},
        desktopFetch,
      )) as string | null;

      setVersion(result || null);
    } catch (err) {
      console.error("[DeploymentStatus] Version fetch error:", err);
      setVersionError(
        err instanceof Error ? err.message : "Failed to fetch version",
      );
    } finally {
      setVersionLoading(false);
    }
  }, [deploymentUrl, authToken]);

  // Fetch last push event
  const refetchLastPush = useCallback(async () => {
    if (!deploymentUrl || !authToken) {
      setLastPushLoading(false);
      return;
    }

    setLastPushLoading(true);
    setLastPushError(null);

    try {
      const result = (await callConvexQuery(
        deploymentUrl,
        authToken,
        SYSTEM_QUERIES.LAST_PUSH_EVENT,
        {},
        desktopFetch,
      )) as { _creationTime?: number } | null;

      if (result && result._creationTime) {
        setLastPush(new Date(result._creationTime));
      } else {
        setLastPush(null);
      }
    } catch (err) {
      console.error("[DeploymentStatus] Last push fetch error:", err);
      setLastPushError(
        err instanceof Error ? err.message : "Failed to fetch last push",
      );
    } finally {
      setLastPushLoading(false);
    }
  }, [deploymentUrl, authToken]);

  // Fetch all
  const refetch = useCallback(() => {
    refetchState();
    refetchVersion();
    refetchLastPush();
  }, [refetchState, refetchVersion, refetchLastPush]);

  // Initial fetch
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Check for npm updates when version is available
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

  const isLoading = stateLoading || versionLoading || lastPushLoading;
  const hasError = Boolean(stateError || versionError || lastPushError);

  return {
    state,
    stateLoading,
    stateError,

    version,
    versionLoading,
    versionError,

    hasUpdate,
    latestVersion,

    lastPush,
    lastPushLoading,
    lastPushError,

    isLoading,
    hasError,

    refetch,
    refetchState,
    refetchVersion,
    refetchLastPush,
  };
}
