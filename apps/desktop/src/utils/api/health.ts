/**
 * Health checks and insights
 * Handles fetching deployment health information, server version, and insights
 *
 * This module re-exports from shared API and adds mock data support
 */

import type { Insight } from "./types";

// Import from shared API
import {
  fetchInsights as sharedFetchInsights,
  fetchLastPushEvent as sharedFetchLastPushEvent,
  fetchServerVersion as sharedFetchServerVersion,
} from "../utils/api";

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
  useMockData = false,
): Promise<{ _creationTime: number } | null> {
  if (useMockData) {
    // Return mock data - 39 minutes ago
    const date = new Date();
    date.setMinutes(date.getMinutes() - 39);
    return {
      _creationTime: date.getTime(),
    };
  }

  return sharedFetchLastPushEvent(deploymentUrl, authToken);
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
  useMockData = false,
): Promise<string | null> {
  if (useMockData) {
    return "1.29.3";
  }

  return sharedFetchServerVersion(deploymentUrl, authToken);
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
  useMockData = false,
): Promise<Insight[]> {
  if (useMockData) {
    return [];
  }

  return sharedFetchInsights(deploymentUrl, authToken);
}
