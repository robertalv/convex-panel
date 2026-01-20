/**
 * Deployment management operations
 * Handles fetching deployment metadata, credentials, state, and deploy keys
 */

import { type DeploymentCredentials, type DeploymentInfo } from "./types";
import { extractDeploymentName, extractProjectName } from "./utils";
import { getAdminClientInfo } from "../adminClient";
import { fetchDeployments, fetchProjects } from "./teams";
import { CONVEX_API_DOMAIN, ROUTES, SYSTEM_QUERIES } from "../api-constants";

/**
 * Fetch deployment metadata from Convex API
 * Attempts to get deployment information using system queries
 * @param adminClient - The Convex admin client instance
 * @param deploymentUrl - The deployment URL
 * @param accessToken - Optional access token (currently unused, kept for API compatibility)
 * @returns Deployment metadata including name, type, and project info
 */
export async function fetchDeploymentMetadata(
  adminClient: any,
  deploymentUrl: string | undefined,
  // Optional third parameter kept to match previous call sites and avoid DTS arity issues
  _accessToken?: string | undefined,
): Promise<{
  deploymentName?: string;
  projectName?: string;
  deploymentType?: "dev" | "prod" | "preview";
  kind?: "cloud" | "local";
}> {
  const deploymentName = extractDeploymentName(deploymentUrl);
  const projectName = extractProjectName(deploymentUrl);

  // Default response with extracted info
  const defaultResponse = {
    deploymentName,
    projectName,
    deploymentType: "dev" as const,
    kind: "cloud" as const,
  };

  // If we have an admin client, try to query system functions for more info
  if (adminClient) {
    try {
      // Try to get deployment info from system functions
      // Note: These are internal Convex system functions that may not be available
      // in all deployments or may require specific permissions
      const deploymentInfo = await adminClient.query(
        SYSTEM_QUERIES.DEPLOYMENT_INFO,
        {},
      );

      if (deploymentInfo) {
        return {
          deploymentName: deploymentInfo.name || deploymentName,
          projectName: deploymentInfo.projectName || projectName,
          deploymentType: deploymentInfo.deploymentType || "dev",
          kind: deploymentInfo.kind || "cloud",
        };
      }
    } catch (err) {
      // System query failed, fall back to extracted info
    }
  }

  // Try to determine deployment type from URL or name
  let deploymentType: "dev" | "prod" | "preview" = "dev";
  if (deploymentName) {
    if (
      deploymentName.startsWith("prod-") ||
      deploymentName.includes("production")
    ) {
      deploymentType = "prod";
    } else if (
      deploymentName.startsWith("preview-") ||
      deploymentName.includes("preview")
    ) {
      deploymentType = "preview";
    } else if (
      deploymentName.startsWith("dev-") ||
      deploymentName.startsWith("dev:")
    ) {
      deploymentType = "dev";
    }
  }

  return {
    ...defaultResponse,
    deploymentType,
  };
}

/**
 * Get deployment credentials (cloud URL and site URL)
 * @param adminClient - The Convex admin client instance
 * @returns The deployment credentials
 */
export async function getDeploymentCredentials(
  adminClient: any,
): Promise<DeploymentCredentials> {
  if (!adminClient) {
    throw new Error("Admin client not available");
  }

  try {
    // Get the canonical cloud URL (deployment URL)
    const convexCloudUrl = await adminClient.query(
      SYSTEM_QUERIES.CLOUD_URL,
      {},
    );

    // HTTP Actions URL is the deployment URL but with .site instead of .cloud
    const convexSiteUrl = convexCloudUrl.replace(
      ".convex.cloud",
      ".convex.site",
    );

    const { adminKey } = getAdminClientInfo(adminClient);

    return {
      deploymentUrl: convexCloudUrl,
      httpActionsUrl: convexSiteUrl,
      adminKey: adminKey || "",
    };
  } catch (error: any) {
    throw new Error(
      `Failed to get deployment credentials: ${error?.message || "Unknown error"}`,
    );
  }
}

/**
 * Get deployment info including type and name
 * @param adminClient - The Convex admin client instance
 * @returns The deployment info
 */
export async function getDeploymentInfo(
  adminClient: any,
): Promise<DeploymentInfo> {
  if (!adminClient) {
    throw new Error("Admin client not available");
  }

  try {
    const result = await adminClient.query(SYSTEM_QUERIES.DEPLOYMENT_INFO, {});
    return result;
  } catch (error: any) {
    throw new Error(
      `Failed to get deployment info: ${error?.message || "Unknown error"}`,
    );
  }
}

/**
 * Create a new deploy key using the Management API
 * Note: Requires team access token (not admin key) and deployment name
 * @param deploymentName - The deployment name
 * @param teamAccessToken - The team access token
 * @param keyName - The name of the deploy key
 * @returns The deploy key
 */
export async function createDeployKey(
  deploymentName: string,
  teamAccessToken: string,
  keyName: string,
): Promise<{ deployKey: string }> {
  const response = await fetch(
    `https://${CONVEX_API_DOMAIN}${ROUTES.CREATE_DEPLOY_KEY.replace("{deploymentId}", deploymentName)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Convex ${teamAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: keyName,
      }),
    },
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Unknown error" }));
    throw new Error(
      `Failed to create deploy key: ${response.status}, message: ${error.message || "Unknown error"}`,
    );
  }

  const result = await response.json();
  return result;
}

/**
 * Get the current deployment state (running or paused)
 * @param deploymentUrl - The URL of the Convex deployment
 * @param adminKey - The admin key for authentication
 * @returns The deployment state
 */
export async function getConvexDeploymentState(
  deploymentUrl: string,
  adminKey: string,
): Promise<{ state: "running" | "paused" }> {
  const response = await fetch(`${deploymentUrl}${ROUTES.QUERY}`, {
    method: "POST",
    headers: {
      Authorization: `Convex ${adminKey}`,
      "Content-Type": "application/json",
      "Convex-Client": "dashboard-0.0.0",
    },
    body: JSON.stringify({
      path: SYSTEM_QUERIES.DEPLOYMENT_STATE,
      args: {},
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to get deployment state: ${response.status} - ${errorText}`,
    );
  }

  const result = await response.json();
  return result.value || result;
}

/**
 * Change deployment state (pause/resume)
 * @param deploymentUrl - The URL of the Convex deployment
 * @param adminKey - The admin key for authentication
 * @param newState - The new state: "paused" or "running"
 */
async function changeDeploymentState(
  deploymentUrl: string,
  adminKey: string,
  newState: "paused" | "running",
): Promise<void> {
  const response = await fetch(
    `${deploymentUrl}${ROUTES.CHANGE_DEPLOYMENT_STATE}`,
    {
      method: "POST",
      headers: {
        Authorization: `Convex ${adminKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ newState }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to change deployment state: ${response.status} - ${errorText}`,
    );
  }
}

/**
 * Pause a Convex deployment
 * @param deploymentUrl - The URL of the Convex deployment
 * @param adminKey - The admin key for authentication
 */
export async function pauseConvexDeployment(
  deploymentUrl: string,
  adminKey: string,
): Promise<void> {
  await changeDeploymentState(deploymentUrl, adminKey, "paused");
}

/**
 * Resume a Convex deployment
 * @param deploymentUrl - The URL of the Convex deployment
 * @param adminKey - The admin key for authentication
 */
export async function resumeConvexDeployment(
  deploymentUrl: string,
  adminKey: string,
): Promise<void> {
  await changeDeploymentState(deploymentUrl, adminKey, "running");
}

/**
 * Get deployment ID from deployment URL by matching deployment name
 * @param deploymentUrl - The deployment URL
 * @param accessToken - The access token
 * @param teamId - The team ID
 * @param projectId - The project ID
 * @param useBearerToken - Whether to use bearer token
 * @returns The deployment ID
 */
export async function getDeploymentIdFromUrl(
  deploymentUrl: string | undefined,
  accessToken: string,
  teamId?: number,
  projectId?: number,
  useBearerToken: boolean = true,
): Promise<number | null> {
  if (!deploymentUrl) return null;

  const deploymentName = extractDeploymentName(deploymentUrl);
  if (!deploymentName) return null;

  // If we have projectId, try to fetch deployments directly
  if (projectId) {
    try {
      const deployments = await fetchDeployments(
        projectId,
        accessToken,
        useBearerToken,
      );
      const deployment = deployments.find(
        (d) => d.name === deploymentName || d.name.includes(deploymentName),
      );
      return deployment?.id || null;
    } catch (err) {
      // Ignore errors
    }
  }

  // If we have teamId but not projectId, try to find project first
  if (teamId && !projectId) {
    try {
      const projects = await fetchProjects(teamId, accessToken, useBearerToken);
      // Try each project to find the deployment
      for (const project of projects) {
        try {
          const deployments = await fetchDeployments(
            project.id,
            accessToken,
            useBearerToken,
          );
          const deployment = deployments.find(
            (d) => d.name === deploymentName || d.name.includes(deploymentName),
          );
          if (deployment) {
            return deployment.id;
          }
        } catch (err) {
          // Continue to next project
          continue;
        }
      }
    } catch (err) {
      // Ignore errors
    }
  }

  return null;
}
