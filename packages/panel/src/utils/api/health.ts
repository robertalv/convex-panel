/**
 * Health checks and insights
 * Handles fetching deployment health information, server version, and insights
 */

import type { Insight } from './types';
import { callConvexQuery } from './helpers';
import { SYSTEM_QUERIES } from '../constants';
import { transformInsightsData, useInsightsPeriod } from './insights';
import { queryBigBrainUsage } from './bigBrain';
import { getTeamFromDeployment, getTokenDetails } from './teams';
import { extractDeploymentName } from './utils';

/**
 * Fetch the last push event timestamp from the Convex deployment
 * @param deploymentUrl - The URL of the Convex deployment
 * @param authToken - The authentication token for the Convex deployment
 * @param useMockData - Whether to use mock data instead of making API calls
 * @returns The last push event timestamp, or null if unavailable
 */
export async function fetchLastPushEvent(
  deploymentUrl: string,
  authToken: string,
  useMockData = false
): Promise<{ _creationTime: number } | null> {
  if (useMockData) {
    // Return mock data - 39 minutes ago
    const date = new Date();
    date.setMinutes(date.getMinutes() - 39);
    return {
      _creationTime: date.getTime(),
    };
  }

  try {
    let data = await callConvexQuery(
      deploymentUrl,
      authToken,
      SYSTEM_QUERIES.LAST_PUSH_EVENT,
      {}
    );

    if (data === null || data === undefined) {
      return null;
    }

    let eventData = data;
    if (data && typeof data === 'object' && 'value' in data) {
      eventData = data.value;
    }
    
    if (eventData === null || eventData === undefined) {
      return null;
    }
    
    if (eventData && typeof eventData === 'object' && '_creationTime' in eventData) {
      const creationTime = eventData._creationTime;
      const timestamp = typeof creationTime === 'number' 
        ? (creationTime < 1e12 ? creationTime * 1000 : creationTime)
        : new Date(creationTime).getTime();
      return { _creationTime: timestamp };
    }
    
    if (eventData && typeof eventData === 'object') {
      if ('timestamp' in eventData || 'time' in eventData || 'date' in eventData) {
        const timestamp = eventData.timestamp || eventData.time || eventData.date;
        const ms = typeof timestamp === 'number' 
          ? (timestamp < 1e12 ? timestamp * 1000 : timestamp)
          : new Date(timestamp).getTime();
        return { _creationTime: ms };
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Fetch the Convex server version
 * @param deploymentUrl - The URL of the Convex deployment
 * @param authToken - The authentication token for the Convex deployment
 * @param useMockData - Whether to use mock data instead of making API calls
 * @returns The server version string, or null if unavailable
 */
export async function fetchServerVersion(
  deploymentUrl: string,
  authToken: string,
  useMockData = false
): Promise<string | null> {
  if (useMockData) {
    return '1.29.3';
  }

  try {
    let data = await callConvexQuery(
      deploymentUrl,
      authToken,
      SYSTEM_QUERIES.GET_VERSION,
      {}
    );
    
    if (data === null || data === undefined) {
      data = await callConvexQuery(
        deploymentUrl,
        authToken,
        '_system/frontend/getVersion.default',
        {}
      );
    }

    if (data && typeof data === 'object' && 'value' in data) {
      const versionValue = data.value;
      if (typeof versionValue === 'string') {
        return versionValue;
      }
      if (versionValue && typeof versionValue === 'object' && versionValue.version) {
        return String(versionValue.version);
      }
    }
    
    if (typeof data === 'string') {
      return data;
    }
    
    if (data && typeof data === 'object' && data.version) {
      return String(data.version);
    }
    
    return null;
  } catch (error) {
    // Return null on error
    return null;
  }
}

/**
 * Fetch insights from Big Brain API
 * @param deploymentUrl - The URL of the Convex deployment
 * @param authToken - The authentication token (prefer team access token for Big Brain API)
 * @param useMockData - Whether to use mock data instead of making API calls
 * @returns Array of insights, or empty array if none found
 */
export async function fetchInsights(
  deploymentUrl: string,
  authToken: string,
  useMockData = false
): Promise<Insight[]> {
  if (useMockData) {
    return [];
  }

  try {
    // Extract deployment name from URL
    const deploymentName = extractDeploymentName(deploymentUrl);

    if (!deploymentName) {
      return [];
    }

    // Big Brain API uses Bearer token, so strip "Convex " prefix if present
    const bearerToken = authToken.startsWith('Convex ') ? authToken.substring(7) : authToken;
    
    // Try multiple methods to get teamId
    let teamId: number | null = null;
    let projectId: number | null = null;
    let tokenDetails: { teamId?: number | string; type?: string; [key: string]: any } | null = null;

    // Method 1: Try to get teamId from token details (this endpoint might work)
    try {
      tokenDetails = await getTokenDetails(bearerToken);
      if (tokenDetails?.teamId) {
        teamId = typeof tokenDetails.teamId === 'string' 
          ? parseInt(tokenDetails.teamId, 10) 
          : tokenDetails.teamId;
      }
    } catch (error) {
      // Continue anyway
    }

    // Method 2: Try to get team ID from deployment name (may fail due to CORS)
    if (!teamId) {
      try {
        const teamInfo = await getTeamFromDeployment(deploymentName, bearerToken, true);
        if (teamInfo?.teamId) {
          teamId = teamInfo.teamId;
          projectId = teamInfo.projectId || null;
        }
      } catch (error) {
        // Try without Bearer prefix in case token format is different
        try {
          const teamInfo = await getTeamFromDeployment(deploymentName, authToken, false);
          if (teamInfo?.teamId) {
            teamId = teamInfo.teamId;
            projectId = teamInfo.projectId || null;
          }
        } catch (fallbackError) {
          // Continue anyway
        }
      }
    }

    if (!teamId) {
      return [];
    }

    // Check token type BEFORE making Big Brain API call
    // Project tokens and service account tokens cannot access Big Brain API endpoints
    // Reuse tokenDetails from Method 1 if available, otherwise fetch it
    if (!tokenDetails) {
      try {
        tokenDetails = await getTokenDetails(bearerToken);
      } catch (err) {
        // Continue if we can't check token type - we'll see the error from the Big Brain API
      }
    }
    
    if (tokenDetails?.type === 'projectToken') {
      return [];
    }

    // Get the period for data processing
    const period = useInsightsPeriod();

    // Call Big Brain API to get insights
    const insightsQueryId = '9ab3b74e-a725-480b-88a6-43e6bd70bd82';

    let insightsData;
    try {
      insightsData = await queryBigBrainUsage({
        teamId,
        queryId: insightsQueryId,
        projectId,
        deploymentName,
        period,
        componentPrefix: null,
        accessToken: bearerToken,
      });
    } catch (error) {
      
      // Handle specific error cases
      if (error instanceof Error) {
        // Service account tokens don't have access to Big Brain API
        if (error.message.includes('Service accounts cannot manage teams') || 
            error.message.includes('ServiceAccount') ||
            (error.message.includes('403') && error.message.includes('service'))) {
          return [];
        }
        
        // CORS errors
        if (error.message.includes('CORS')) {
          return [];
        }
        
        // Permission/authentication errors
        if (error.message.includes('403') || error.message.includes('Forbidden')) {
          return [];
        }
      }
      
      return [];
    }

    if (!insightsData || !Array.isArray(insightsData)) {
      return [];
    }

    // Transform the tuple format data: [kind, functionId, componentPath, detailsJSON]
    const transformed = transformInsightsData(insightsData, period.from);

    return transformed;
  } catch (error) {
    // Continue anyway
    return [];
  }
}

