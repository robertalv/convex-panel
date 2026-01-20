/**
 * API Helper Functions for Mobile App
 * Local helpers extracted from @convex-panel/shared
 */

import { ROUTES } from "./constants";
import type { FetchFn } from "./types";

/**
 * Normalize authentication token format
 * Ensures token has 'Convex ' prefix if not already present
 */
export function normalizeToken(authToken: string | undefined | null): string {
  if (!authToken) {
    throw new Error("Auth token is required");
  }
  return authToken && authToken.startsWith("Convex ")
    ? authToken
    : `Convex ${authToken}`;
}

/**
 * Call a Convex query function via HTTP API
 */
export async function callConvexQuery(
  deploymentUrl: string,
  authToken: string,
  functionPath: string,
  args: any = {},
  fetchFn: FetchFn,
): Promise<any> {
  try {
    let requestBody = {
      path: functionPath,
      args: [args],
    };

    let response = await fetchFn(`${deploymentUrl}${ROUTES.QUERY}`, {
      method: "POST",
      headers: {
        Authorization: normalizeToken(authToken),
        "Content-Type": "application/json",
        "Convex-Client": "dashboard-0.0.0",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok && response.status !== 404) {
      requestBody = {
        path: functionPath,
        args: args,
      };

      response = await fetchFn(`${deploymentUrl}${ROUTES.QUERY}`, {
        method: "POST",
        headers: {
          Authorization: normalizeToken(authToken),
          "Content-Type": "application/json",
          "Convex-Client": "dashboard-0.0.0",
        },
        body: JSON.stringify(requestBody),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();

      if (response.status === 404 || response.status === 400) {
        return null;
      }
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`,
      );
    }

    const result = await response.json();
    // Convex query API returns { status: "...", value: ... }
    // Extract the value if present, otherwise return the result as-is
    if (result && typeof result === "object" && "value" in result) {
      return result.value;
    }
    return result;
  } catch (error) {
    throw error;
  }
}

/**
 * Extract deployment name from deployment URL
 */
export function extractDeploymentName(deploymentUrl: string): string | null {
  if (!deploymentUrl) return null;

  try {
    const url = new URL(deploymentUrl);
    const hostname = url.hostname;

    // Format: {deployment-name}.convex.cloud
    if (hostname.endsWith(".convex.cloud")) {
      return hostname.replace(".convex.cloud", "");
    }

    // Format: {deployment-name}.convex.site
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
