import { Team, Project, Deployment } from "convex-panel";
import type { DashboardFetch } from "../lib/convex/dashboardCommonAdapter";
export type { Team, Project, Deployment };

export interface UserProfile {
  name?: string;
  email?: string;
  profilePictureUrl?: string;
}

export type PlanType =
  | "CONVEX_BASE"
  | "CONVEX_STARTER_PLUS"
  | "CONVEX_PROFESSIONAL"
  | "CONVEX_BUSINESS"
  | string;

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

const BIG_BRAIN_URL = "https://api.convex.dev";

export async function getTeams(
  accessToken: string,
  fetchFn: DashboardFetch,
): Promise<Team[]> {
  const response = await fetchFn(`${BIG_BRAIN_URL}/api/dashboard/teams`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Convex-Client": "convex-panel-desktop",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch teams: ${response.status}`);
  }

  return response.json();
}

export async function getProjects(
  accessToken: string,
  teamId: number,
  fetchFn: DashboardFetch,
): Promise<Project[]> {
  const response = await fetchFn(
    `${BIG_BRAIN_URL}/api/dashboard/teams/${teamId}/projects`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Convex-Client": "convex-panel-desktop",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch projects: ${response.status}`);
  }

  return response.json();
}

export async function getDeployments(
  accessToken: string,
  projectId: number,
  fetchFn: DashboardFetch,
): Promise<Deployment[]> {
  const response = await fetchFn(
    `${BIG_BRAIN_URL}/api/dashboard/projects/${projectId}/instances`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Convex-Client": "convex-panel-desktop",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch deployments: ${response.status}`);
  }

  const deployments: Deployment[] = await response.json();

  // Ensure each deployment has a URL - construct from name if not provided by API
  return deployments.map((deployment) => ({
    ...deployment,
    url: deployment.url ?? `https://${deployment.name}.convex.cloud`,
  }));
}

export async function getProfile(
  accessToken: string,
  fetchFn: DashboardFetch,
): Promise<UserProfile> {
  const response = await fetchFn(`${BIG_BRAIN_URL}/api/dashboard/profile`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Convex-Client": "convex-panel-desktop",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch profile: ${response.status}`);
  }

  return response.json();
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
  try {
    const response = await fetchFn(
      `${BIG_BRAIN_URL}/api/dashboard/teams/${teamId}/get_orb_subscription`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Convex-Client": "convex-panel-desktop",
        },
      },
    );

    if (!response.ok) {
      // 404 or other errors typically mean free plan
      return null;
    }

    const data = await response.json();
    return data as TeamSubscription;
  } catch {
    // Error fetching subscription, assume free plan
    return null;
  }
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
  // Management API uses /v1 not /api/v1
  const url = `${BIG_BRAIN_URL}/v1/deployments/${deploymentName}/create_deploy_key`;

  console.log("[createDeployKey] Request:", {
    url,
    deploymentName,
    keyName,
    tokenPrefix: accessToken?.substring(0, 20) + "...",
  });

  // Management API uses Bearer token with access token
  const response = await fetchFn(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Convex-Client": "convex-panel-desktop",
    },
    body: JSON.stringify({
      name: keyName,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    console.error("[createDeployKey] Failed:", {
      status: response.status,
      errorText,
    });
    throw new Error(
      `Failed to create deploy key: ${response.status} - ${errorText}`,
    );
  }

  // API returns { deployKey: string } per generatedManagementApi.ts
  const result: { deployKey: string } = await response.json();
  console.log("[createDeployKey] Success:", {
    hasKey: Boolean(result.deployKey),
  });

  // Normalize to { key: string } for internal use
  return { key: result.deployKey };
}
