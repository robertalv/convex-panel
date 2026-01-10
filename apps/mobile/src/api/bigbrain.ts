/**
 * BigBrain API Client for Mobile
 * Platform-agnostic client for Convex's BigBrain API
 */

import type { FetchFn } from "./types";
import {
  BIG_BRAIN_URL,
  BIG_BRAIN_DASHBOARD_PATH,
  CONVEX_CLIENT_ID,
  DATABRICKS_QUERY_IDS,
  ROOT_COMPONENT_PATH,
} from "./constants";

/**
 * Make a request to the BigBrain Dashboard API
 */
export async function callBigBrainAPI<T = unknown>(
  path: string,
  options: {
    accessToken: string;
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: unknown;
    pathParams?: Record<string, string | number>;
    queryParams?: Record<string, string | number | undefined | null>;
  },
  fetchFn: FetchFn,
): Promise<T> {
  const {
    accessToken,
    method = "GET",
    body,
    pathParams,
    queryParams,
  } = options;

  // Replace path parameters
  let finalPath = path;
  if (pathParams) {
    for (const [key, value] of Object.entries(pathParams)) {
      finalPath = finalPath.replace(`{${key}}`, String(value));
    }
  }

  // Build query string
  const queryString = new URLSearchParams();
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined && value !== null) {
        queryString.append(key, String(value));
      }
    }
  }

  const url = `${BIG_BRAIN_URL}${BIG_BRAIN_DASHBOARD_PATH}${finalPath}${queryString.toString() ? `?${queryString.toString()}` : ""}`;

  console.log(`[BigBrain] ${method} ${url}`);

  const response = await fetchFn(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Convex-Client": CONVEX_CLIENT_ID,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    console.error(`[BigBrain] Request failed:`, {
      status: response.status,
      statusText: response.statusText,
      error: errorText,
    });
    throw new Error(
      `BigBrain API error: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }

  // Handle 204 No Content responses (empty body)
  if (response.status === 204) {
    return {} as T;
  }

  // Check if response has content before parsing JSON
  const text = await response.text();
  if (!text || text.trim().length === 0) {
    return {} as T;
  }

  try {
    const data = JSON.parse(text);
    return data as T;
  } catch (error) {
    // If JSON parsing fails, log and return empty object
    console.warn(`[BigBrain] Failed to parse JSON response:`, error);
    return {} as T;
  }
}

/**
 * Make a request to the BigBrain Management API (v1)
 */
export async function callBigBrainManagementAPI<T = unknown>(
  path: string,
  options: {
    accessToken: string;
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: unknown;
    pathParams?: Record<string, string | number>;
    queryParams?: Record<string, string | number | undefined | null>;
  },
  fetchFn: FetchFn,
): Promise<T> {
  const {
    accessToken,
    method = "GET",
    body,
    pathParams,
    queryParams,
  } = options;

  // Replace path parameters
  let finalPath = path;
  if (pathParams) {
    for (const [key, value] of Object.entries(pathParams)) {
      finalPath = finalPath.replace(`{${key}}`, String(value));
    }
  }

  // Build query string
  const queryString = new URLSearchParams();
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined && value !== null) {
        queryString.append(key, String(value));
      }
    }
  }

  const url = `${BIG_BRAIN_URL}/v1${finalPath}${queryString.toString() ? `?${queryString.toString()}` : ""}`;

  console.log(`[BigBrain Management] ${method} ${url}`);

  const response = await fetchFn(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Convex-Client": CONVEX_CLIENT_ID,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    console.error(`[BigBrain Management] Request failed:`, {
      status: response.status,
      statusText: response.statusText,
      error: errorText,
    });
    throw new Error(
      `BigBrain Management API error: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }

  const data = await response.json();
  return data as T;
}

// ============================================================================
// Types
// ============================================================================

export interface TeamAndProject {
  teamId: number;
  teamSlug: string;
  projectId: number;
  projectSlug: string;
}

export interface TokenDetails {
  type: "accessToken" | "projectToken" | "deploymentToken" | "deployKey";
  teamId?: number;
  projectId?: number;
  deploymentId?: number;
  deploymentName?: string;
}

export interface UsageQueryParams {
  queryId: string;
  teamId: number;
  projectId?: number | null;
  deploymentName?: string;
  from?: string;
  to?: string;
  componentPath?: string;
  udfId?: string;
  tableName?: string;
}

export interface InsightsPeriod {
  from: string;
  to: string;
}

// ============================================================================
// Functions
// ============================================================================

/**
 * Get team and project info from deployment name
 */
export async function getTeamFromDeployment(
  deploymentName: string,
  accessToken: string,
  fetchFn: FetchFn,
): Promise<TeamAndProject | null> {
  try {
    const url = `${BIG_BRAIN_URL}/api/deployment/${deploymentName}/team_and_project`;

    console.log(`[BigBrain] GET ${url}`);

    const response = await fetchFn(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Convex-Client": CONVEX_CLIENT_ID,
      },
    });

    if (!response.ok) {
      console.error(`[BigBrain] team_and_project failed:`, response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`[BigBrain] Error getting team from deployment:`, error);
    return null;
  }
}

/**
 * Get details about the current token
 */
export async function getTokenDetails(
  accessToken: string,
  fetchFn: FetchFn,
): Promise<TokenDetails | null> {
  try {
    return await callBigBrainManagementAPI<TokenDetails>(
      "/token_details",
      { accessToken },
      fetchFn,
    );
  } catch {
    return null;
  }
}

/**
 * Get the insights period (last 72 hours)
 */
export function getInsightsPeriod(): InsightsPeriod {
  const now = new Date();
  const hoursAgo72 = new Date(now.getTime() - 72 * 60 * 60 * 1000);
  return {
    from: hoursAgo72.toISOString(),
    to: now.toISOString(),
  };
}

/**
 * Query BigBrain usage data (Databricks query)
 */
export async function queryUsage(
  params: UsageQueryParams,
  accessToken: string,
  fetchFn: FetchFn,
): Promise<string[][]> {
  const {
    queryId,
    teamId,
    projectId,
    deploymentName,
    from,
    to,
    componentPath,
    udfId,
    tableName,
  } = params;

  return callBigBrainAPI<string[][]>(
    "/teams/{team_id}/usage/query",
    {
      accessToken,
      pathParams: { team_id: teamId },
      queryParams: {
        queryId,
        projectId: projectId ?? undefined,
        deploymentName,
        from,
        to,
        componentPath,
        udfId,
        tableName,
      },
    },
    fetchFn,
  );
}

// ============================================================================
// Team & Project Functions
// ============================================================================

/**
 * Fetch all teams the user has access to
 */
export async function getTeams(accessToken: string): Promise<any[]> {
  return callBigBrainAPI<any[]>("/teams", { accessToken }, fetch);
}

/**
 * Fetch all projects for a team
 */
export async function getProjects(
  accessToken: string,
  teamId: number,
): Promise<any[]> {
  return callBigBrainAPI<any[]>(
    "/teams/{team_id}/projects",
    {
      accessToken,
      pathParams: { team_id: teamId },
    },
    fetch,
  );
}

/**
 * Fetch all deployments for a project
 */
export async function getDeployments(
  accessToken: string,
  projectId: number,
): Promise<any[]> {
  const deployments = await callBigBrainAPI<any[]>(
    "/projects/{project_id}/instances",
    {
      accessToken,
      pathParams: { project_id: projectId },
    },
    fetch,
  );

  // Ensure each deployment has a URL - construct from name if not provided by API
  return deployments.map((deployment) => ({
    ...deployment,
    url: deployment.url ?? `https://${deployment.name}.convex.cloud`,
  }));
}

/**
 * Fetch user profile
 */
export async function getProfile(accessToken: string): Promise<any> {
  return callBigBrainAPI<any>("/profile", { accessToken }, fetch);
}

/**
 * Update profile name
 */
export async function updateProfileName(
  accessToken: string,
  name: string,
): Promise<any> {
  return callBigBrainAPI<any>(
    "/update_profile_name",
    {
      accessToken,
      method: "PUT",
      body: { name },
    },
    fetch,
  );
}

/**
 * Fetch profile emails
 */
export async function getProfileEmails(accessToken: string): Promise<any[]> {
  return callBigBrainAPI<any[]>("/profile_emails/list", { accessToken }, fetch);
}

/**
 * Fetch identities
 */
export async function getIdentities(accessToken: string): Promise<any[]> {
  return callBigBrainAPI<any[]>("/identities", { accessToken }, fetch);
}

/**
 * Get team subscription/plan information
 * Returns null if team is on free plan or no subscription found
 */
export async function getTeamSubscription(
  accessToken: string,
  teamId: number,
): Promise<any | null> {
  try {
    return await callBigBrainAPI<any>(
      "/teams/{team_id}/get_orb_subscription",
      {
        accessToken,
        pathParams: { team_id: teamId },
      },
      fetch,
    );
  } catch {
    return null;
  }
}

/**
 * Get deployment insights
 */
export async function getDeploymentInsights(
  accessToken: string,
  teamId: number,
  projectId: number,
  deploymentName: string,
  period: { from: string; to: string },
): Promise<any> {
  const queries = [
    queryUsage(
      {
        queryId: DATABRICKS_QUERY_IDS.INSIGHTS,
        teamId,
        projectId,
        deploymentName,
        from: period.from,
        to: period.to,
        componentPath: ROOT_COMPONENT_PATH,
      },
      accessToken,
      fetch,
    ),
  ];

  const [functionExecutions] = await Promise.all(queries);

  return {
    functionExecutions,
  };
}

/**
 * Create a deploy key for a deployment
 */
export async function createDeployKey(
  accessToken: string,
  deploymentName: string,
  keyName: string,
): Promise<any> {
  return callBigBrainManagementAPI<any>(
    "/deployments/{deployment_name}/deploy_keys",
    {
      accessToken,
      method: "POST",
      pathParams: { deployment_name: deploymentName },
      body: { keyName },
    },
    fetch,
  );
}

/**
 * Rollback a deployment to a specific version
 */
export async function rollbackDeployment(
  accessToken: string,
  deploymentName: string,
  targetVersion: string,
): Promise<any> {
  return callBigBrainManagementAPI<any>(
    "/deployments/{deployment_name}/rollback",
    {
      accessToken,
      method: "POST",
      pathParams: { deployment_name: deploymentName },
      body: { targetVersion },
    },
    fetch,
  );
}

/**
 * Disable a function in a deployment
 */
export async function disableFunction(
  accessToken: string,
  deploymentName: string,
  functionName: string,
): Promise<any> {
  return callBigBrainManagementAPI<any>(
    "/deployments/{deployment_name}/functions/{function_name}/disable",
    {
      accessToken,
      method: "POST",
      pathParams: {
        deployment_name: deploymentName,
        function_name: functionName,
      },
    },
    fetch,
  );
}

/**
 * Clear cache for a deployment
 */
export async function clearCache(
  accessToken: string,
  deploymentName: string,
): Promise<any> {
  return callBigBrainManagementAPI<any>(
    "/deployments/{deployment_name}/cache/clear",
    {
      accessToken,
      method: "POST",
      pathParams: { deployment_name: deploymentName },
    },
    fetch,
  );
}

// Re-export constants for convenience
export { BIG_BRAIN_URL, DATABRICKS_QUERY_IDS, ROOT_COMPONENT_PATH };
