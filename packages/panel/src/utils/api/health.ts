/**
 * Health checks and insights
 * Handles fetching deployment health information, server version, and insights
 */

import type { Insight } from './types';
import { callConvexQuery } from './helpers';
import { SYSTEM_QUERIES } from '../constants';

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
 * Fetch insights from Convex
 * @param deploymentUrl - The URL of the Convex deployment
 * @param authToken - The authentication token for the Convex deployment
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
    const data = await callConvexQuery(
      deploymentUrl,
      authToken,
      SYSTEM_QUERIES.INSIGHTS_LIST,
      {}
    );

    if (data === null || data === undefined) {
      return [];
    }

    let insightsData = data;
    if (data && typeof data === 'object' && 'value' in data) {
      insightsData = data.value;
    }

    if (Array.isArray(insightsData)) {
      return insightsData;
    }

    if (insightsData && typeof insightsData === 'object' && 'insights' in insightsData) {
      return Array.isArray(insightsData.insights) ? insightsData.insights : [];
    }

    return [];
  } catch (error) {
    return [];
  }
}

