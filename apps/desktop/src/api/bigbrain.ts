import type { DashboardFetch } from "../lib/convex/dashboardCommonAdapter";
import type { PlanType } from "@convex-panel/shared";
import {
  getTeams as sharedGetTeams,
  getProjects as sharedGetProjects,
  getDeployments as sharedGetDeployments,
  getProfile as sharedGetProfile,
  getTeamSubscription as sharedGetTeamSubscription,
  createDeployKey as sharedCreateDeployKey,
  createAccessToken as sharedCreateAccessToken,
  getDeploymentAccessTokens as sharedGetDeploymentAccessTokens,
  getProjectAccessTokens as sharedGetProjectAccessTokens,
  deleteAccessToken as sharedDeleteAccessToken,
  updateProfileName as sharedUpdateProfileName,
  getProfileEmails as sharedGetProfileEmails,
  getIdentities as sharedGetIdentities,
  unlinkIdentity as sharedUnlinkIdentity,
  getDiscordAccounts as sharedGetDiscordAccounts,
  unlinkDiscordAccount as sharedUnlinkDiscordAccount,
  deleteAccount as sharedDeleteAccount,
  type Team,
  type Project,
  type Deployment,
  type UserProfile,
  type AccessToken,
  type ProfileEmail,
  type Identity,
  type DiscordAccount,
} from "@convex-panel/shared/api";

export type {
  AccessToken,
  Team,
  Project,
  Deployment,
  UserProfile,
  ProfileEmail,
  Identity,
  DiscordAccount,
};

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

export interface Invoice {
  id: string;
  status: string;
  hasFailedPayment: boolean;
  invoiceDate: string;
  amountDue: number;
  currency: string;
}

export async function getTeams(
  accessToken: string,
  fetchFn: DashboardFetch,
): Promise<Team[]> {
  return sharedGetTeams(accessToken, fetchFn);
}

export async function getProjects(
  accessToken: string,
  teamId: number,
  fetchFn: DashboardFetch,
): Promise<Project[]> {
  return sharedGetProjects(accessToken, teamId, fetchFn);
}

export async function getDeployments(
  accessToken: string,
  projectId: number,
  fetchFn: DashboardFetch,
): Promise<Deployment[]> {
  return sharedGetDeployments(accessToken, projectId, fetchFn);
}

export async function getProfile(
  accessToken: string,
  fetchFn: DashboardFetch,
): Promise<UserProfile> {
  return sharedGetProfile(accessToken, fetchFn);
}

export async function getTeamSubscription(
  accessToken: string,
  teamId: number,
  fetchFn: DashboardFetch,
): Promise<TeamSubscription | null> {
  const result = await sharedGetTeamSubscription(accessToken, teamId, fetchFn);
  return result as TeamSubscription | null;
}

export async function createDeployKey(
  accessToken: string,
  deploymentName: string,
  keyName: string,
  fetchFn: DashboardFetch,
): Promise<{ key: string }> {
  return sharedCreateDeployKey(accessToken, deploymentName, keyName, fetchFn);
}

export async function createAccessToken(
  accessToken: string,
  params: {
    name: string;
    teamId: number;
    deploymentId?: number | null;
    projectId?: number | null;
    permissions?: string[] | null;
  },
  fetchFn: DashboardFetch,
): Promise<{ accessToken: string }> {
  return sharedCreateAccessToken(accessToken, params, fetchFn);
}

export async function getDeploymentAccessTokens(
  accessToken: string,
  deploymentName: string,
  fetchFn: DashboardFetch,
): Promise<AccessToken[]> {
  return sharedGetDeploymentAccessTokens(accessToken, deploymentName, fetchFn);
}

export async function getProjectAccessTokens(
  accessToken: string,
  projectId: number,
  fetchFn: DashboardFetch,
): Promise<AccessToken[]> {
  return sharedGetProjectAccessTokens(accessToken, projectId, fetchFn);
}

export async function deleteAccessToken(
  accessToken: string,
  tokenAccessToken: string,
  fetchFn: DashboardFetch,
): Promise<void> {
  return sharedDeleteAccessToken(accessToken, tokenAccessToken, fetchFn);
}

export async function getInvoices(
  accessToken: string,
  teamId: number,
  fetchFn: DashboardFetch,
): Promise<Invoice[]> {
  const response = await fetchFn(
    `https://api.convex.dev/api/dashboard/teams/${teamId}/list_invoices`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch invoices: ${response.statusText}`);
  }

  const data = (await response.json()) as { invoices: Invoice[] };
  return data.invoices.filter(
    (invoice) => new Date(invoice.invoiceDate) >= new Date("2024-04-29"),
  );
}

// ============================================================================
// Profile Management Functions
// ============================================================================

export async function updateProfileName(
  accessToken: string,
  name: string,
  fetchFn: DashboardFetch,
): Promise<void> {
  return sharedUpdateProfileName(accessToken, name, fetchFn);
}

export async function getProfileEmails(
  accessToken: string,
  fetchFn: DashboardFetch,
): Promise<ProfileEmail[]> {
  return sharedGetProfileEmails(accessToken, fetchFn);
}

export async function getIdentities(
  accessToken: string,
  fetchFn: DashboardFetch,
): Promise<Identity[]> {
  return sharedGetIdentities(accessToken, fetchFn);
}

export async function unlinkIdentity(
  accessToken: string,
  provider: "google" | "github" | "vercel",
  fetchFn: DashboardFetch,
): Promise<void> {
  return sharedUnlinkIdentity(accessToken, provider, fetchFn);
}

export async function getDiscordAccounts(
  accessToken: string,
  fetchFn: DashboardFetch,
): Promise<DiscordAccount[]> {
  return sharedGetDiscordAccounts(accessToken, fetchFn);
}

export async function unlinkDiscordAccount(
  accessToken: string,
  discordUserId: string,
  fetchFn: DashboardFetch,
): Promise<void> {
  return sharedUnlinkDiscordAccount(accessToken, discordUserId, fetchFn);
}

export async function deleteAccount(
  accessToken: string,
  fetchFn: DashboardFetch,
): Promise<void> {
  return sharedDeleteAccount(accessToken, fetchFn);
}
