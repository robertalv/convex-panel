/**
 * BigBrain API for Desktop
 *
 * This module re-exports BigBrain API functions from @convex-panel/shared
 * and adapts them to work with the desktop app's custom fetch function.
 */

import type { DashboardFetch } from "../lib/convex/dashboardCommonAdapter";
import type { PlanType } from "@convex-panel/shared";
import {
  getTeams as sharedGetTeams,
  getProjects as sharedGetProjects,
  getDeployments as sharedGetDeployments,
  getProfile as sharedGetProfile,
  getTeamSubscription as sharedGetTeamSubscription,
  createDeployKey as sharedCreateDeployKey,
  type Team,
  type Project,
  type Deployment,
  type UserProfile,
} from "@convex-panel/shared/api";

// Re-export types
export type { Team, Project, Deployment, UserProfile };

// Extended subscription types for desktop
export interface SubscriptionPlan {
  id: string;
  name: string;
  planType: PlanType | null;
  description?: string;
  status?: string;
}

export interface TeamSubscription {
  plan: SubscriptionPlan;
}

/**
 * Fetch all teams the user has access to
 */
export async function getTeams(
  accessToken: string,
  fetchFn: DashboardFetch,
): Promise<Team[]> {
  return sharedGetTeams(accessToken, fetchFn);
}

/**
 * Fetch all projects for a team
 */
export async function getProjects(
  accessToken: string,
  teamId: number,
  fetchFn: DashboardFetch,
): Promise<Project[]> {
  return sharedGetProjects(accessToken, teamId, fetchFn);
}

/**
 * Fetch all deployments for a project
 */
export async function getDeployments(
  accessToken: string,
  projectId: number,
  fetchFn: DashboardFetch,
): Promise<Deployment[]> {
  return sharedGetDeployments(accessToken, projectId, fetchFn);
}

/**
 * Fetch user profile
 */
export async function getProfile(
  accessToken: string,
  fetchFn: DashboardFetch,
): Promise<UserProfile> {
  return sharedGetProfile(accessToken, fetchFn);
}

/**
 * Get the subscription/plan for a team.
 * Returns null if team is on free plan (CONVEX_BASE) or no subscription found.
 */
export async function getTeamSubscription(
  accessToken: string,
  teamId: number,
  fetchFn: DashboardFetch,
): Promise<TeamSubscription | null> {
  const result = await sharedGetTeamSubscription(accessToken, teamId, fetchFn);
  return result as TeamSubscription | null;
}

/**
 * Create a deploy key for a deployment.
 * This key can be used as CONVEX_DEPLOY_KEY for CLI operations.
 *
 * Uses the Management API at /v1/deployments/{deployment_name}/create_deploy_key
 * See: https://docs.convex.dev/api/management-api
 *
 * @param accessToken - The OAuth access token (from device authorization flow)
 * @param deploymentName - The deployment name (e.g., "my-project-abc123")
 * @param keyName - A name for the key (e.g., "cp-12345-1234567890")
 * @param fetchFn - The fetch function to use
 * @returns The deploy key
 */
export async function createDeployKey(
  accessToken: string,
  deploymentName: string,
  keyName: string,
  fetchFn: DashboardFetch,
): Promise<{ key: string }> {
  return sharedCreateDeployKey(accessToken, deploymentName, keyName, fetchFn);
}
