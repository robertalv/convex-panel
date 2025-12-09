/**
 * Teams, projects, and profile operations
 * Handles fetching teams, projects, deployments, and user profiles
 */

import { ROUTES, SYSTEM_QUERIES, CONVEX_API_DOMAIN, CONVEX_PROVISION_DOMAIN } from '../constants';
import type {
  ProfileResponse,
  TeamResponse,
  ProjectResponse,
  DeploymentResponse,
} from './types';
import { extractDeploymentName, parseAccessToken } from './utils';
import { callConvexQuery } from './helpers';

/**
 * Fetch user profile to get team information
 * @param accessToken - The access token to use
 * @param useBearerToken - Whether to use bearer token format
 * @returns The profile response
 */
/**
 * Fetch user profile to get team information
 * @param accessToken - The access token to use
 * @param useBearerToken - Whether to use bearer token format
 * @returns The profile response
 */
export async function fetchProfile(
  accessToken: string,
  useBearerToken: boolean = true
): Promise<ProfileResponse | null> {
  const endpoint = `https://${CONVEX_API_DOMAIN}${ROUTES.DASHBOARD_PROFILE}`;
  const authHeader = useBearerToken
    ? `Bearer ${accessToken}`
    : `Convex ${accessToken}`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
      'Convex-Client': 'dashboard-0.0.0',
    },
  });

  if (!response.ok) {
    // Handle service account error - this is expected when using service account tokens
    if (response.status === 403 || response.status === 400) {
      const error = await response.json().catch(() => null);
      if (error?.code === 'ServiceAccount') {
        return null; // Return null gracefully for service accounts
      }
    }
    
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(`Failed to fetch profile: ${response.status}, message: ${error.message || 'Unknown error'}`);
  }

  return response.json();
}

/**
 * Get token details (works with both Team Access Tokens and OAuth tokens)
 * Returns teamId directly from the token
 * @param accessToken - The access token to use
 * @returns The token details
 */
export async function getTokenDetails(
  accessToken: string,
): Promise<{ teamId?: number; [key: string]: any }> {
  const endpoint = `https://${CONVEX_API_DOMAIN}${ROUTES.TOKEN_DETAILS}`;
  const authHeader = `Bearer ${accessToken}`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = errorText || 'Unknown error';
    try {
      const error = JSON.parse(errorText);
      errorMessage = error.message || errorText || 'Unknown error';
    } catch {
      // If not JSON, use errorText as-is
    }
    throw new Error(`Failed to get token details: ${response.status}, message: ${errorMessage}`);
  }

  return response.json();
}

/**
 * List all teams (if using OAuth token or team access token)
 * @param accessToken - The access token to use
 * @param useBearerToken - Whether to use bearer token format
 * @returns The list of teams
 */
export async function listTeams(
  accessToken: string,
  useBearerToken: boolean = false
): Promise<TeamResponse[]> {
  const endpoint = `https://${CONVEX_API_DOMAIN}${ROUTES.TEAMS}`;
  const authHeader = useBearerToken
    ? `Bearer ${accessToken}`
    : `Convex ${accessToken}`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(`Failed to list teams: ${response.status}, message: ${error.message || 'Unknown error'}`);
  }

  const result = await response.json();
  return Array.isArray(result) ? result : (result.teams || []);
}

/**
 * Get team and project from deployment name
 * @param deploymentName - The deployment name
 * @param accessToken - The access token to use
 * @param useBearerToken - Whether to use bearer token format
 * @returns The team and project
 */
export async function getTeamFromDeployment(
  deploymentName: string,
  accessToken: string,
  useBearerToken: boolean = false
): Promise<{ teamId: number; teamSlug?: string; projectId?: number; projectSlug?: string }> {
  // Use provision domain as shown in Convex reference code
  const endpoint = `https://${CONVEX_PROVISION_DOMAIN}${ROUTES.TEAM_FROM_DEPLOYMENT.replace('{deploymentName}', deploymentName)}`;
  const authHeader = useBearerToken
    ? `Bearer ${accessToken}`
    : `Convex ${accessToken}`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(`Failed to get team from deployment: ${response.status}, message: ${error.message || 'Unknown error'}`);
  }

  const result = await response.json();
  // Response format: { team: string (slug), project: string (slug), teamId: number, projectId: number }
  return {
    teamId: result.teamId,
    teamSlug: result.team,
    projectId: result.projectId,
    projectSlug: result.project,
  };
}

/**
 * Fetch teams - get list of teams for the authenticated user (dashboard API)
 * @param accessToken - The access token to use
 * @param useBearerToken - Whether to use bearer token format
 * @returns The list of teams
 */
export async function fetchTeams(
  accessToken: string,
  useBearerToken: boolean = true
): Promise<TeamResponse[]> {
  const endpoint = `https://${CONVEX_API_DOMAIN}${ROUTES.FETCH_TEAMS}`;
  const authHeader = useBearerToken
    ? `Bearer ${accessToken}`
    : `Convex ${accessToken}`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
      'Convex-Client': 'dashboard-0.0.0',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(`Failed to fetch teams: ${response.status}, message: ${error.message || 'Unknown error'}`);
  }

  const result = await response.json();
  return Array.isArray(result) ? result : (result.teams || []);
}

/**
 * Fetch projects for a team
 * @param teamId - The team ID
 * @param accessToken - The access token to use
 * @param useBearerToken - Whether to use bearer token format
 * @returns The list of projects
 */
export async function fetchProjects(
  teamId: number,
  accessToken: string,
  useBearerToken: boolean = true
): Promise<ProjectResponse[]> {
  const endpoint = `https://${CONVEX_API_DOMAIN}${ROUTES.FETCH_PROJECTS.replace('{teamId}', teamId.toString())}`;
  const authHeader = useBearerToken
    ? `Bearer ${accessToken}`
    : `Convex ${accessToken}`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(`Failed to fetch projects: ${response.status}, message: ${error.message || 'Unknown error'}`);
  }

  const result = await response.json();
  return Array.isArray(result) ? result : (result.projects || []);
}

/**
 * Fetch deployments (instances) for a project
 * @param projectId - The project ID
 * @param accessToken - The access token to use
 * @param useBearerToken - Whether to use bearer token format
 * @returns The list of deployments
 */
export async function fetchDeployments(
  projectId: number,
  accessToken: string,
  useBearerToken: boolean = true
): Promise<DeploymentResponse[]> {
  const endpoint = `https://${CONVEX_API_DOMAIN}${ROUTES.FETCH_DEPLOYMENTS.replace('{projectId}', projectId.toString())}`;
  const authHeader = useBearerToken
    ? `Bearer ${accessToken}`
    : `Convex ${accessToken}`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(`Failed to fetch deployments: ${response.status}, message: ${error.message || 'Unknown error'}`);
  }

  const result = await response.json();
  return Array.isArray(result) ? result : (result.deployments || []);
}

/**
 * Fetch project information from Convex API
 * Attempts to get project and team information
 * @param adminClient - The admin client
 * @param deploymentUrl - The deployment URL
 * @param authToken - The authentication token
 * @param teamSlug - The team slug
 * @param projectSlug - The project slug
 * @returns The project and team information
 */
export async function fetchProjectInfo(
  adminClient: any,
  deploymentUrl: string | undefined,
  authToken: string | undefined,
  teamSlug?: string,
  projectSlug?: string
): Promise<{
  team?: {
    id: string;
    name: string;
    slug: string;
  };
  project?: {
    id: string;
    name: string;
    slug: string;
    teamId: string;
  };
}> {
  const deploymentName = extractDeploymentName(deploymentUrl);

  const tokenInfo = parseAccessToken(authToken);
  const effectiveTeamSlug = teamSlug || tokenInfo.teamSlug;
  const effectiveProjectSlug = projectSlug || tokenInfo.projectSlug;

  if (effectiveTeamSlug && effectiveProjectSlug) {
    const result = {
      team: effectiveTeamSlug ? {
        id: effectiveTeamSlug,
        name: effectiveTeamSlug,
        slug: effectiveTeamSlug,
      } : undefined,
      project: effectiveProjectSlug ? {
        id: effectiveProjectSlug,
        name: effectiveProjectSlug,
        slug: effectiveProjectSlug,
        teamId: effectiveTeamSlug,
      } : undefined,
    };
    return result;
  }

  // Try Big Brain API directly (may fail due to CORS, but worth trying)
  if (deploymentName && authToken) {
    try {
      // Determine the Big Brain URL
      const provisionHost = (typeof process !== 'undefined' && process.env?.CONVEX_PROVISION_HOST) 
        ? process.env.CONVEX_PROVISION_HOST 
        : 'https://api.convex.dev';
      const bigBrainUrl = `${provisionHost}/api`;
      const endpoint = `${bigBrainUrl}/deployment/${deploymentName}/team_and_project`;
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Returns: { team: string, project: string, teamId: number, projectId: number }
        // The 'team' and 'project' fields are the actual slugs/names we need
        if (data.teamId && data.projectId) {
          // Use the slugs directly from the API response
          // The 'team' and 'project' fields are the actual project names/slugs
          return {
            team: {
              id: data.teamId.toString(),
              name: data.team || '', // Use slug as name
              slug: data.team || '',
            },
            project: {
              id: data.projectId.toString(),
              name: data.project || '', // This is the actual project name from Big Brain API!
              slug: data.project || '',
              teamId: data.teamId.toString(),
            },
          };
        }
      }
    } catch (apiErr: any) {
      // Big Brain API call failed (likely CORS), continue to other methods
    }
  }

  // Try using callConvexQuery with various system query paths
  if (deploymentUrl && authToken) {
    try {
      // Try _system/frontend/convexSiteUrl first
      try {
        await callConvexQuery(deploymentUrl, authToken, '_system/frontend/convexSiteUrl', {});
      } catch (err) {
        // Ignore errors
      }
      
      // Try _system/project:info via adminClient
      if (adminClient) {
        try {
          const projectInfo = await adminClient.query(SYSTEM_QUERIES.PROJECT_INFO, {});
          
          if (projectInfo && (projectInfo.project || projectInfo.team)) {
            return {
              team: projectInfo.team ? {
                id: projectInfo.team.id?.toString() || '',
                name: projectInfo.team.name || '',
                slug: projectInfo.team.slug || '',
              } : undefined,
              project: projectInfo.project ? {
                id: projectInfo.project.id?.toString() || '',
                name: projectInfo.project.name || '', // Use actual project name from system, not extracted
                slug: projectInfo.project.slug || projectSlug || '',
                teamId: projectInfo.project.teamId?.toString() || projectInfo.team?.id?.toString() || '',
              } : undefined,  
            };
          }
        } catch (err) {
          // Ignore errors
        }
      }
      
      // Try other system queries that might have project info using callConvexQuery
      const systemQueriesToTry = [
        '_system/frontend/projectInfo',
        '_system/cli/projectInfo',
        '_system/project/info',
        '_system/project:info',
        SYSTEM_QUERIES.PROJECT_INFO,
      ];
      
      for (const queryPath of systemQueriesToTry) {
        try {
          const result = await callConvexQuery(deploymentUrl, authToken, queryPath, {});
          
          // Extract value if it's wrapped in a result object
          const data = result?.value || result;
          
          if (data && (data.project || data.team)) {
            return {
              team: data.team ? {
                id: data.team.id?.toString() || data.team.slug || '',
                name: data.team.name || data.team.slug || '',
                slug: data.team.slug || '',
              } : undefined,
              project: data.project ? {
                id: data.project.id?.toString() || data.project.slug || '',
                name: data.project.name || data.project.slug || '',
                slug: data.project.slug || projectSlug || '',
                teamId: data.project.teamId?.toString() || data.team?.id?.toString() || '',
              } : undefined,
            };
          }
        } catch (err) {
          // Continue to next query
        }
      }
    } catch (err) {
      // System query failed, fall back to other methods
    }
  }
  
  // Fallback: try adminClient query if we haven't already
  if (adminClient) {
    try {
      const projectInfo = await adminClient.query(SYSTEM_QUERIES.PROJECT_INFO, {});
      
      if (projectInfo && (projectInfo.project || projectInfo.team)) {
        return {
          team: projectInfo.team ? {
            id: projectInfo.team.id?.toString() || '',
            name: projectInfo.team.name || '',
            slug: projectInfo.team.slug || '',
          } : undefined,
          project: projectInfo.project ? {
            id: projectInfo.project.id?.toString() || '',
            name: projectInfo.project.name || '',
            slug: projectInfo.project.slug || projectSlug || '',
            teamId: projectInfo.project.teamId?.toString() || projectInfo.team?.id?.toString() || '',
          } : undefined,  
        };
      }
    } catch (err) {
      // Ignore errors
    }
  }

  // If we can't get the real project name, return minimal info
  return {
    project: effectiveProjectSlug ? {
      id: deploymentName || '',
      name: effectiveProjectSlug,
      slug: effectiveProjectSlug,
      teamId: effectiveTeamSlug || '',
    } : undefined,
  };
}

