import { useState, useEffect, useCallback } from "react";
import {
  getTeams,
  getProjects,
  getDeployments,
  getProfile,
  getTeamSubscription,
  getInvoices,
  type Team,
  type Project,
  type Deployment,
  type UserProfile,
  type TeamSubscription,
  type Invoice,
} from "@convex-panel/shared/api";
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
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const [loading, setLoading] = useState(false);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [deploymentsLoading, setDeploymentsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTeams = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setTeamsLoading(true);
    try {
      const data = await getTeams(accessToken, fetchFn);
      setTeams(data);
      return data;
    } catch (err) {
      console.error("Failed to load teams:", err);
      setError(err instanceof Error ? err.message : "Failed to load teams");
      return [];
    } finally {
      setLoading(false);
      setTeamsLoading(false);
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

  const loadInvoices = useCallback(
    async (teamId: number) => {
      if (!accessToken) return;
      try {
        const data = await getInvoices(accessToken, teamId, fetchFn);
        setInvoices(data);
        return data;
      } catch (err) {
        console.error("Failed to load invoices:", err);
        setInvoices([]);
        return [];
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
    invoices,
    loadTeams,
    loadProjects,
    loadDeployments,
    loadUser,
    loadSubscription,
    loadInvoices,
    loading,
    teamsLoading,
    deploymentsLoading,
    error,
  };
}
