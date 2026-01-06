import { useState, useEffect, useCallback } from "react";
import {
  getTeams,
  getProjects,
  getDeployments,
  getProfile,
  getTeamSubscription,
  Team,
  Project,
  Deployment,
  UserProfile,
  TeamSubscription,
} from "../api/bigbrain";
import type { DashboardFetch } from "../lib/convex/dashboardCommonAdapter";

export function useBigBrain(
  accessToken: string | null,
  fetchFn: DashboardFetch,
) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<TeamSubscription | null>(
    null,
  );

  const [loading, setLoading] = useState(false);
  const [deploymentsLoading, setDeploymentsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTeams = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const data = await getTeams(accessToken, fetchFn);
      setTeams(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load teams");
      return [];
    } finally {
      setLoading(false);
    }
  }, [accessToken, fetchFn]);

  const loadProjects = useCallback(
    async (teamId: number) => {
      if (!accessToken) return;
      setLoading(true);
      try {
        const data = await getProjects(accessToken, teamId, fetchFn);
        setProjects(data);
        setDeployments([]);
        return data;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load projects",
        );
        return [];
      } finally {
        setLoading(false);
      }
    },
    [accessToken, fetchFn],
  );

  const loadDeployments = useCallback(
    async (projectId: number) => {
      if (!accessToken) return;
      setLoading(true);
      setDeploymentsLoading(true);
      try {
        const data = await getDeployments(accessToken, projectId, fetchFn);
        setDeployments(data);
        return data;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load deployments",
        );
        return [];
      } finally {
        setLoading(false);
        setDeploymentsLoading(false);
      }
    },
    [accessToken, fetchFn],
  );

  const loadUser = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const data = await getProfile(accessToken, fetchFn);
      setUser(data);
      return data;
    } catch (err) {
      console.error("Failed to load user profile:", err);
      // Don't set error state here as this might be background fetch
      return null;
    } finally {
      setLoading(false);
    }
  }, [accessToken, fetchFn]);

  const loadSubscription = useCallback(
    async (teamId: number) => {
      if (!accessToken) return;
      try {
        const data = await getTeamSubscription(accessToken, teamId, fetchFn);
        setSubscription(data);
        return data;
      } catch (err) {
        console.error("Failed to load subscription:", err);
        setSubscription(null);
        return null;
      }
    },
    [accessToken, fetchFn],
  );

  useEffect(() => {
    loadTeams();
    loadUser();
  }, [loadTeams, loadUser]);

  return {
    teams,
    projects,
    deployments,
    user,
    subscription,
    loadTeams,
    loadProjects,
    loadDeployments,
    loadUser,
    loadSubscription,
    loading,
    deploymentsLoading,
    error,
  };
}
