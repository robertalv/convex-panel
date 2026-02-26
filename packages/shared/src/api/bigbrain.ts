/**
 * BigBrain API Client
 *
 * Shared client for Convex's BigBrain API (api.convex.dev/api/dashboard)
 * Used for fetching teams, projects, deployments, insights, and other dashboard data.
 *
 * This module is platform-agnostic and accepts a custom fetch function
 * to support different environments (browser, Node.js, Tauri).
 */

import type { FetchFn } from "./types";
import type { PlanType } from "../types/plan";

// Default fetch function - uses native fetch
const defaultFetch: FetchFn = (input, init) => fetch(input, init);

/**
 * BigBrain API base URL
 * This is the production URL for Convex's management/dashboard API
 */
export const BIG_BRAIN_URL = "https://api.convex.dev";

/**
 * BigBrain Dashboard API base path
 */
export const BIG_BRAIN_DASHBOARD_PATH = "/api/dashboard";

/**
 * Client identifier header value
 */
export const CONVEX_CLIENT_ID = "convex-panel-1.0.0";
const BIG_BRAIN_RESPONSE_TIMEOUT_MS = 15000;

// ============================================================================
// Types
// ============================================================================

export interface Team {
  id: number;
  name: string;
  slug: string;
  creator?: number;
  suspended?: boolean;
  managedBy?: string | null;
}

export interface Project {
  id: number;
  name: string;
  slug: string;
  teamId: number;
  creator?: number;
  isDemo?: boolean;
}

export interface Deployment {
  id: number;
  name: string;
  projectId: number;
  deploymentType: "dev" | "prod" | "preview";
  kind?: "cloud" | "local";
  creator?: number;
  previewIdentifier?: string | null;
  url?: string;
}

export interface UserProfile {
  id?: number;
  name?: string;
  email?: string;
  profilePictureUrl?: string;
}

export interface TeamMember {
  id: number;
  name?: string | null;
  email: string;
  role: string;
}

export interface TeamSubscription {
  plan: {
    id: string;
    name: string;
    planType: PlanType | null;
    description?: string;
    status?: string;
  };
}

export interface TokenDetails {
  type: "accessToken" | "projectToken" | "deploymentToken" | "deployKey";
  teamId?: number;
  projectId?: number;
  deploymentId?: number;
  deploymentName?: string;
}

export interface AccessToken {
  accessToken: string;
  serializedAccessToken: string;
  name: string;
  creator: number;
  creationTime: number;
  lastUsedTime?: number | null;
}

export interface TeamAndProject {
  teamId: number;
  teamSlug: string;
  projectId: number;
  projectSlug: string;
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
// Core API Functions
// ============================================================================

async function readTextWithTimeout(
  response: Response,
  context: string,
  timeoutMs = BIG_BRAIN_RESPONSE_TIMEOUT_MS,
): Promise<string> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      response.text(),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(
            new Error(
              `[BigBrain] Timed out reading ${context} response after ${timeoutMs / 1000}s`,
            ),
          );
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

function parseJsonOrThrow<T>(text: string, context: string): T {
  try {
    return JSON.parse(text) as T;
  } catch (err) {
    throw new Error(
      `[BigBrain] Failed to parse ${context} response JSON: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }
}

/**
 * Make a request to the BigBrain Dashboard API
 *
 * @param path - API path (e.g., "/teams" or "/teams/{team_id}/projects")
 * @param options - Request options
 * @param fetchFn - Optional custom fetch function
 * @returns The API response
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
  fetchFn: FetchFn = defaultFetch,
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

  console.log(`[BigBrain] Response ${response.status} ${response.statusText} ${url}`);

  if (!response.ok) {
    const errorText = await readTextWithTimeout(
      response,
      "error",
      5000,
    ).catch(() => "Unknown error");
    console.error(`[BigBrain] Request failed:`, {
      status: response.status,
      statusText: response.statusText,
      error: errorText,
    });
    throw new Error(
      `BigBrain API error: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }

  const rawText = await readTextWithTimeout(response, "success");
  return parseJsonOrThrow<T>(rawText, "success");
}

/**
 * Make a request to the BigBrain Management API (v1)
 * This is for endpoints under /v1 like token_details
 *
 * @param path - API path (e.g., "/token_details")
 * @param options - Request options
 * @param fetchFn - Optional custom fetch function
 * @returns The API response
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
  fetchFn: FetchFn = defaultFetch,
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

  console.log(
    `[BigBrain Management] Response ${response.status} ${response.statusText} ${url}`,
  );

  if (!response.ok) {
    const errorText = await readTextWithTimeout(
      response,
      "management error",
      5000,
    ).catch(() => "Unknown error");
    console.error(`[BigBrain Management] Request failed:`, {
      status: response.status,
      statusText: response.statusText,
      error: errorText,
    });
    throw new Error(
      `BigBrain Management API error: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }

  const rawText = await readTextWithTimeout(response, "management success");
  return parseJsonOrThrow<T>(rawText, "management success");
}

// ============================================================================
// Team & Project Functions
// ============================================================================

/**
 * Fetch all teams the user has access to
 */
export async function getTeams(
  accessToken: string,
  fetchFn: FetchFn = defaultFetch,
): Promise<Team[]> {
  return callBigBrainAPI<Team[]>("/teams", { accessToken }, fetchFn);
}

/**
 * Fetch all projects for a team
 */
export async function getProjects(
  accessToken: string,
  teamId: number,
  fetchFn: FetchFn = defaultFetch,
): Promise<Project[]> {
  return callBigBrainAPI<Project[]>(
    "/teams/{team_id}/projects",
    {
      accessToken,
      pathParams: { team_id: teamId },
    },
    fetchFn,
  );
}

/**
 * Fetch all deployments for a project
 */
export async function getDeployments(
  accessToken: string,
  projectId: number,
  fetchFn: FetchFn = defaultFetch,
): Promise<Deployment[]> {
  const deployments = await callBigBrainAPI<Deployment[]>(
    "/projects/{project_id}/instances",
    {
      accessToken,
      pathParams: { project_id: projectId },
    },
    fetchFn,
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
export async function getProfile(
  accessToken: string,
  fetchFn: FetchFn = defaultFetch,
): Promise<UserProfile> {
  return callBigBrainAPI<UserProfile>("/profile", { accessToken }, fetchFn);
}

/**
 * Get team subscription/plan information
 * Returns null if team is on free plan or no subscription found
 */
export async function getTeamSubscription(
  accessToken: string,
  teamId: number,
  fetchFn: FetchFn = defaultFetch,
): Promise<TeamSubscription | null> {
  try {
    return await callBigBrainAPI<TeamSubscription>(
      "/teams/{team_id}/get_orb_subscription",
      {
        accessToken,
        pathParams: { team_id: teamId },
      },
      fetchFn,
    );
  } catch {
    // 404 or other errors typically mean free plan
    return null;
  }
}

/**
 * Fetch all members of a team
 */
export async function getTeamMembers(
  accessToken: string,
  teamId: number,
  fetchFn: FetchFn = defaultFetch,
): Promise<TeamMember[]> {
  try {
    return await callBigBrainAPI<TeamMember[]>(
      "/teams/{team_id}/members",
      {
        accessToken,
        pathParams: { team_id: teamId },
      },
      fetchFn,
    );
  } catch (error) {
    console.error("[BigBrain] Failed to fetch team members:", error);
    return [];
  }
}

// ============================================================================
// Token & Auth Functions
// ============================================================================

/**
 * Get details about the current token
 */
export async function getTokenDetails(
  accessToken: string,
  fetchFn: FetchFn = defaultFetch,
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
 * Get team and project info from deployment name
 */
export async function getTeamFromDeployment(
  deploymentName: string,
  accessToken: string,
  fetchFn: FetchFn = defaultFetch,
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
 * Create a deploy key for a deployment
 */
export async function createDeployKey(
  accessToken: string,
  deploymentName: string,
  keyName: string,
  fetchFn: FetchFn = defaultFetch,
): Promise<{ key: string }> {
  const url = `${BIG_BRAIN_URL}/v1/deployments/${deploymentName}/create_deploy_key`;

  console.log(`[BigBrain] POST ${url}`);

  const response = await fetchFn(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Convex-Client": CONVEX_CLIENT_ID,
    },
    body: JSON.stringify({ name: keyName }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(
      `Failed to create deploy key: ${response.status} - ${errorText}`,
    );
  }

  // API returns { deployKey: string }
  const result: { deployKey: string } = await response.json();
  return { key: result.deployKey };
}

/**
 * Get access tokens (deploy keys) for a specific deployment
 */
export async function getDeploymentAccessTokens(
  accessToken: string,
  deploymentName: string,
  fetchFn: FetchFn = defaultFetch,
): Promise<AccessToken[]> {
  return callBigBrainAPI<AccessToken[]>(
    "/instances/{deployment_name}/access_tokens",
    {
      accessToken,
      pathParams: { deployment_name: deploymentName },
    },
    fetchFn,
  );
}

/**
 * Get access tokens for a specific project
 */
export async function getProjectAccessTokens(
  accessToken: string,
  projectId: number,
  fetchFn: FetchFn = defaultFetch,
): Promise<AccessToken[]> {
  return callBigBrainAPI<AccessToken[]>(
    "/projects/{project_id}/access_tokens",
    {
      accessToken,
      pathParams: { project_id: projectId },
    },
    fetchFn,
  );
}

/**
 * Create a new access token (deploy key)
 *
 * @param accessToken - User's authentication token
 * @param params - Token creation parameters
 * @param fetchFn - Optional custom fetch function
 * @returns The created access token
 */
export async function createAccessToken(
  accessToken: string,
  params: {
    name: string;
    teamId: number;
    deploymentId?: number | null;
    projectId?: number | null;
    permissions?: string[] | null;
  },
  fetchFn: FetchFn = defaultFetch,
): Promise<{ accessToken: string }> {
  return callBigBrainAPI<{ accessToken: string }>(
    "/authorize",
    {
      accessToken,
      method: "POST",
      body: {
        authnToken: accessToken,
        deviceName: params.name,
        teamId: params.teamId,
        deploymentId: params.deploymentId,
        projectId: params.projectId,
        permissions: params.permissions,
      },
    },
    fetchFn,
  );
}

/**
 * Delete an access token
 */
export async function deleteAccessToken(
  accessToken: string,
  tokenAccessToken: string,
  fetchFn: FetchFn = defaultFetch,
): Promise<void> {
  await callBigBrainAPI(
    "/teams/delete_access_token",
    {
      accessToken,
      method: "POST",
      body: { accessToken: tokenAccessToken },
    },
    fetchFn,
  );
}

// ============================================================================
// Usage & Insights Functions
// ============================================================================

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
 * This is used for insights and other usage analytics
 *
 * @param params - Query parameters
 * @param accessToken - Bearer token for authentication
 * @param fetchFn - Optional custom fetch function
 * @returns Array of query results (each row is a string array)
 */
export async function queryUsage(
  params: UsageQueryParams,
  accessToken: string,
  fetchFn: FetchFn = defaultFetch,
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

/**
 * Known Databricks query IDs
 */
export const DATABRICKS_QUERY_IDS = {
  /** Insights query - returns function issues like OCC, bytes read limits, etc. */
  INSIGHTS: "9ab3b74e-a725-480b-88a6-43e6bd70bd82",
  /** Team summary - aggregated usage metrics */
  TEAM_SUMMARY: "15fbb132-6641-4f17-9156-b05e9ee966d9",
  /** Function breakdown by team */
  TEAM_FUNCTION_BREAKDOWN: "8e6592dd-12a0-4ddf-bc79-7498e07352d4",
} as const;

/**
 * Usage summary data returned from team summary query
 */
export interface UsageSummary {
  databaseStorage: number;
  databaseBandwidth: number;
  fileStorage: number;
  fileBandwidth: number;
  functionCalls: number;
  actionCompute: number;
  vectorStorage: number;
  vectorBandwidth: number;
}

/**
 * Parse team summary query response into UsageSummary
 */
export function parseUsageSummary(data: string[][]): UsageSummary | null {
  if (!data || data.length === 0) return null;

  const row = data[0];
  // Row format: [teamId, databaseStorage, databaseBandwidth, functionCalls, actionCompute, fileStorage, fileBandwidth, vectorStorage, vectorBandwidth]
  return {
    databaseStorage: Number(row[1]) || 0,
    databaseBandwidth: Number(row[2]) || 0,
    functionCalls: Number(row[3]) || 0,
    actionCompute: (Number(row[4]) || 0) / 60 / 60, // Convert GB-seconds to GB-hours
    fileStorage: Number(row[5]) || 0,
    fileBandwidth: Number(row[6]) || 0,
    vectorStorage: Number(row[7]) || 0,
    vectorBandwidth: Number(row[8]) || 0,
  };
}

/**
 * Fetch team usage summary
 */
export async function fetchTeamUsageSummary(
  accessToken: string,
  teamId: number,
  options?: {
    projectId?: number | null;
    from?: string;
    to?: string;
    componentPath?: string;
  },
  fetchFn: FetchFn = defaultFetch,
): Promise<UsageSummary | null> {
  const data = await queryUsage(
    {
      queryId: DATABRICKS_QUERY_IDS.TEAM_SUMMARY,
      teamId,
      projectId: options?.projectId,
      from: options?.from,
      to: options?.to,
      componentPath: options?.componentPath,
    },
    accessToken,
    fetchFn,
  );

  return parseUsageSummary(data);
}

/**
 * Root component path constant (used in usage queries)
 */
export const ROOT_COMPONENT_PATH = "-root-component-";

/**
 * Extract deployment name from a Convex URL
 */
export function extractDeploymentName(deploymentUrl: string): string | null {
  if (!deploymentUrl) return null;

  try {
    const url = new URL(deploymentUrl);
    const hostname = url.hostname;

    if (hostname.endsWith(".convex.cloud")) {
      return hostname.replace(".convex.cloud", "");
    }

    if (hostname.endsWith(".convex.site")) {
      return hostname.replace(".convex.site", "");
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Normalize a token by removing "Convex " prefix if present
 * BigBrain API uses Bearer tokens without the "Convex " prefix
 */
export function normalizeBearerToken(token: string): string {
  return token.startsWith("Convex ") ? token.substring(7) : token;
}

// ============================================================================
// Profile Management Types
// ============================================================================

export interface ProfileEmail {
  email: string;
  verified: boolean;
  primary: boolean;
}

export interface Identity {
  id: string;
  providers: Array<"google" | "github" | "vercel">;
  email?: string | null;
}

export interface DiscordAccount {
  id: string;
  details: {
    username: string;
    discriminator: string;
    avatar?: string | null;
    global_name?: string | null;
  };
}

export interface Invoice {
  id: string;
  status: string;
  hasFailedPayment: boolean;
  invoiceDate: string;
  amountDue: number;
  currency: string;
}

// ============================================================================
// Profile Management Functions
// ============================================================================

/**
 * Update the user's profile name
 */
export async function updateProfileName(
  accessToken: string,
  name: string,
  fetchFn: FetchFn = defaultFetch,
): Promise<void> {
  await callBigBrainAPI(
    "/update_profile_name",
    {
      accessToken,
      method: "PUT",
      body: { name },
    },
    fetchFn,
  );
}

/**
 * Get profile emails
 */
export async function getProfileEmails(
  accessToken: string,
  fetchFn: FetchFn = defaultFetch,
): Promise<ProfileEmail[]> {
  return callBigBrainAPI<ProfileEmail[]>(
    "/profile_emails/list",
    { accessToken },
    fetchFn,
  );
}

/**
 * Get connected identities (OAuth providers)
 */
export async function getIdentities(
  accessToken: string,
  fetchFn: FetchFn = defaultFetch,
): Promise<Identity[]> {
  return callBigBrainAPI<Identity[]>("/identities", { accessToken }, fetchFn);
}

/**
 * Unlink an identity provider
 */
export async function unlinkIdentity(
  accessToken: string,
  provider: "google" | "github" | "vercel",
  fetchFn: FetchFn = defaultFetch,
): Promise<void> {
  await callBigBrainAPI(
    "/unlink_identity",
    {
      accessToken,
      method: "POST",
      body: { provider },
    },
    fetchFn,
  );
}

/**
 * Get linked Discord accounts
 */
export async function getDiscordAccounts(
  accessToken: string,
  fetchFn: FetchFn = defaultFetch,
): Promise<DiscordAccount[]> {
  // API returns { accounts: [...] } structure
  const response = await callBigBrainAPI<{ accounts: DiscordAccount[] }>(
    "/discord/accounts",
    { accessToken },
    fetchFn,
  );
  return response?.accounts ?? [];
}

/**
 * Unlink a Discord account
 */
export async function unlinkDiscordAccount(
  accessToken: string,
  discordUserId: string,
  fetchFn: FetchFn = defaultFetch,
): Promise<void> {
  await callBigBrainAPI(
    "/discord/unlink",
    {
      accessToken,
      method: "POST",
      body: { discordUserId },
    },
    fetchFn,
  );
}

/**
 * Delete the user's account
 */
export async function deleteAccount(
  accessToken: string,
  fetchFn: FetchFn = defaultFetch,
): Promise<void> {
  await callBigBrainAPI(
    "/delete_account",
    {
      accessToken,
      method: "POST",
    },
    fetchFn,
  );
}

/**
 * Get invoices for a team
 * Filters invoices to only include those from April 29, 2024 onwards
 */
export async function getInvoices(
  accessToken: string,
  teamId: number,
  fetchFn: FetchFn = defaultFetch,
): Promise<Invoice[]> {
  const response = await fetchFn(
    `${BIG_BRAIN_URL}${BIG_BRAIN_DASHBOARD_PATH}/teams/${teamId}/list_invoices`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Convex-Client": CONVEX_CLIENT_ID,
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
