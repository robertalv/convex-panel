/**
 * BigBrain API Hooks
 * 
 * React Query hooks for fetching data from BigBrain API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as bigbrain from '../api/bigbrain';
import type { Team, Project, Deployment } from '../types';

/**
 * Hook for fetching teams
 */
export function useTeams(accessToken: string | null) {
  return useQuery({
    queryKey: ['teams', accessToken],
    queryFn: () => bigbrain.getTeams(accessToken!),
    enabled: !!accessToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for fetching projects for a team
 */
export function useProjects(accessToken: string | null, teamId: number | null) {
  return useQuery({
    queryKey: ['projects', teamId, accessToken],
    queryFn: () => bigbrain.getProjects(accessToken!, teamId!),
    enabled: !!accessToken && !!teamId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for fetching deployments for a project
 */
export function useDeployments(accessToken: string | null, projectId: number | null) {
  return useQuery({
    queryKey: ['deployments', projectId, accessToken],
    queryFn: () => bigbrain.getDeployments(accessToken!, projectId!),
    enabled: !!accessToken && !!projectId,
    staleTime: 2 * 60 * 1000, // 2 minutes (more frequent for deployments)
  });
}

/**
 * Hook for fetching user profile
 */
export function useProfile(accessToken: string | null) {
  return useQuery({
    queryKey: ['profile', accessToken],
    queryFn: () => bigbrain.getProfile(accessToken!),
    enabled: !!accessToken,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for updating profile name
 */
export function useUpdateProfileName(accessToken: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => bigbrain.updateProfileName(accessToken!, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', accessToken] });
    },
  });
}

/**
 * Hook for fetching profile emails
 */
export function useProfileEmails(accessToken: string | null) {
  return useQuery({
    queryKey: ['profileEmails', accessToken],
    queryFn: () => bigbrain.getProfileEmails(accessToken!),
    enabled: !!accessToken,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for fetching identities
 */
export function useIdentities(accessToken: string | null) {
  return useQuery({
    queryKey: ['identities', accessToken],
    queryFn: () => bigbrain.getIdentities(accessToken!),
    enabled: !!accessToken,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for fetching team subscription
 */
export function useTeamSubscription(accessToken: string | null, teamId: number | null) {
  return useQuery({
    queryKey: ['subscription', teamId, accessToken],
    queryFn: () => bigbrain.getTeamSubscription(accessToken!, teamId!),
    enabled: !!accessToken && !!teamId,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook for fetching deployment insights
 */
export function useDeploymentInsights(
  accessToken: string | null,
  teamId: number | null,
  projectId: number | null,
  deploymentName: string | null,
  period: { from: string; to: string }
) {
  return useQuery({
    queryKey: ['insights', teamId, projectId, deploymentName, period, accessToken],
    queryFn: () =>
      bigbrain.getDeploymentInsights(
        accessToken!,
        teamId!,
        projectId!,
        deploymentName!,
        period
      ),
    enabled: !!accessToken && !!teamId && !!projectId && !!deploymentName,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for live data
  });
}

/**
 * Hook for creating a deploy key
 */
export function useCreateDeployKey(accessToken: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ deploymentName, keyName }: { deploymentName: string; keyName: string }) =>
      bigbrain.createDeployKey(accessToken, deploymentName, keyName),
    onSuccess: () => {
      // Optionally invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['deployments'] });
    },
  });
}

/**
 * Hook for rolling back a deployment
 */
export function useRollbackDeployment(accessToken: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      deploymentName,
      targetVersion,
    }: {
      deploymentName: string;
      targetVersion: string;
    }) => bigbrain.rollbackDeployment(accessToken, deploymentName, targetVersion),
    onSuccess: () => {
      // Invalidate deployments and insights
      queryClient.invalidateQueries({ queryKey: ['deployments'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
    },
  });
}

/**
 * Hook for disabling a function
 */
export function useDisableFunction(accessToken: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      deploymentName,
      functionName,
    }: {
      deploymentName: string;
      functionName: string;
    }) => bigbrain.disableFunction(accessToken, deploymentName, functionName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insights'] });
    },
  });
}

/**
 * Hook for clearing cache
 */
export function useClearCache(accessToken: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ deploymentName }: { deploymentName: string }) =>
      bigbrain.clearCache(accessToken, deploymentName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insights'] });
    },
  });
}

/**
 * Composite hook that combines teams, projects, and deployments
 */
export function useBigBrain(accessToken: string | null) {
  const teams = useTeams(accessToken);
  
  return {
    teams: teams.data || [],
    isLoadingTeams: teams.isLoading,
    teamsError: teams.error,
    refetchTeams: teams.refetch,
  };
}
