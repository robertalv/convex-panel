/**
 * Shared helper functions used across API modules
 * These utilities are platform-agnostic and used by multiple feature modules
 */

import { ROUTES } from "../constants";

/**
 * Normalize authentication token format
 * Ensures token has 'Convex ' prefix if not already present
 * @param authToken - The authentication token to normalize
 * @returns The normalized authentication token
 */
export function normalizeToken(authToken: string | undefined | null): string {
  if (!authToken) {
    throw new Error('Auth token is required');
  }
  return authToken && authToken.startsWith('Convex ') ? authToken : `Convex ${authToken}`;
}

/**
 * Call a Convex query function via HTTP API
 * Convex HTTP API format: POST to /api/query with function path and args
 * @param deploymentUrl - The URL of the Convex deployment
 * @param authToken - The authentication token
 * @param functionPath - The path to the function (e.g., "_system/frontend/deploymentEvents:lastPushEvent")
 * @param args - Arguments to pass to the function
 * @returns The query result
 */
export async function callConvexQuery(
  deploymentUrl: string,
  authToken: string,
  functionPath: string,
  args: any = {}
): Promise<any> {
  try {
    let requestBody = {
      path: functionPath,
      args: [args],
    };
    
    let response = await fetch(`${deploymentUrl}${ROUTES.QUERY}`, {
      method: 'POST',
      headers: {
        'Authorization': normalizeToken(authToken),
        'Content-Type': 'application/json',
        'Convex-Client': 'dashboard-0.0.0',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok && response.status !== 404) {
      requestBody = {
        path: functionPath,
        args: args,
      };
      
      response = await fetch(`${deploymentUrl}${ROUTES.QUERY}`, {
        method: 'POST',
        headers: {
          'Authorization': normalizeToken(authToken),
          'Content-Type': 'application/json',
          'Convex-Client': 'dashboard-0.0.0',
        },
        body: JSON.stringify(requestBody),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      
      if (response.status === 404 || response.status === 400) {
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    throw error;
  }
}

/**
 * Serialize a Date to the format expected by Convex metrics API
 * @param date - The Date to serialize
 * @returns The serialized date
 */
export function serializeDate(date: Date): { secs_since_epoch: number; nanos_since_epoch: number } {
  const unixTsSeconds = date.getTime() / 1000;
  const secsSinceEpoch = Math.floor(unixTsSeconds);
  const nanosSinceEpoch = Math.floor((unixTsSeconds - secsSinceEpoch) * 1e9);
  return {
    secs_since_epoch: secsSinceEpoch,
    nanos_since_epoch: nanosSinceEpoch,
  };
}

/**
 * Parse a serialized date from Convex metrics API
 * @param date - The serialized date to parse
 * @returns The parsed Date
 */
export function parseDate(date: { secs_since_epoch: number; nanos_since_epoch: number }): Date {
  let unixTsMs = date.secs_since_epoch * 1000;
  unixTsMs += date.nanos_since_epoch / 1_000_000;
  return new Date(unixTsMs);
}

/**
 * Call a Convex mutation function via HTTP API
 * Convex HTTP API format: POST to /api/mutation with function path and args
 * @param deploymentUrl - The URL of the Convex deployment
 * @param authToken - The authentication token
 * @param functionPath - The path to the function (e.g., "_system/frontend/snapshotImport:confirm")
 * @param args - Arguments to pass to the function
 * @returns The mutation result
 */
export async function callConvexMutation(
  deploymentUrl: string,
  authToken: string,
  functionPath: string,
  args: any = {}
): Promise<any> {
  try {
    let requestBody = {
      path: functionPath,
      args: [args],
    };
    
    let response = await fetch(`${deploymentUrl}${ROUTES.MUTATION}`, {
      method: 'POST',
      headers: {
        'Authorization': normalizeToken(authToken),
        'Content-Type': 'application/json',
        'Convex-Client': 'dashboard-0.0.0',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok && response.status !== 404) {
      requestBody = {
        path: functionPath,
        args: args,
      };
      
      response = await fetch(`${deploymentUrl}${ROUTES.MUTATION}`, {
        method: 'POST',
        headers: {
          'Authorization': normalizeToken(authToken),
          'Content-Type': 'application/json',
          'Convex-Client': 'dashboard-0.0.0',
        },
        body: JSON.stringify(requestBody),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    throw error;
  }
}

