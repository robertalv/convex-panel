/**
 * Deployment Context
 *
 * Manages currently selected team/project/deployment with persistence
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { queryClient } from "./QueryContext";
import type { Team, Project, Deployment } from "../types";
import {
  fetchFailureRate,
  fetchCacheHitRate,
  fetchSchedulerLag,
  fetchUdfExecutionStats,
  fetchInsights,
} from "../api";
import { mobileFetch } from "../utils/fetch";
import { healthMetricsKeys } from "../features/dashboard/hooks/useHealthMetrics";
import { udfExecutionStatsKeys } from "../features/dashboard/hooks/useUdfExecutionStats";
import { insightsKeys } from "../features/dashboard/hooks/useInsights";

interface DeploymentContextValue {
  team: Team | null;
  project: Project | null;
  deployment: Deployment | null;
  setTeam: (team: Team | null) => void;
  setProject: (project: Project | null) => void;
  setDeployment: (deployment: Deployment | null) => void;
  clearSelection: () => void;
  isLoading: boolean;
  isPrefetching: boolean;
  prefetchDashboardData: (
    deployment: Deployment,
    accessToken: string,
  ) => Promise<void>;
}

const DeploymentContext = createContext<DeploymentContextValue | undefined>(
  undefined,
);

const STORAGE_KEY = "@convex-panel:deployment-selection";

interface StoredSelection {
  team: Team | null;
  project: Project | null;
  deployment: Deployment | null;
}

export function DeploymentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [team, setTeamState] = useState<Team | null>(null);
  const [project, setProjectState] = useState<Project | null>(null);
  const [deployment, setDeploymentState] = useState<Deployment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrefetching, setIsPrefetching] = useState(false);
  const prevDeploymentRef = useRef<Deployment | null>(null);

  // Load saved selection on mount
  useEffect(() => {
    loadSelection();
  }, []);

  // Save selection whenever it changes
  useEffect(() => {
    if (!isLoading) {
      saveSelection();
    }
  }, [team, project, deployment, isLoading]);

  // Clear React Query cache when deployment changes
  useEffect(() => {
    if (!isLoading && deployment?.id !== prevDeploymentRef.current?.id) {
      // Deployment changed - clear all deployment-scoped queries
      // Clear data queries
      queryClient.removeQueries({ queryKey: ["data"] });

      // Clear logs queries
      queryClient.removeQueries({ queryKey: ["logs"] });

      // Clear deployment status queries
      queryClient.removeQueries({ queryKey: ["deploymentStatus"] });

      // Clear insights queries
      queryClient.removeQueries({ queryKey: ["insights"] });

      // Clear function health queries
      queryClient.removeQueries({ queryKey: ["functionHealth"] });

      // Clear function activity queries
      queryClient.removeQueries({ queryKey: ["functionActivity"] });

      console.log(
        "[DeploymentContext] Cleared React Query cache for deployment change",
      );

      prevDeploymentRef.current = deployment;
    } else if (!isLoading && !deployment) {
      // Deployment cleared
      prevDeploymentRef.current = null;
    }
  }, [deployment, isLoading]);

  const loadSelection = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: StoredSelection = JSON.parse(saved);
        setTeamState(parsed.team);
        setProjectState(parsed.project);
        setDeploymentState(parsed.deployment);
        console.log("[DeploymentContext] Loaded saved selection:", {
          team: parsed.team?.name,
          project: parsed.project?.name,
          deployment: parsed.deployment?.name,
        });
      }
    } catch (error) {
      console.error("[DeploymentContext] Error loading selection:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSelection = async () => {
    try {
      const toSave: StoredSelection = { team, project, deployment };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      console.log("[DeploymentContext] Saved selection:", {
        team: team?.name,
        project: project?.name,
        deployment: deployment?.name,
      });
    } catch (error) {
      console.error("[DeploymentContext] Error saving selection:", error);
    }
  };

  const setTeam = useCallback(
    (newTeam: Team | null) => {
      setTeamState(newTeam);
      // Clear project and deployment when team changes
      if (newTeam?.id !== team?.id) {
        setProjectState(null);
        setDeploymentState(null);
      }
    },
    [team],
  );

  const setProject = useCallback(
    (newProject: Project | null) => {
      setProjectState(newProject);
      // Clear deployment when project changes
      if (newProject?.id !== project?.id) {
        setDeploymentState(null);
      }
    },
    [project],
  );

  /**
   * Prefetch dashboard data for a deployment.
   * This runs in the background after deployment selection to warm the cache.
   */
  const prefetchDashboardData = useCallback(
    async (deployment: Deployment, accessToken: string) => {
      const deploymentUrl = deployment.url;

      try {
        setIsPrefetching(true);
        console.log(
          "[DeploymentContext] Prefetching dashboard data for:",
          deployment.name,
        );

        // Calculate cursor for UDF execution stats (last hour)
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        const cursor = Math.floor(oneHourAgo / 1000) * 1000;

        // Prefetch all dashboard queries in parallel
        await Promise.allSettled([
          // Health metrics
          queryClient.prefetchQuery({
            queryKey: healthMetricsKeys.failureRate(deploymentUrl),
            queryFn: async () => {
              const data = await fetchFailureRate(
                deploymentUrl,
                accessToken,
                mobileFetch,
              );
              // Transform data same way as the hook
              const allPoints: Array<{ time: number; value: number | null }> =
                [];
              for (const [, timeSeries] of data) {
                for (const [timestamp, value] of timeSeries) {
                  allPoints.push({
                    time: timestamp.secs_since_epoch,
                    value: value,
                  });
                }
              }
              allPoints.sort((a, b) => a.time - b.time);
              return allPoints;
            },
          }),
          queryClient.prefetchQuery({
            queryKey: healthMetricsKeys.cacheHitRate(deploymentUrl),
            queryFn: async () => {
              const data = await fetchCacheHitRate(
                deploymentUrl,
                accessToken,
                mobileFetch,
              );
              // Transform data same way as the hook
              const allPoints: Array<{ time: number; value: number | null }> =
                [];
              for (const [, timeSeries] of data) {
                for (const [timestamp, value] of timeSeries) {
                  allPoints.push({
                    time: timestamp.secs_since_epoch,
                    value: value,
                  });
                }
              }
              allPoints.sort((a, b) => a.time - b.time);
              return allPoints;
            },
          }),
          queryClient.prefetchQuery({
            queryKey: healthMetricsKeys.schedulerLag(deploymentUrl),
            queryFn: async () => {
              const data = await fetchSchedulerLag(
                deploymentUrl,
                accessToken,
                mobileFetch,
              );
              // Transform data same way as the hook
              const transformed: Array<{ time: number; value: number | null }> =
                Array.isArray(data)
                  ? data.map(
                      ([timestamp, value]: [
                        { secs_since_epoch: number },
                        number | null,
                      ]) => ({
                        time: timestamp.secs_since_epoch,
                        value,
                      }),
                    )
                  : [];
              return transformed;
            },
          }),

          // UDF execution stats (shared by multiple hooks)
          queryClient.prefetchQuery({
            queryKey: udfExecutionStatsKeys.data(deploymentUrl, cursor),
            queryFn: async () => {
              return await fetchUdfExecutionStats(
                deploymentUrl,
                accessToken,
                cursor,
                mobileFetch,
              );
            },
          }),

          // Insights
          queryClient.prefetchQuery({
            queryKey: insightsKeys.list(deploymentUrl),
            queryFn: async () => {
              return await fetchInsights(
                deploymentUrl,
                accessToken,
                mobileFetch,
              );
            },
          }),
        ]);

        console.log("[DeploymentContext] Dashboard data prefetch complete");
      } catch (error) {
        console.error("[DeploymentContext] Error prefetching data:", error);
      } finally {
        setIsPrefetching(false);
      }
    },
    [],
  );

  const setDeployment = useCallback((newDeployment: Deployment | null) => {
    setDeploymentState(newDeployment);

    // Prefetch dashboard data when deployment is selected
    // We need to get the access token from somewhere - we'll need to pass it
    // For now, we'll trigger prefetch in the component that calls setDeployment
  }, []);

  const clearSelection = useCallback(async () => {
    setTeamState(null);
    setProjectState(null);
    setDeploymentState(null);
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      console.log("[DeploymentContext] Cleared selection");
    } catch (error) {
      console.error("[DeploymentContext] Error clearing selection:", error);
    }
  }, []);

  const value: DeploymentContextValue = {
    team,
    project,
    deployment,
    setTeam,
    setProject,
    setDeployment,
    clearSelection,
    isLoading,
    isPrefetching,
    prefetchDashboardData,
  };

  return (
    <DeploymentContext.Provider value={value}>
      {children}
    </DeploymentContext.Provider>
  );
}

export function useDeployment(): DeploymentContextValue {
  const context = useContext(DeploymentContext);
  if (context === undefined) {
    throw new Error("useDeployment must be used within a DeploymentProvider");
  }
  return context;
}
