/**
 * Big Brain API client
 * Handles calls to the Big Brain API at api.convex.dev
 */

import { CONVEX_API_DOMAIN } from '../constants';

/**
 * Call Big Brain API endpoint
 * @param path - API path (e.g., "/teams/{team_id}/usage/query")
 * @param pathParams - Path parameters to replace in the path
 * @param queryParams - Query parameters
 * @param accessToken - Bearer token for authentication
 * @returns The API response data
 */
export async function callBigBrainAPI<T = any>({
  path,
  pathParams,
  queryParams,
  accessToken,
}: {
  path: string;
  pathParams?: Record<string, string | number>;
  queryParams?: Record<string, string | number | undefined | null>;
  accessToken: string;
}): Promise<T> {
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

  // Big Brain API is at provision.convex.dev/api/dashboard
  const url = `https://${CONVEX_API_DOMAIN}/api/dashboard${finalPath}${queryString.toString() ? `?${queryString.toString()}` : ''}`;

  // Get the current window origin, if available (e.g., in browser)
  let origin = '';
  if (typeof window !== 'undefined' && window.location?.origin) {
    origin = window.location.origin;
  }

  const authHeader = `Bearer ${accessToken}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
      'Convex-Client': 'dashboard-0.0.0',
      ...(origin ? { 'Origin': origin } : {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorData: any;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { message: errorText };
    }

    throw new Error(
      `Big Brain API error: ${response.status} ${response.statusText} - ${errorData.message || errorText}`
    );
  }

  const data = await response.json();

  return data as T;
}

/**
 * Query Big Brain usage endpoint
 * @param options - Query options including teamId, queryId, and other parameters
 * @returns The usage query result
 */
export async function queryBigBrainUsage({
  teamId,
  queryId,
  projectId,
  deploymentName,
  period,
  componentPrefix,
  functionId,
  tableName,
  accessToken,
}: {
  teamId: number;
  queryId: string;
  projectId?: number | null;
  deploymentName?: string;
  period?: { from: string; to: string } | null;
  componentPrefix?: string | null;
  functionId?: string;
  tableName?: string;
  accessToken: string;
}): Promise<any[]> {
  const queryParams: Record<string, string | number | undefined> = {
    queryId,
  };

  if (projectId !== undefined && projectId !== null) {
    queryParams.projectId = projectId;
  }

  if (deploymentName) {
    queryParams.deploymentName = deploymentName;
  }

  if (functionId) {
    queryParams.udfId = functionId;
  }

  if (tableName) {
    queryParams.tableName = tableName;
  }

  if (period) {
    // Convert ISO strings to date strings (YYYY-MM-DD)
    queryParams.from = period.from.split('T')[0];
    queryParams.to = period.to.split('T')[0];
  }

  if (componentPrefix) {
    const rootComponentPath = '-root-component-';
    queryParams.componentPath = componentPrefix === 'app' ? rootComponentPath : componentPrefix;
  }

  return callBigBrainAPI<any[]>({
    path: '/teams/{team_id}/usage/query',
    pathParams: {
      team_id: teamId,
    },
    queryParams,
    accessToken,
  });
}
